import { supabase } from '../supabase/client';

// Owner permanente — nunca perde acesso, mesmo sem a tabela super_admins
export const OWNER_EMAIL = 'eseqmotion@gmail.com';

export interface MonthlyPoint { month: string; label: string; matches: number; players: number; goals: number }

export class AdminRepository {

  // ── Controle de acesso (delegável) ────────────────────────────────────
  async isSuperAdmin(email?: string | null): Promise<boolean> {
    if (!email) return false;
    if (email.toLowerCase() === OWNER_EMAIL.toLowerCase()) return true;
    try {
      const { data } = await supabase
        .from('super_admins').select('email').eq('email', email.toLowerCase()).maybeSingle();
      return !!data;
    } catch {
      return false; // tabela ainda não existe → só o owner tem acesso
    }
  }

  async listAdmins(): Promise<{ email: string; added_by?: string; created_at?: string; owner: boolean }[]> {
    const base = [{ email: OWNER_EMAIL, owner: true }];
    try {
      const { data } = await supabase.from('super_admins').select('*').order('created_at', { ascending: true });
      const extra = (data ?? [])
        .filter((r: any) => r.email?.toLowerCase() !== OWNER_EMAIL.toLowerCase())
        .map((r: any) => ({ email: r.email, added_by: r.added_by, created_at: r.created_at, owner: false }));
      return [...base, ...extra];
    } catch {
      return base;
    }
  }

  async addAdmin(email: string, addedBy: string): Promise<void> {
    const { error } = await supabase.from('super_admins')
      .upsert({ email: email.toLowerCase().trim(), added_by: addedBy }, { onConflict: 'email' });
    if (error) throw error;
  }

  async removeAdmin(email: string): Promise<void> {
    if (email.toLowerCase() === OWNER_EMAIL.toLowerCase()) throw new Error('Não é possível remover o owner.');
    const { error } = await supabase.from('super_admins').delete().eq('email', email.toLowerCase());
    if (error) throw error;
  }

  // ── Estatísticas globais ──────────────────────────────────────────────
  async getGlobalStats() {
    const [
      { count: groupsCount },
      { count: playersCount },
      { count: activeMatchesCount },
      { count: totalMatchesCount },
      { count: totalGoals },
    ] = await Promise.all([
      supabase.from('groups').select('*', { count: 'exact', head: true }),
      supabase.from('players').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'Em curso'),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('type', 'Gol'),
    ]);
    return {
      groupsCount:        groupsCount        ?? 0,
      playersCount:       playersCount       ?? 0,
      activeMatchesCount: activeMatchesCount ?? 0,
      totalMatchesCount:  totalMatchesCount  ?? 0,
      totalGoals:         totalGoals         ?? 0,
    };
  }

  // ── Atividade mensal (para gráficos) ──────────────────────────────────
  async getActivitySeries(monthsBack = 6): Promise<MonthlyPoint[]> {
    const [{ data: matches }, { data: players }, { data: goals }] = await Promise.all([
      supabase.from('matches').select('created_at, date'),
      supabase.from('players').select('created_at'),
      supabase.from('events').select('created_at').eq('type', 'Gol'),
    ]);

    // Monta os últimos N meses (sem usar Date.now diretamente — base no maior created_at ou hoje)
    const now = new Date();
    const buckets: MonthlyPoint[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
        matches: 0, players: 0, goals: 0,
      });
    }
    const idx = new Map(buckets.map((b, i) => [b.month, i]));
    const keyOf = (iso?: string) => {
      if (!iso) return null;
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    (matches ?? []).forEach((m: any) => { const k = idx.get(keyOf(m.date ?? m.created_at) ?? ''); if (k !== undefined) buckets[k].matches++; });
    (players ?? []).forEach((p: any) => { const k = idx.get(keyOf(p.created_at) ?? '');         if (k !== undefined) buckets[k].players++; });
    (goals ?? []).forEach((g: any)   => { const k = idx.get(keyOf(g.created_at) ?? '');         if (k !== undefined) buckets[k].goals++; });

    return buckets;
  }

  // ── Engajamento ───────────────────────────────────────────────────────
  async getEngagement() {
    const [{ data: matches }, { data: goals }, { data: presence }] = await Promise.all([
      supabase.from('matches').select('group_id, date, created_at'),
      supabase.from('events').select('player_id').eq('type', 'Gol'),
      supabase.from('match_presence').select('player_id'),
    ]);

    const tally = (rows: any[], key: string) => {
      const m = new Map<string, number>();
      (rows ?? []).forEach(r => { const v = r[key]; if (v) m.set(v, (m.get(v) ?? 0) + 1); });
      return m;
    };

    const clubCount = tally(matches ?? [], 'group_id');
    const topClubs = [...clubCount.entries()]
      .map(([group_id, matches]) => ({ group_id, matches })).sort((a, b) => b.matches - a.matches).slice(0, 6);

    const goalCount = tally(goals ?? [], 'player_id');
    const topScorers = [...goalCount.entries()]
      .map(([player_id, goals]) => ({ player_id, goals })).sort((a, b) => b.goals - a.goals).slice(0, 6);

    const presCount = tally(presence ?? [], 'player_id');
    const topPresence = [...presCount.entries()]
      .map(([player_id, games]) => ({ player_id, games })).sort((a, b) => b.games - a.games).slice(0, 6);

    // Partidas por dia (últimos 14 dias)
    const now = new Date();
    const days: { key: string; label: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      days.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        label: `${d.getDate()}/${d.getMonth() + 1}`, count: 0,
      });
    }
    const dayIdx = new Map(days.map((d, i) => [d.key, i]));
    (matches ?? []).forEach((m: any) => {
      const iso = m.date ?? m.created_at; if (!iso) return;
      const d = new Date(iso);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const k = dayIdx.get(key); if (k !== undefined) days[k].count++;
    });

    return { topClubs, topScorers, topPresence, perDay: days };
  }

  // ── Push / Avisos ─────────────────────────────────────────────────────
  async getPushStats() {
    try {
      const { data } = await supabase.from('push_subscriptions').select('group_id');
      const m = new Map<string, number>();
      (data ?? []).forEach((s: any) => { if (s.group_id) m.set(s.group_id, (m.get(s.group_id) ?? 0) + 1); });
      return { total: data?.length ?? 0, perGroup: [...m.entries()].map(([group_id, count]) => ({ group_id, count })).sort((a, b) => b.count - a.count) };
    } catch {
      return { total: 0, perGroup: [] as { group_id: string; count: number }[] };
    }
  }

  // ── Listagens ─────────────────────────────────────────────────────────
  async getAllGroups() {
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, slug, logo_url, description, sport_type_default, founded_year, recurrence_day, created_at, owner_id')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data;
  }

  async getGroupDetails(groupId: string) {
    const [
      { data: players },
      { data: matches },
      { count: matchCount },
    ] = await Promise.all([
      supabase.from('players').select('id, name, positions, skill_level, rating, status, photo_url, phone').eq('group_id', groupId).order('name'),
      supabase.from('matches').select('id, date, status, home_team_name, away_team_name, home_score, away_score, modality, field_type').eq('group_id', groupId).order('created_at', { ascending: false }).limit(10),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('group_id', groupId),
    ]);
    return { players: players ?? [], matches: matches ?? [], matchCount: matchCount ?? 0 };
  }

  async getAllMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select('id, date, status, home_team_name, away_team_name, home_score, away_score, modality, field_type, group_id, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return [];
    return data;
  }

  async getAllPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select('id, name, full_name, phone, positions, skill_level, rating, status, is_mensalista, birth_date, photo_url, group_id, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) return [];
    return data;
  }

  async getAllFinances() {
    const { data, error } = await supabase
      .from('finances')
      .select('id, group_id, player_id, type, category, description, amount, status, date, created_at')
      .order('date', { ascending: false })
      .limit(500);
    if (error) return [];
    return data;
  }

  // ── Edição ────────────────────────────────────────────────────────────
  async updatePlayer(id: string, updates: Record<string, any>) {
    const { error } = await supabase.from('players').update(updates).eq('id', id);
    if (error) throw error;
  }

  async updateGroup(id: string, updates: Record<string, any>) {
    const { error } = await supabase.from('groups').update(updates).eq('id', id);
    if (error) throw error;
  }

  async updateMatch(id: string, updates: Record<string, any>) {
    const { error } = await supabase.from('matches').update(updates).eq('id', id);
    if (error) throw error;
  }

  // ── Exclusão ──────────────────────────────────────────────────────────
  async deleteGroup(id: string)  { const { error } = await supabase.from('groups').delete().eq('id', id);   if (error) throw error; }
  async deletePlayer(id: string) { const { error } = await supabase.from('players').delete().eq('id', id);  if (error) throw error; }
  async deleteMatch(id: string)  { const { error } = await supabase.from('matches').delete().eq('id', id);  if (error) throw error; }
}

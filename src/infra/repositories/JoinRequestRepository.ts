import { supabase } from '../supabase/client';

export interface JoinRequest {
  id: string;
  group_id: string;
  name: string;
  full_name?: string;
  nationality?: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  preferred_foot?: string;
  positions?: string[];
  height?: number;
  weight?: number;
  photo_url?: string;
  status: 'pendente' | 'aprovado' | 'recusado';
  created_at?: string;
}

export class JoinRequestRepository {
  private table = 'join_requests';

  async create(req: Omit<JoinRequest, 'id' | 'created_at' | 'status'>): Promise<JoinRequest> {
    const { data, error } = await supabase
      .from(this.table)
      .insert([{ ...req, status: 'pendente' }])
      .select()
      .single();
    if (error) throw error;
    return data as JoinRequest;
  }

  async findPendingByGroup(groupId: string): Promise<JoinRequest[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as JoinRequest[];
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(this.table).delete().eq('id', id);
    if (error) throw error;
  }

  /** Realtime: novas solicitações de entrada do grupo. */
  subscribeToGroup(groupId: string, onChange: () => void) {
    return supabase
      .channel(`join-requests:${groupId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: this.table,
        filter: `group_id=eq.${groupId}`,
      }, onChange)
      .subscribe();
  }
}

import { Player } from '@/core/entities/player';

/** Monta a mensagem de escalação dos times para compartilhar */
export function buildLineupMessage(
  homeTeamName: string,
  awayTeamName: string,
  homeTeam: Player[],
  awayTeam: Player[],
  extra?: { local?: string; data?: string; campo?: string },
): string {
  const lines: string[] = ['⚽ *ESCALAÇÃO DA PELADA*', ''];

  if (extra?.campo) lines.push(`🏟️ ${extra.campo}`);
  if (extra?.local) lines.push(`📍 ${extra.local}`);
  if (extra?.data)  lines.push(`📅 ${extra.data}`);
  if (extra?.campo || extra?.local || extra?.data) lines.push('');

  lines.push(`🟢 *${homeTeamName}*`);
  homeTeam.forEach((p, i) => lines.push(`${i + 1}. ${p.name}`));
  lines.push('');
  lines.push(`⚪ *${awayTeamName}*`);
  awayTeam.forEach((p, i) => lines.push(`${i + 1}. ${p.name}`));
  lines.push('');
  lines.push('_Sorteado no Partidas Pro_ 🎯');

  return lines.join('\n');
}

/** Monta a mensagem de resultado final */
export function buildResultMessage(
  homeTeamName: string,
  awayTeamName: string,
  homeScore: number,
  awayScore: number,
  scorers?: { name: string; team: 'home' | 'away'; goals: number }[],
): string {
  const lines: string[] = ['🏁 *FIM DE JOGO*', ''];
  const winner = homeScore > awayScore ? homeTeamName : awayScore > homeScore ? awayTeamName : null;

  lines.push(`*${homeTeamName}* ${homeScore} x ${awayScore} *${awayTeamName}*`);
  lines.push('');

  if (winner) lines.push(`🏆 Vitória do *${winner}*!`);
  else        lines.push('🤝 Empate!');

  if (scorers && scorers.length > 0) {
    lines.push('');
    lines.push('⚽ *Gols:*');
    scorers.forEach(s => lines.push(`• ${s.name}${s.goals > 1 ? ` (${s.goals})` : ''}`));
  }

  lines.push('');
  lines.push('_Partidas Pro_ 🎯');
  return lines.join('\n');
}

/** Monta convite para a próxima sessão */
export function buildInviteMessage(
  groupName: string,
  data: string,
  local: string,
  rsvpLink?: string,
): string {
  const lines: string[] = [
    `⚽ *${groupName}* — Bora pra pelada!`, '',
    `📅 ${data}`,
  ];
  if (local) lines.push(`📍 ${local}`);
  if (rsvpLink) {
    lines.push('');
    lines.push('Confirme sua presença:');
    lines.push(rsvpLink);
  }
  return lines.join('\n');
}

/** Abre o WhatsApp com a mensagem pré-preenchida */
export function openWhatsApp(message: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  if (typeof window !== 'undefined') window.open(url, '_blank');
}

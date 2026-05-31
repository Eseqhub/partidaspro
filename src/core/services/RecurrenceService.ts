export const WEEKDAY_NAMES = [
  'Domingo', 'Segunda-feira', 'Terça-feira',
  'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado',
];

const WEEKDAY_INDEX: Record<string, number> = Object.fromEntries(
  WEEKDAY_NAMES.map((d, i) => [d, i])
);

const RECORRENCIA_DAYS: Record<string, number> = {
  semanal: 7, quinzenal: 14, mensal: 30,
};

/** Serializa array de dias para string (salva no banco) */
export function serializeDias(dias: string[]): string {
  return dias.join(',');
}

/** Desserializa string do banco para array */
export function parseDias(raw?: string | null): string[] {
  if (!raw) return [];
  return raw.split(',').map(d => d.trim()).filter(Boolean);
}

/**
 * Calcula a próxima data de recorrência a partir da última sessão.
 * Com vários dias na semana, escolhe o próximo dia selecionado (pode ser na
 * mesma semana — ex: jogou terça, próxima é quinta).
 */
export function calcNextDate(
  lastDate: string,
  recorrencia: string,
  recorrenciaDia?: string | null,
): Date {
  const base = new Date(lastDate + 'T12:00:00');
  const dias = parseDias(recorrenciaDia);

  if (dias.length > 0) {
    const targetIndexes = dias.map(d => WEEKDAY_INDEX[d] ?? -1).filter(i => i >= 0);
    // Quinzenal/mensal pulam semanas extras antes de procurar o próximo dia
    const extraDays = recorrencia === 'quinzenal' ? 7 : recorrencia === 'mensal' ? 21 : 0;

    const candidate = new Date(base);
    candidate.setDate(candidate.getDate() + 1 + extraDays); // pelo menos o dia seguinte
    for (let i = 0; i < 14; i++) {
      if (targetIndexes.includes(candidate.getDay())) return candidate;
      candidate.setDate(candidate.getDate() + 1);
    }
  }

  // Sem dia específico: adiciona o intervalo padrão
  const next = new Date(base);
  next.setDate(next.getDate() + (RECORRENCIA_DAYS[recorrencia] ?? 7));
  return next;
}

/** Label resumido dos dias — ex: "TER · QUI" */
export function labelDias(raw?: string | null): string {
  const dias = parseDias(raw);
  if (!dias.length) return '';
  return dias.map(d => d.substring(0, 3).toUpperCase()).join(' · ');
}

/** Formata data para exibição em PT-BR */
export function fmtDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

/** Formata para input type="date" (YYYY-MM-DD) */
export function toInputDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

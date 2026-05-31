const WEEKDAY_INDEX: Record<string, number> = {
  'Domingo': 0, 'Segunda-feira': 1, 'Terça-feira': 2,
  'Quarta-feira': 3, 'Quinta-feira': 4, 'Sexta-feira': 5, 'Sábado': 6,
};

const RECORRENCIA_DAYS: Record<string, number> = {
  semanal: 7, quinzenal: 14, mensal: 30,
};

/**
 * Calcula a próxima data de recorrência a partir da última sessão.
 * Se recorrencia_dia estiver definido, encontra o próximo dia da semana correto.
 */
export function calcNextDate(
  lastDate: string,
  recorrencia: string,
  recorrenciaDia?: string | null,
): Date {
  const base = new Date(lastDate + 'T12:00:00');
  const daysToAdd = RECORRENCIA_DAYS[recorrencia] ?? 7;

  if (recorrenciaDia && WEEKDAY_INDEX[recorrenciaDia] !== undefined) {
    // Encontra o próximo dia da semana correto após o intervalo mínimo
    const minDate = new Date(base);
    minDate.setDate(minDate.getDate() + daysToAdd - 3); // tolerância de 3 dias
    const targetDay = WEEKDAY_INDEX[recorrenciaDia];
    let candidate = new Date(minDate);
    while (candidate.getDay() !== targetDay) {
      candidate.setDate(candidate.getDate() + 1);
    }
    return candidate;
  }

  // Sem dia específico: adiciona os dias normalmente
  const next = new Date(base);
  next.setDate(next.getDate() + daysToAdd);
  return next;
}

/** Formata data para exibição em PT-BR */
export function fmtDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

/** Formata para input type="date" (YYYY-MM-DD) */
export function toInputDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

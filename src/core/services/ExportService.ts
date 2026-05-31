/** Exportação de dados para CSV (sem dependências). */

function escapeCell(value: any): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (Array.isArray(value)) s = value.join(' | ');
  // Escapa aspas e envolve se tiver vírgula/quebra/aspas
  if (/[",\n;]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Gera e baixa um CSV a partir de uma lista de objetos.
 * As colunas são derivadas das chaves do primeiro objeto (ou de `columns`).
 */
export function exportToCsv(
  filename: string,
  rows: Record<string, any>[],
  columns?: { key: string; label: string }[],
): void {
  if (typeof window === 'undefined') return;
  if (!rows.length) { alert('Nada para exportar.'); return; }

  const cols = columns ?? Object.keys(rows[0]).map(k => ({ key: k, label: k }));
  const header = cols.map(c => escapeCell(c.label)).join(',');
  const body = rows.map(r => cols.map(c => escapeCell(r[c.key])).join(',')).join('\n');
  const csv = '﻿' + header + '\n' + body; // BOM p/ acentos no Excel

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

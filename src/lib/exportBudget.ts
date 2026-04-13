import type { BudgetState } from '@/src/state/budgetStore';

export type FluxExportV1 = {
  exportedAt: string;
  format: 'flux-backup';
  formatVersion: 1;
  data: BudgetState;
};

export function buildExportJson(state: BudgetState): string {
  const payload: FluxExportV1 = {
    exportedAt: new Date().toISOString(),
    format: 'flux-backup',
    formatVersion: 1,
    data: state,
  };
  return JSON.stringify(payload, null, 2);
}

function escapeCsvField(s: string): string {
  const flat = s.replace(/\r?\n/g, ' ').trim();
  if (/[",]/.test(flat)) {
    return `"${flat.replace(/"/g, '""')}"`;
  }
  return flat;
}

/** Flat CSV of income streams, bills, and payday lines — easy to open in Sheets or Excel. */
export function buildExportCsv(state: BudgetState): string {
  const rows: string[] = ['type,id,label,amount,month,note,recurrence,one_time_month'];
  for (const s of state.incomeStreams) {
    const rec = s.recurrence ?? 'recurring';
    const oneMo = s.recurrence === 'one_time' && s.oneTimeMonth ? s.oneTimeMonth : '';
    rows.push(
      [
        'income',
        s.id,
        escapeCsvField(s.label),
        String(s.amountNgn),
        '',
        escapeCsvField(s.note ?? ''),
        rec,
        oneMo,
      ].join(','),
    );
  }
  for (const b of state.billItems) {
    rows.push(['bill', b.id, escapeCsvField(b.label), String(b.amount), '', ''].join(','));
  }
  for (const l of state.lines) {
    rows.push(['line', l.id, escapeCsvField(l.label), String(l.amount), l.month, ''].join(','));
  }
  return rows.join('\n');
}

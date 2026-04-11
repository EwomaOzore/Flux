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

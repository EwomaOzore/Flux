import type { MonthId } from './month';
import { applyIphoneSpread } from './iphoneLines';
import type { IPhoneBalanceMonths, PaydayLine } from './types';

/** Demo scenario seeded from your working numbers (edit freely in the app). */
export function createSeedLines(
  iphoneBalanceMonths: IPhoneBalanceMonths,
  iphoneFirstBalanceMonth: MonthId = '2026-06'
): PaydayLine[] {
  const base: PaydayLine[] = [
    {
      id: 'apr-loan-once',
      month: '2026-04' as MonthId,
      label: 'Loans (one-time payoff)',
      amount: 681_810,
    },
    {
      id: 'apr-vacuum',
      month: '2026-04' as MonthId,
      label: 'Vacuum',
      amount: 99_700,
    },
    {
      id: 'apr-ps5-1',
      month: '2026-04' as MonthId,
      label: 'PS5 / CdCare (1/4)',
      amount: 373_936,
    },
    {
      id: 'may-ps5-2',
      month: '2026-05' as MonthId,
      label: 'PS5 / CdCare (2/4)',
      amount: 373_936,
    },
    {
      id: 'may-iphone-40',
      month: '2026-05' as MonthId,
      label: 'iPhone — 40% down',
      amount: 780_000,
    },
    {
      id: 'jun-ps5-3',
      month: '2026-06' as MonthId,
      label: 'PS5 / CdCare (3/4)',
      amount: 370_788,
    },
    {
      id: 'jul-ps5-4',
      month: '2026-07' as MonthId,
      label: 'PS5 / CdCare (4/4)',
      amount: 370_788,
    },
    {
      id: 'aug-rent-reserve',
      month: '2026-08' as MonthId,
      label: 'Rent reserve',
      amount: 530_000,
    },
    {
      id: 'sep-rent-reserve',
      month: '2026-09' as MonthId,
      label: 'Rent reserve',
      amount: 530_000,
    },
    {
      id: 'oct-rent-reserve',
      month: '2026-10' as MonthId,
      label: 'Rent reserve',
      amount: 530_000,
    },
    {
      id: 'nov-rent-due',
      month: '2026-11' as MonthId,
      label: 'Annual rent (due)',
      amount: 1_700_000,
    },
  ];

  return applyIphoneSpread(base, iphoneFirstBalanceMonth, iphoneBalanceMonths);
}

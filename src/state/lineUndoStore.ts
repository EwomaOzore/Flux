import { create } from 'zustand';

import type { MonthId } from '@/src/domain/month';
import type { PaydayLine } from '@/src/domain/types';

export type LineUndoPayload =
  | { kind: 'delete'; line: PaydayLine }
  | { kind: 'defer'; lineId: string; previousMonth: MonthId };

type LineUndoState = {
  payload: LineUndoPayload | null;
  show: (p: LineUndoPayload) => void;
  clear: () => void;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;
const UNDO_MS = 6500;

export const useLineUndoStore = create<LineUndoState>((set) => ({
  payload: null,
  show: (p) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ payload: p });
    hideTimer = setTimeout(() => {
      set({ payload: null });
      hideTimer = null;
    }, UNDO_MS);
  },
  clear: () => {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = null;
    set({ payload: null });
  },
}));

export function scheduleLineUndo(payload: LineUndoPayload) {
  useLineUndoStore.getState().show(payload);
}

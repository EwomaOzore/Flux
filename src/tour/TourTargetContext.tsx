import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

import type { TourTargetId } from "@/src/lib/tourSteps";

export type TourRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

type MeasureFn = () => Promise<TourRect | null>;

type TourTargetContextValue = {
  register: (id: TourTargetId, measure: MeasureFn) => () => void;
  measure: (id: TourTargetId) => Promise<TourRect | null>;
};

const TourTargetContext = createContext<TourTargetContextValue | null>(null);

export function TourTargetProvider({ children }: { children: ReactNode }) {
  const measures = useRef(new Map<TourTargetId, MeasureFn>());

  const register = useCallback((id: TourTargetId, measure: MeasureFn) => {
    measures.current.set(id, measure);
    return () => {
      if (measures.current.get(id) === measure) {
        measures.current.delete(id);
      }
    };
  }, []);

  const measure = useCallback(async (id: TourTargetId) => {
    const fn = measures.current.get(id);
    if (!fn) return null;
    try {
      return await fn();
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(() => ({ register, measure }), [register, measure]);

  return (
    <TourTargetContext.Provider value={value}>
      {children}
    </TourTargetContext.Provider>
  );
}

export function useTourTargetRegistry(): TourTargetContextValue {
  const ctx = useContext(TourTargetContext);
  if (!ctx) {
    throw new Error("useTourTargetRegistry requires TourTargetProvider");
  }
  return ctx;
}

/** Safe hook for screens that may render outside the provider during SSR. */
export function useOptionalTourTargetRegistry(): TourTargetContextValue | null {
  return useContext(TourTargetContext);
}

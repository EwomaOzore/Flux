import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import {
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from "react-native";

import type { TourTargetId } from "@/src/lib/tourSteps";

export type TourRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

type MeasureFn = () => Promise<TourRect | null>;
type EnsureVisibleFn = () => Promise<boolean>;

type TargetFns = {
  measure: MeasureFn;
  ensureVisible: EnsureVisibleFn;
};

type TourTargetContextValue = {
  register: (
    id: TourTargetId,
    measure: MeasureFn,
    ensureVisible?: EnsureVisibleFn,
  ) => () => void;
  measure: (id: TourTargetId) => Promise<TourRect | null>;
  /** Scrolls the target into its parent ScreenScroll / tour scroll view if needed. */
  ensureVisible: (id: TourTargetId) => Promise<boolean>;
};

export type TourScrollApi = {
  /** Returns true if a scroll animation was started. */
  ensureRectVisible: (rect: TourRect) => Promise<boolean>;
};

const TourTargetContext = createContext<TourTargetContextValue | null>(null);
const TourScrollContext = createContext<TourScrollApi | null>(null);

const EDGE_PAD = 48;

export function TourTargetProvider({ children }: { children: ReactNode }) {
  const targets = useRef(new Map<TourTargetId, TargetFns>());

  const register = useCallback(
    (
      id: TourTargetId,
      measure: MeasureFn,
      ensureVisible: EnsureVisibleFn = async () => false,
    ) => {
      const fns: TargetFns = { measure, ensureVisible };
      targets.current.set(id, fns);
      return () => {
        if (targets.current.get(id) === fns) {
          targets.current.delete(id);
        }
      };
    },
    [],
  );

  const measure = useCallback(async (id: TourTargetId) => {
    const fns = targets.current.get(id);
    if (!fns) return null;
    try {
      return await fns.measure();
    } catch {
      return null;
    }
  }, []);

  const ensureVisible = useCallback(async (id: TourTargetId) => {
    const fns = targets.current.get(id);
    if (!fns) return false;
    try {
      return await fns.ensureVisible();
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({ register, measure, ensureVisible }),
    [register, measure, ensureVisible],
  );

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

export function useTourScrollApi(): TourScrollApi | null {
  return useContext(TourScrollContext);
}

/**
 * Hook for ScrollView hosts (ScreenScroll, Home) so tour targets can
 * scroll themselves into the visible viewport.
 *
 * `viewportRef` should wrap the ScrollView (same size as the visible area).
 */
export function useTourScrollRegistration(
  scrollRef: RefObject<ScrollView | null>,
  viewportRef: RefObject<View | null>,
): {
  scrollApi: TourScrollApi;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle: number;
} {
  const offsetY = useRef(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetY.current = e.nativeEvent.contentOffset.y;
  }, []);

  const scrollApi = useMemo<TourScrollApi>(
    () => ({
      ensureRectVisible: (rect) => {
        const sv = scrollRef.current;
        const viewport = viewportRef.current;
        if (!sv || !viewport) return Promise.resolve(false);

        return new Promise((resolve) => {
          viewport.measureInWindow((sx, sy, _sw, sh) => {
            if (sh <= 0) {
              resolve(false);
              return;
            }
            const visibleTop = sy + EDGE_PAD;
            const visibleBottom = sy + sh - EDGE_PAD;
            const targetTop = rect.y;
            const targetBottom = rect.y + rect.height;

            let delta = 0;
            if (targetTop < visibleTop) {
              delta = targetTop - visibleTop;
            } else if (targetBottom > visibleBottom) {
              delta = targetBottom - visibleBottom;
            }

            if (Math.abs(delta) < 6) {
              resolve(false);
              return;
            }

            const nextY = Math.max(0, offsetY.current + delta);
            sv.scrollTo({ y: nextY, animated: true });
            offsetY.current = nextY;
            resolve(true);
          });
        });
      },
    }),
    [scrollRef, viewportRef],
  );

  return { scrollApi, onScroll, scrollEventThrottle: 16 };
}

export function TourScrollProvider({
  api,
  children,
}: {
  api: TourScrollApi;
  children: ReactNode;
}) {
  return (
    <TourScrollContext.Provider value={api}>
      {children}
    </TourScrollContext.Provider>
  );
}

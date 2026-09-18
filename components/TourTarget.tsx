import { useEffect, useRef, type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import type { TourTargetId } from "@/src/lib/tourSteps";
import {
  useOptionalTourTargetRegistry,
  useTourScrollApi,
} from "@/src/tour/TourTargetContext";

type Props = {
  readonly id: TourTargetId;
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
};

/** Registers a measurable hotspot for the interactive guided tour. */
export function TourTarget({ id, children, style }: Props) {
  const registry = useOptionalTourTargetRegistry();
  const scrollApi = useTourScrollApi();
  const ref = useRef<View>(null);

  useEffect(() => {
    if (!registry) return;

    const measure = () =>
      new Promise<{
        x: number;
        y: number;
        width: number;
        height: number;
      } | null>((resolve) => {
        const node = ref.current;
        if (!node) {
          resolve(null);
          return;
        }
        node.measureInWindow((x, y, width, height) => {
          if (width <= 0 || height <= 0) {
            resolve(null);
            return;
          }
          resolve({ x, y, width, height });
        });
      });

    const ensureVisible = async () => {
      if (!scrollApi) return false;
      const rect = await measure();
      if (!rect) return false;
      return scrollApi.ensureRectVisible(rect);
    };

    return registry.register(id, measure, ensureVisible);
  }, [id, registry, scrollApi]);

  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}

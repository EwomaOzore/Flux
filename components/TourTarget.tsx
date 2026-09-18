import { useEffect, useRef, type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import type { TourTargetId } from "@/src/lib/tourSteps";
import { useOptionalTourTargetRegistry } from "@/src/tour/TourTargetContext";

type Props = {
  readonly id: TourTargetId;
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
};

/** Registers a measurable hotspot for the interactive guided tour. */
export function TourTarget({ id, children, style }: Props) {
  const registry = useOptionalTourTargetRegistry();
  const ref = useRef<View>(null);

  useEffect(() => {
    if (!registry) return;
    return registry.register(id, () => {
      return new Promise((resolve) => {
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
    });
  }, [id, registry]);

  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}

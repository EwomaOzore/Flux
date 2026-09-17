import { useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

import { useAppearanceStore } from "@/src/state/appearanceStore";

function useWebSystemScheme(): "light" | "dark" {
  const rnSystem = useSystemColorScheme();
  const [webSystem, setWebSystem] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return rnSystem === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      setWebSystem(e.matches ? "dark" : "light");
    };
    setWebSystem(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return webSystem;
}

/** Web: respect Settings preference; follow prefers-color-scheme when System. */
export function useColorScheme(): "light" | "dark" {
  const preference = useAppearanceStore((s) => s.preference);
  const system = useWebSystemScheme();

  if (preference === "light" || preference === "dark") {
    return preference;
  }
  return system;
}

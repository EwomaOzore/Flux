import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";

type FabOverlayContextValue = {
  setFab: (node: ReactNode | null) => void;
};

const FabOverlayContext = createContext<FabOverlayContextValue | null>(null);

/** Hosts a home FAB above the tab bar (TopTabs paints the bar over screen content). */
export function FabOverlayProvider({ children }: { children: ReactNode }) {
  const [fab, setFabState] = useState<ReactNode | null>(null);
  const setFab = useCallback((node: ReactNode | null) => {
    setFabState(node);
  }, []);
  const value = useMemo(() => ({ setFab }), [setFab]);

  return (
    <FabOverlayContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={styles.overlay}>
        {fab}
      </View>
    </FabOverlayContext.Provider>
  );
}

export function useFabOverlay(): FabOverlayContextValue {
  const ctx = useContext(FabOverlayContext);
  if (!ctx) {
    throw new Error("useFabOverlay requires FabOverlayProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    elevation: 100,
  },
});

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";
import { useFluxPalette } from "@/components/ui";
import { radii, spacing } from "@/constants/theme";

export { BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";

const DEFAULT_SNAP_POINTS = ["75%"] as const;

type FluxBottomSheetProps = {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly snapPoints?: (string | number)[];
  readonly enableDynamicSizing?: boolean;
  readonly enablePanDownToClose?: boolean;
  /** `scroll` = one BottomSheetScrollView child (default). `view` = one BottomSheetView child. */
  readonly variant?: "scroll" | "view";
};

export function FluxBottomSheet({
  visible,
  onClose,
  children,
  snapPoints,
  enableDynamicSizing = false,
  enablePanDownToClose = true,
  variant = "scroll",
}: FluxBottomSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const wasVisibleRef = useRef(false);
  const { palette } = useFluxPalette();

  const points = useMemo(
    () => snapPoints ?? [...DEFAULT_SNAP_POINTS],
    [snapPoints],
  );

  useEffect(() => {
    if (visible) {
      wasVisibleRef.current = true;
      const frame = requestAnimationFrame(() => {
        ref.current?.present();
      });
      return () => cancelAnimationFrame(frame);
    }
    if (wasVisibleRef.current) {
      ref.current?.dismiss();
      wasVisibleRef.current = false;
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    wasVisibleRef.current = false;
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.55}
        pressBehavior="close"
      />
    ),
    [],
  );

  const body =
    variant === "view" ? (
      <BottomSheetView style={styles.viewBody}>{children}</BottomSheetView>
    ) : (
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {children}
      </BottomSheetScrollView>
    );

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={enableDynamicSizing ? undefined : points}
      enableDynamicSizing={enableDynamicSizing}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      enablePanDownToClose={enablePanDownToClose}
      stackBehavior="push"
      handleIndicatorStyle={{
        backgroundColor: palette.borderStrong,
        width: 36,
      }}
      backgroundStyle={{
        backgroundColor: palette.surface,
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
      }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {body}
    </BottomSheetModal>
  );
}

type HeaderProps = {
  readonly title: string;
  readonly onClose: () => void;
  readonly subtitle?: string;
  readonly closeLabel?: string;
};

export function FluxBottomSheetHeader({
  title,
  onClose,
  subtitle,
  closeLabel = "Done",
}: HeaderProps) {
  const { palette } = useFluxPalette();
  return (
    <View>
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        <Pressable
          onPress={onClose}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
        >
          <Text style={{ color: palette.tint, fontSize: 17, fontWeight: "700" }}>
            {closeLabel}
          </Text>
        </Pressable>
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  viewBody: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});

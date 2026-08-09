import { Text } from "@/components/Themed";
import { useFluxPalette } from "@/components/ui";
import { radii, spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
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
      <BottomSheetView
        style={[styles.viewBody, { backgroundColor: palette.background }]}
      >
        {children}
      </BottomSheetView>
    ) : (
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: palette.background },
        ]}
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
        backgroundColor: palette.cardBorder,
        width: 36,
      }}
      style={{ backgroundColor: palette.background }}
      containerStyle={{ backgroundColor: "transparent" }}
      backgroundStyle={{
        backgroundColor: palette.background,
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
  const { palette, colorScheme } = useFluxPalette();
  const accent = colorScheme === "dark" ? "#48B872" : "#2B7A50";
  return (
    <View>
      <View style={[styles.header, { borderBottomColor: palette.cardBorder }]}>
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        <Pressable
          onPress={onClose}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
        >
          <Text style={[styles.close, { color: accent }]}>{closeLabel}</Text>
        </Pressable>
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>
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
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: typeface.displayRegular,
    fontSize: 18,
    lineHeight: 18,
    letterSpacing: -0.45,
  },
  close: {
    fontFamily: typeface.bold,
    fontSize: 15,
  },
  subtitle: {
    fontFamily: typeface.regular,
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});

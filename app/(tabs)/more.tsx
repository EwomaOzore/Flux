import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  View as RNView,
  StyleSheet,
  Switch,
} from "react-native";

import { Text } from "@/components/Themed";
import { ScreenScroll, useFluxPalette } from "@/components/ui";
import { radii, spacing } from "@/constants/theme";
import {
  applyReminderPrefs,
  defaultReminderPrefs,
  loadReminderPrefs,
  type ReminderPrefs,
} from "@/src/lib/paydayReminders";

type MenuRowProps = {
  readonly href: "/upcoming" | "/backup";
  readonly icon: React.ComponentProps<typeof FontAwesome>["name"];
  readonly title: string;
  readonly subtitle: string;
  readonly palette: ReturnType<typeof useFluxPalette>["palette"];
};

function MenuRow({ href, icon, title, subtitle, palette }: MenuRowProps) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        style={({ pressed }) => [
          styles.row,
          {
            borderBottomColor: palette.border,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <RNView style={styles.rowMain}>
          <FontAwesome name={icon} size={16} color={palette.tintStrong} />
          <RNView style={styles.textCol}>
            <Text style={[styles.rowTitle, { color: palette.text }]}>
              {title}
            </Text>
            <Text style={[styles.rowSub, { color: palette.textMuted }]}>
              {subtitle}
            </Text>
          </RNView>
        </RNView>
        <RNView style={styles.chevronWrap}>
          <FontAwesome
            name="chevron-right"
            size={14}
            color={palette.textMuted}
          />
        </RNView>
      </Pressable>
    </Link>
  );
}

export default function MoreScreen() {
  const { palette } = useFluxPalette();
  const [reminderPrefs, setReminderPrefs] =
    useState<ReminderPrefs>(defaultReminderPrefs);

  useEffect(() => {
    loadReminderPrefs()
      .then(setReminderPrefs)
      .catch(() => {});
  }, []);

  const onReminderToggle = async (enabled: boolean) => {
    const next = { ...reminderPrefs, enabled };
    setReminderPrefs(next);
    const ok = await applyReminderPrefs(next);
    if (enabled && !ok) {
      setReminderPrefs((p) => ({ ...p, enabled: false }));
      Alert.alert(
        "Notifications off",
        "Allow notifications for Flux in system settings to get payday reminders.",
      );
    }
  };

  const onReminderEveToggle = async (alsoRemindEve: boolean) => {
    const next = { ...reminderPrefs, alsoRemindEve };
    setReminderPrefs(next);
    await applyReminderPrefs(next);
  };

  const onReminderDayChange = async (nextDay: number) => {
    const day = Math.max(1, Math.min(28, nextDay));
    const next = { ...reminderPrefs, dayOfMonth: day };
    setReminderPrefs(next);
    await applyReminderPrefs(next);
  };

  const onReminderTimePreset = async (hour: number, minute: number) => {
    const next = { ...reminderPrefs, hour, minute };
    setReminderPrefs(next);
    await applyReminderPrefs(next);
  };

  return (
    <ScreenScroll>
      <RNView style={styles.section}>
        <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>
          Planning tools
        </Text>
        <RNView style={styles.sectionRows}>
          <MenuRow
            href="/upcoming"
            icon="clock-o"
            title="Upcoming"
            subtitle="See the next three payday runs at a glance."
            palette={palette}
          />
          <MenuRow
            href="/backup"
            icon="download"
            title="Backup & import"
            subtitle="Export files, import snapshots, and review activity."
            palette={palette}
          />
        </RNView>
      </RNView>

      <RNView style={styles.section}>
        <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>
          Notifications
        </Text>
        <RNView
          style={[
            styles.reminderCard,
            { borderColor: palette.border, backgroundColor: palette.surface },
          ]}
        >
          <RNView style={styles.reminderRow}>
            <RNView style={styles.reminderTextCol}>
              <Text style={[styles.rowTitle, { color: palette.text }]}>
                Payday reminder
              </Text>
              <Text style={[styles.rowSub, { color: palette.textMuted }]}>
                Day {reminderPrefs.dayOfMonth} at{" "}
                {String(reminderPrefs.hour).padStart(2, "0")}:
                {String(reminderPrefs.minute).padStart(2, "0")}
              </Text>
            </RNView>
            <Switch
              accessibilityLabel="Toggle payday reminder"
              value={reminderPrefs.enabled}
              onValueChange={onReminderToggle}
              trackColor={{ false: palette.border, true: palette.tintMuted }}
              thumbColor={palette.surface}
            />
          </RNView>
          {reminderPrefs.enabled ? (
            <>
              <RNView style={styles.reminderDivider} />
              <RNView style={styles.reminderRow}>
                <Text style={[styles.rowTitle, { color: palette.text }]}>
                  Check-in day
                </Text>
                <RNView style={styles.stepperWrap}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      void onReminderDayChange(reminderPrefs.dayOfMonth - 1)
                    }
                    style={({ pressed }) => [
                      styles.stepperBtn,
                      {
                        opacity: pressed ? 0.85 : 1,
                        borderColor: palette.borderStrong,
                        backgroundColor: palette.surfaceMuted,
                      },
                    ]}
                  >
                    <Text style={{ color: palette.text }}>-</Text>
                  </Pressable>
                  <Text
                    style={{ color: palette.textSecondary, fontWeight: "700" }}
                  >
                    Day {reminderPrefs.dayOfMonth}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      void onReminderDayChange(reminderPrefs.dayOfMonth + 1)
                    }
                    style={({ pressed }) => [
                      styles.stepperBtn,
                      {
                        opacity: pressed ? 0.85 : 1,
                        borderColor: palette.borderStrong,
                        backgroundColor: palette.surfaceMuted,
                      },
                    ]}
                  >
                    <Text style={{ color: palette.text }}>+</Text>
                  </Pressable>
                </RNView>
              </RNView>
              <RNView style={styles.chipRow}>
                {[
                  { label: "08:00", hour: 8, minute: 0 },
                  { label: "09:00", hour: 9, minute: 0 },
                  { label: "18:00", hour: 18, minute: 0 },
                ].map((t) => {
                  const selected =
                    reminderPrefs.hour === t.hour &&
                    reminderPrefs.minute === t.minute;
                  return (
                    <Pressable
                      key={t.label}
                      accessibilityRole="button"
                      onPress={() =>
                        void onReminderTimePreset(t.hour, t.minute)
                      }
                      style={({ pressed }) => [
                        styles.timeChip,
                        {
                          borderColor: selected ? palette.tint : palette.border,
                          backgroundColor: selected
                            ? palette.tintMuted
                            : palette.surfaceMuted,
                          opacity: pressed ? 0.9 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: selected
                            ? palette.tintStrong
                            : palette.textSecondary,
                          fontWeight: "700",
                        }}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </RNView>
              {reminderPrefs.dayOfMonth > 1 ? (
                <RNView style={styles.reminderRow}>
                  <RNView style={styles.reminderTextCol}>
                    <Text style={[styles.rowTitle, { color: palette.text }]}>
                      Day-before ping
                    </Text>
                    <Text style={[styles.rowSub, { color: palette.textMuted }]}>
                      Also remind on day {reminderPrefs.dayOfMonth - 1}.
                    </Text>
                  </RNView>
                  <Switch
                    accessibilityLabel="Toggle day-before payday reminder"
                    value={reminderPrefs.alsoRemindEve}
                    onValueChange={(v) => void onReminderEveToggle(v)}
                    trackColor={{
                      false: palette.border,
                      true: palette.tintMuted,
                    }}
                    thumbColor={palette.surface}
                  />
                </RNView>
              ) : null}
            </>
          ) : null}
        </RNView>
      </RNView>

      <RNView style={styles.section}>
        <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>
          About
        </Text>
        <Link href="/modal" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="About Flux"
            style={({ pressed }) => [
              styles.row,
              {
                borderTopColor: palette.border,
                borderBottomColor: palette.border,
                borderTopWidth: StyleSheet.hairlineWidth,
                backgroundColor: palette.surface,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <RNView style={styles.rowMain}>
              <FontAwesome
                name="question-circle-o"
                size={16}
                color={palette.tintStrong}
              />
              <RNView style={styles.textCol}>
                <Text style={[styles.rowTitle, { color: palette.text }]}>
                  About Flux
                </Text>
                <Text style={[styles.rowSub, { color: palette.textMuted }]}>
                  How cushion and payday planning works.
                </Text>
              </RNView>
            </RNView>
            <RNView style={styles.chevronWrap}>
              <FontAwesome
                name="chevron-right"
                size={14}
                color={palette.textMuted}
              />
            </RNView>
          </Pressable>
        </Link>
      </RNView>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  sectionRows: {
    gap: spacing.sm,
  },
  row: {
    position: "relative",
    minHeight: 62,
    paddingHorizontal: spacing.sm,
    paddingRight: 34,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
  },
  textCol: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  rowSub: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
  },
  chevronWrap: {
    position: "absolute",
    right: spacing.sm,
    top: 0,
    bottom: 0,
    width: 18,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  reminderCard: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  reminderTextCol: {
    flex: 1,
  },
  reminderDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    opacity: 0.5,
  },
  stepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  timeChip: {
    minHeight: 36,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});

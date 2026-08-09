import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FluxBottomSheet } from '@/components/FluxBottomSheet';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import type { ThemePalette } from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import {
  addMonthsId,
  currentPaydayMonthId,
  dateFromMonthId,
  formatMonthIdDisplay,
  monthIdFromDate,
  monthRangeInclusive,
  type MonthId,
} from '@/src/domain/month';

type Props = {
  value: MonthId;
  onChange: (id: MonthId) => void;
  palette: ThemePalette;
  /** Match Plan `TextInput` styling (border, colors). */
  triggerStyle?: StyleProp<ViewStyle>;
};

/** ~7 years back / forward of month rows for web list. */
function monthOptionsList(): MonthId[] {
  const start = addMonthsId(currentPaydayMonthId(), -84);
  const end = addMonthsId(currentPaydayMonthId(), 84);
  return monthRangeInclusive(start, end);
}

export function MonthPickerField({ value, onChange, palette, triggerStyle }: Props) {
  const colorScheme = useColorScheme();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [iosOpen, setIosOpen] = useState(false);
  const [webOpen, setWebOpen] = useState(false);
  const [iosTemp, setIosTemp] = useState(() => dateFromMonthId(value));

  useEffect(() => {
    if (iosOpen) {
      setIosTemp(dateFromMonthId(value));
    }
  }, [iosOpen, value]);

  const webMonths = useMemo(() => monthOptionsList(), []);

  const openPicker = useCallback(() => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dateFromMonthId(value),
        mode: 'date',
        onChange: (event, date) => {
          if (event.type === 'set' && date) {
            onChange(monthIdFromDate(date));
          }
        },
      });
      return;
    }
    if (Platform.OS === 'ios') {
      setIosOpen(true);
      return;
    }
    setWebOpen(true);
  }, [onChange, value]);

  const applyIos = useCallback(() => {
    onChange(monthIdFromDate(iosTemp));
    setIosOpen(false);
  }, [iosTemp, onChange]);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Month, ${formatMonthIdDisplay(value)}. Opens calendar.`}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.trigger,
          {
            opacity: pressed ? 0.92 : 1,
          },
          triggerStyle,
        ]}
      >
        <View style={styles.triggerSide} />
        <Text
          style={[styles.triggerText, { color: palette.inputText }]}
          numberOfLines={1}
        >
          {formatMonthIdDisplay(value)}
        </Text>
        <View style={styles.triggerSide}>
          <FontAwesome name="calendar" size={18} color={palette.tint} />
        </View>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <FluxBottomSheet
          visible={iosOpen}
          onClose={() => setIosOpen(false)}
          enableDynamicSizing
          variant="view"
        >
          <View style={{ paddingBottom: Math.max(insets.bottom, spacing.md) }}>
            <View style={styles.iosToolbar}>
              <View style={styles.iosToolbarLeft}>
                <Pressable onPress={() => setIosOpen(false)} hitSlop={12}>
                  <Text style={{ color: palette.textMuted, fontSize: 17, fontWeight: '600' }}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
              <View style={styles.iosToolbarCenter}>
                <Text style={[styles.iosTitle, { color: palette.text }]}>Month</Text>
              </View>
              <View style={styles.iosToolbarRight}>
                <Pressable onPress={applyIos} hitSlop={12}>
                  <Text style={{ color: palette.tint, fontSize: 17, fontWeight: '700' }}>
                    Done
                  </Text>
                </Pressable>
              </View>
            </View>
            <View style={[styles.iosPickerHost, { width: windowWidth }]}>
              <DateTimePicker
                style={{ width: windowWidth }}
                value={iosTemp}
                mode="date"
                display="spinner"
                themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                onChange={(_, date) => {
                  if (date) setIosTemp(date);
                }}
              />
            </View>
          </View>
        </FluxBottomSheet>
      ) : null}

      {Platform.OS === 'web' ? (
        <FluxBottomSheet
          visible={webOpen}
          onClose={() => setWebOpen(false)}
          snapPoints={['75%']}
        >
          <Text style={[styles.webSheetTitle, { color: palette.text }]}>
            Choose month
          </Text>
          {webMonths.map((item) => {
            const selected = item === value;
            return (
              <Pressable
                key={item}
                onPress={() => {
                  onChange(item);
                  setWebOpen(false);
                }}
                style={[
                  styles.webRow,
                  {
                    backgroundColor: selected ? palette.tintMuted : 'transparent',
                    borderBottomColor: palette.border,
                  },
                ]}
              >
                <Text
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: selected ? '800' : '500',
                    color: selected ? palette.tintStrong : palette.text,
                  }}
                >
                  {formatMonthIdDisplay(item)}
                </Text>
              </Pressable>
            );
          })}
        </FluxBottomSheet>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 50,
  },
  triggerSide: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  iosToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  iosToolbarLeft: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  iosToolbarCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosToolbarRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  iosTitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  iosPickerHost: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  webSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
  webRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

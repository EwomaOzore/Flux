import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import type { ThemePalette } from '@/constants/Colors';
import { hairlineBorder, radii, spacing } from '@/constants/theme';
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
        ]}>
        <Text style={[styles.triggerText, { color: palette.text }]}>{formatMonthIdDisplay(value)}</Text>
        <FontAwesome name="calendar" size={18} color={palette.tint} />
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} animationType="slide" transparent onRequestClose={() => setIosOpen(false)}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIosOpen(false)} />
            <View
              style={[
                styles.iosSheet,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  paddingBottom: Math.max(insets.bottom, spacing.md),
                },
                hairlineBorder(palette.border),
              ]}>
            <View style={styles.iosToolbar}>
              <Pressable onPress={() => setIosOpen(false)} hitSlop={12}>
                <Text style={{ color: palette.textMuted, fontSize: 17, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Text style={[styles.iosTitle, { color: palette.text }]}>Month</Text>
              <Pressable onPress={applyIos} hitSlop={12}>
                <Text style={{ color: palette.tint, fontSize: 17, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
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
        </Modal>
      ) : null}

      {Platform.OS === 'web' ? (
        <Modal visible={webOpen} animationType="fade" transparent onRequestClose={() => setWebOpen(false)}>
          <View style={[styles.modalRoot, styles.modalRootCentered]}>
            <Pressable style={styles.modalBackdrop} onPress={() => setWebOpen(false)} />
            <View
              style={[
                styles.webSheet,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
                hairlineBorder(palette.border),
              ]}>
            <Text style={[styles.webSheetTitle, { color: palette.text }]}>Choose month</Text>
            <FlatList
              data={webMonths}
              keyExtractor={(m) => m}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <Pressable
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
                    ]}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: selected ? '800' : '500',
                        color: selected ? palette.tintStrong : palette.text,
                      }}>
                      {formatMonthIdDisplay(item)}
                    </Text>
                  </Pressable>
                );
              }}
            />
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalRootCentered: {
    justifyContent: 'center',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 50,
  },
  triggerText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000055',
  },
  iosSheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  iosToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iosTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  webSheet: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    maxHeight: '75%',
    alignSelf: 'center',
    width: '88%',
    maxWidth: 420,
  },
  webSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  webRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

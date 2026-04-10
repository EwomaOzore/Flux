import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/Themed';
import { radii, spacing } from '@/constants/theme';

import { useFluxPalette } from '@/components/ui/useFluxPalette';

type Props = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function DangerOutlineButton({ label, onPress, style }: Props) {
  const { palette } = useFluxPalette();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          borderColor: palette.danger,
          backgroundColor: palette.dangerMuted,
          opacity: pressed ? 0.88 : 1,
        },
        style,
      ]}>
      <Text style={[styles.label, { color: palette.danger }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
  },
});

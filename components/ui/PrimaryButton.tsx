import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/Themed';
import { cardElevation, radii, spacing } from '@/constants/theme';

import { useFluxPalette } from '@/components/ui/useFluxPalette';

type Props = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, onPress, style }: Props) {
  const { palette, colorScheme } = useFluxPalette();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        cardElevation(colorScheme),
        { backgroundColor: palette.tint, opacity: pressed ? 0.9 : 1 },
        style,
      ]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

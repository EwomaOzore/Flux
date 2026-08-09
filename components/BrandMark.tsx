import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, View } from 'react-native';

import Colors from '@/constants/Colors';
import { radii } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  size?: number;
};

/** Small forest-green brand mark used on screen headers. */
export function BrandMark({ size = 28 }: Props) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: Math.max(8, size * 0.28),
          backgroundColor: palette.tint,
        },
      ]}
    >
      <FontAwesome name="align-left" size={Math.round(size * 0.42)} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

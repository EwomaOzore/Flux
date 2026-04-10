import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen does not exist.</Text>

        <Link href="/" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.link,
              {
                backgroundColor: palette.tint,
                opacity: pressed ? 0.9 : 1,
              },
            ]}>
            <Text style={styles.linkText}>Go to home</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  link: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
});

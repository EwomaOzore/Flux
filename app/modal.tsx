import { Linking, Pressable, StyleSheet, View as RNView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function AboutModal() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.outer}>
      <RNView style={[styles.heroStripe, { backgroundColor: palette.tintMuted }]} />
      <View style={styles.container}>
        <Text style={styles.title}>Flux</Text>
        <Text style={[styles.lead, { color: palette.textSecondary }]}>
          A private payday planner for cashflow in naira: combine several jobs or side gigs, convert foreign pay to ₦ in
          your head, and see cushion after bills. Home shows this month-end run, Timeline lists months with line items,
          Plan is where you tune income streams and bills. Data stays on your phone until you export or back up.
        </Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          Flux does not move money, connect to banks, or give financial advice. It&apos;s arithmetic you control.
        </Text>

        <Pressable
          onPress={() => Linking.openURL('https://expo.dev')}
          style={({ pressed }) => [
            styles.linkBtn,
            {
              backgroundColor: palette.tintMuted,
              borderColor: palette.border,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
          accessibilityRole="link">
          <Text style={[styles.link, { color: palette.tintStrong }]}>Built with Expo →</Text>
        </Pressable>

        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  heroStripe: {
    height: 6,
    width: '100%',
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: spacing.sm,
  },
  lead: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  linkBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  link: {
    fontSize: 15,
    fontWeight: '800',
  },
});

import { Linking, Platform, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function AboutModal() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flux</Text>
      <Text style={styles.body}>
        A private payday planner for Nigerian (₦) cashflow: one screen for the current month-end run, a timeline for
        what&apos;s coming, and a plan tab to tune numbers. Nothing leaves your phone unless you choose to back it up
        later.
      </Text>
      <Text style={styles.body}>
        Flux does not move money, connect to banks, or give financial advice. It&apos;s arithmetic you control.
      </Text>

      <Pressable
        onPress={() => Linking.openURL('https://expo.dev')}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        accessibilityRole="link">
        <Text style={[styles.link, { color: palette.tint }]}>Built with Expo →</Text>
      </Pressable>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 22,
    gap: 12,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.85,
  },
  link: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
  },
});

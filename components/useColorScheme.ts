import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useAppearanceStore } from '@/src/state/appearanceStore';

/** Resolved app color scheme respecting Settings → Dark mode preference. */
export function useColorScheme(): 'light' | 'dark' {
  const preference = useAppearanceStore((s) => s.preference);
  const system = useSystemColorScheme() ?? 'light';

  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  return system === 'dark' ? 'dark' : 'light';
}

import { useAppearanceStore } from '@/src/state/appearanceStore';

/** Web: respect preference; default light when system. */
export function useColorScheme(): 'light' | 'dark' {
  const preference = useAppearanceStore((s) => s.preference);
  if (preference === 'dark') return 'dark';
  return 'light';
}

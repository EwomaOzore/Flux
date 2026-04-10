import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export function useFluxPalette() {
  const colorScheme = useColorScheme() ?? 'light';
  return { palette: Colors[colorScheme], colorScheme };
}

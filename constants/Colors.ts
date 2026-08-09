/**
 * Flux — warm parchment + forest green system.
 * Keys stay in sync across themes for `useThemeColor` / `useFluxPalette`.
 */
const light = {
  // Navigation & chrome
  text: '#1C1814',
  background: '#EDE9E3',
  backgroundSecondary: '#E0DAD3',
  tint: '#2B7A50',
  tabIconDefault: '#9A9188',
  tabIconSelected: '#2B7A50',

  // Surfaces
  surface: '#FFFFFF',
  surfaceMuted: '#E0DAD3',
  surfaceInverse: '#1C1814',
  border: '#D0CAC2',
  borderStrong: '#9A9188',
  /** Shared 1px card stroke (cushion, stats, lists). */
  cardBorder: '#E0DAD3',
  /** Form fields / sheet controls — white on screen parchment in both themes. */
  inputBackground: '#FFFFFF',
  inputText: '#1C1814',

  // Content hierarchy
  textSecondary: '#5A5349',
  textMuted: '#9A9188',

  // Brand & accents
  tintMuted: '#EBF5EE',
  tintStrong: '#2B7A50',
  accentBlue: '#2B7A50',
  accentViolet: '#5A5349',
  accentAmber: '#B36B0F',
  accentRose: '#B36B0F',
  accentIncome: '#2B7A50',
  accentIncomeMuted: '#EBF5EE',
  accentBills: '#B36B0F',
  accentBillsMuted: '#FBF0E2',
  accentOutflow: '#5A5349',
  accentOutflowMuted: '#EDE9E3',

  // Semantic
  success: '#2B7A50',
  successMuted: '#EBF5EE',
  danger: '#B54A3C',
  dangerMuted: '#F8E8E5',
  warning: '#B36B0F',
  warningMuted: '#F5E6D4',
  info: '#5A5349',
  infoMuted: '#E0DAD3',

  // Tab bar / header chrome
  tabBarBackground: '#FFFFFF',
  headerBackground: '#EDE9E3',
  shadow: 'rgba(0,0,0,0.08)',
};

const dark = {
  text: '#EDE9E3',
  background: '#1C1814',
  backgroundSecondary: '#25201C',
  tint: '#5DB98B',
  tabIconDefault: '#9A9188',
  tabIconSelected: '#5DB98B',

  surface: '#25201C',
  surfaceMuted: '#2F2924',
  surfaceInverse: '#EDE9E3',
  border: '#3A332C',
  borderStrong: '#5A5349',
  cardBorder: '#3A332C',
  inputBackground: '#232019',
  inputText: '#EDE8E0',

  textSecondary: '#9A9188',
  textMuted: '#9A9188',

  tintMuted: '#1E3328',
  tintStrong: '#6FBF8B',
  accentBlue: '#5DB98B',
  accentViolet: '#D0CAC2',
  accentAmber: '#D4923A',
  accentRose: '#D4923A',
  accentIncome: '#5DB98B',
  accentIncomeMuted: '#1E3328',
  accentBills: '#D4923A',
  accentBillsMuted: '#2E2418',
  accentOutflow: '#D0CAC2',
  accentOutflowMuted: '#2F2924',

  success: '#5DB98B',
  successMuted: '#1E3328',
  danger: '#E07A6C',
  dangerMuted: '#3A2420',
  warning: '#D4923A',
  warningMuted: '#2E2418',
  info: '#D0CAC2',
  infoMuted: '#2F2924',

  tabBarBackground: '#25201C',
  headerBackground: '#1C1814',
  shadow: 'rgba(0,0,0,0.35)',
};

export type ThemeName = 'light' | 'dark';
export type ThemePalette = typeof light;

export default {
  light,
  dark,
} as const satisfies Record<ThemeName, ThemePalette>;

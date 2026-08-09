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
  accentBillsMuted: '#F5E6D4',
  accentOutflow: '#5A5349',
  accentOutflowMuted: '#E0DAD3',

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
  backgroundSecondary: '#2A2420',
  tint: '#4FA873',
  tabIconDefault: '#9A9188',
  tabIconSelected: '#4FA873',

  surface: '#2A2420',
  surfaceMuted: '#3A332C',
  surfaceInverse: '#EDE9E3',
  border: '#5A5349',
  borderStrong: '#9A9188',

  textSecondary: '#D0CAC2',
  textMuted: '#9A9188',

  tintMuted: '#24352C',
  tintStrong: '#6FBF8B',
  accentBlue: '#4FA873',
  accentViolet: '#D0CAC2',
  accentAmber: '#D4923A',
  accentRose: '#D4923A',
  accentIncome: '#4FA873',
  accentIncomeMuted: '#24352C',
  accentBills: '#D4923A',
  accentBillsMuted: '#3A2E1C',
  accentOutflow: '#D0CAC2',
  accentOutflowMuted: '#3A332C',

  success: '#4FA873',
  successMuted: '#24352C',
  danger: '#E07A6C',
  dangerMuted: '#3A2420',
  warning: '#D4923A',
  warningMuted: '#3A2E1C',
  info: '#D0CAC2',
  infoMuted: '#3A332C',

  tabBarBackground: '#2A2420',
  headerBackground: '#1C1814',
  shadow: 'rgba(0,0,0,0.35)',
};

export type ThemeName = 'light' | 'dark';
export type ThemePalette = typeof light;

export default {
  light,
  dark,
} as const satisfies Record<ThemeName, ThemePalette>;

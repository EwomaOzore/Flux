/**
 * Flux — semantic palettes for light / dark.
 * Keep keys in sync across themes so `useThemeColor` and `usePalette()` stay typed.
 */
const light = {
  // Navigation & chrome
  text: '#0f172a',
  background: '#f1f5f9',
  backgroundSecondary: '#e2e8f0',
  tint: '#0d9488',
  tabIconDefault: '#94a3b8',
  tabIconSelected: '#0d9488',

  // Surfaces
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  surfaceInverse: '#0f172a',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',

  // Content hierarchy
  textSecondary: '#475569',
  textMuted: '#64748b',

  // Brand & accents
  tintMuted: '#ccfbf1',
  tintStrong: '#0f766e',
  accentBlue: '#2563eb',
  accentViolet: '#7c3aed',
  accentAmber: '#d97706',
  accentRose: '#e11d48',

  // Semantic
  success: '#059669',
  successMuted: '#d1fae5',
  danger: '#dc2626',
  dangerMuted: '#fee2e2',
  warning: '#d97706',
  warningMuted: '#fef3c7',
  info: '#0284c7',
  infoMuted: '#e0f2fe',

  // Tab bar / header chrome
  tabBarBackground: '#ffffff',
  headerBackground: '#ffffff',
};

const dark = {
  text: '#f1f5f9',
  background: '#0b1120',
  backgroundSecondary: '#0f172a',
  tint: '#2dd4bf',
  tabIconDefault: '#64748b',
  tabIconSelected: '#2dd4bf',

  surface: '#151f33',
  surfaceMuted: '#1e293b',
  surfaceInverse: '#f8fafc',
  border: '#334155',
  borderStrong: '#475569',

  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',

  tintMuted: '#115e5922',
  tintStrong: '#5eead4',
  accentBlue: '#60a5fa',
  accentViolet: '#a78bfa',
  accentAmber: '#fbbf24',
  accentRose: '#fb7185',

  success: '#34d399',
  successMuted: '#064e3b44',
  danger: '#f87171',
  dangerMuted: '#7f1d1d44',
  warning: '#fbbf24',
  warningMuted: '#78350f44',
  info: '#38bdf8',
  infoMuted: '#0c4a6e44',

  tabBarBackground: '#0f172a',
  headerBackground: '#0f172a',
};

export type ThemeName = 'light' | 'dark';
export type ThemePalette = typeof light;

export default {
  light,
  dark,
} as const satisfies Record<ThemeName, ThemePalette>;

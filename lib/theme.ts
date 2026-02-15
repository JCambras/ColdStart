// Design tokens — named constants for repeated inline style values.
// Import into style={{}} props; opt-in per file.

export const colors = {
  // Text
  textPrimary: '#111827',
  textSecondary: '#374151',
  textTertiary: '#6b7280',
  textMuted: '#9ca3af',
  textDisabled: '#d1d5db',
  // Backgrounds
  white: '#ffffff',
  bgPage: '#fafbfc',
  bgSubtle: '#f9fafb',
  bgInfo: '#f0f9ff',
  bgSuccess: '#f0fdf4',
  bgWarning: '#fffbeb',
  bgError: '#fef2f2',
  bgOrangeLight: '#fff7ed',
  // Borders
  borderLight: '#f1f5f9',
  borderDefault: '#e5e7eb',
  borderMedium: '#d1d5db',
  // Brand
  brand: '#0ea5e9',
  brandLight: '#bae6fd',
  brandBg: '#f0f9ff',
  brandDark: '#0369a1',
  brandDeep: '#0c4a6e',
  brandAccent: '#3b82f6',
  // Status
  success: '#16a34a',
  successBorder: '#bbf7d0',
  warning: '#d97706',
  warningBorder: '#fde68a',
  error: '#ef4444',
  // Accent colors
  amber: '#f59e0b',
  amberDark: '#92400e',
  amberBorder: '#fed7aa',
  orangeDeep: '#ea580c',
  purple: '#7c3aed',
  purpleBg: '#faf5ff',
  purpleBorder: '#ddd6fe',
  indigoBg: '#eff6ff',
  indigoBorder: '#bfdbfe',
  indigo: '#1e40af',
} as const;

export const text = {
  '2xs': 10,
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 15,
  xl: 18,
  '2xl': 24,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 14,
  '3xl': 16,
  full: '50%',
} as const;

export const layout = {
  maxWidthNarrow: 560,
  maxWidthDefault: 680,
  maxWidthWide: 720,
  maxWidthFull: 1100,
  navPadding: '14px 24px',
} as const;

export const shadow = {
  sm: '0 1px 3px rgba(0,0,0,0.04)',
  md: '0 2px 8px rgba(0,0,0,0.04)',
  lg: '0 4px 12px rgba(0,0,0,0.06)',
  focus: '0 0 0 3px rgba(14,165,233,0.1)',
} as const;

export const transition = {
  fast: 'all 0.15s ease',
  normal: 'all 0.2s ease',
} as const;

export const font = {
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

export const nav = {
  bg: 'rgba(250,251,252,0.85)',
  blur: 'blur(12px)',
} as const;

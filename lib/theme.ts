// Design tokens — named constants for repeated inline style values.
// Import into style={{}} props; opt-in per file.

export const colors = {
  textPrimary: '#111827',
  textSecondary: '#374151',
  textTertiary: '#6b7280',
  textMuted: '#9ca3af',
  textDisabled: '#d1d5db',
  bgPage: '#fafbfc',
  bgSubtle: '#f9fafb',
  bgInfo: '#f0f9ff',
  bgSuccess: '#f0fdf4',
  bgWarning: '#fffbeb',
  bgError: '#fef2f2',
  borderLight: '#f1f5f9',
  borderDefault: '#e5e7eb',
  borderMedium: '#d1d5db',
  brand: '#0ea5e9',
  brandLight: '#bae6fd',
  brandBg: '#f0f9ff',
  success: '#16a34a',
  successBorder: '#bbf7d0',
  warning: '#d97706',
  warningBorder: '#fde68a',
  error: '#ef4444',
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

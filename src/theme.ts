export const colors = {
  copper: '#B07C4F',
  copperLight: '#D4A574',
  forest: '#2D5016',
  fern: '#5B7A53',
  paper: '#F5F0E8',
  muted: '#8A7968',
  bg: '#1A1A1A',
  surface: '#2A2A2A',
  surface2: '#333333',
  text: '#F5F0E8',
  textMuted: '#8A7968',
  border: '#3A3A3A',
  danger: '#C0392B',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 9999,
};

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  subheading: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.textMuted },
  mono: { fontSize: 48, fontWeight: '300' as const, color: colors.text, fontVariant: ['tabular-nums'] as any },
};

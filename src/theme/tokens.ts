/**
 * Sampled from the supplied Figma frames (390x844). Layout is verified at 360x640 too,
 * so nothing here may assume the taller viewport.
 */

export const colors = {
  primary: '#85A98A',
  primaryPressed: '#6E9174',
  primaryDisabled: '#BFD3C2',
  primarySoft: '#DDEBDF',

  headingGreen: '#1B5E3F',
  creditGreen: '#2E7D50',
  debitRed: '#E23D3D',
  supportOrange: '#F0803C',

  darkCard: '#12251A',

  text: '#1A1A1A',
  textMuted: '#6B7280',
  placeholder: '#9CA3AF',

  border: '#E0E0E0',
  borderStrong: '#D4D4D4',
  surface: '#FFFFFF',
  surfaceSubtle: '#F7F7F7',
  trackInactive: '#EDEDED',
} as const;

/** Beneficiary monograms cycle through these, keyed by index for stability. */
export const avatarColors = [
  '#2C5F8A',
  '#5B3FD1',
  '#C9338F',
  '#C9B739',
  '#4FBFD1',
] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const type = {
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const;

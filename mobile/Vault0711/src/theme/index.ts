/**
 * 0711 Vault Theme
 * 
 * Premium enterprise aesthetic:
 * - Dark mode first (privacy-focused)
 * - Orange accent (for CTAs and active states)
 * - Clean, professional, secure feeling
 */

export const colors = {
  // Core palette
  dark: '#141413',
  light: '#faf9f5',
  midGray: '#b0aea5',
  lightGray: '#e8e6dc',
  
  // Accent
  orange: '#d97757',
  orangeLight: '#e89a7d',
  
  // Semantic
  success: '#788c5d',
  warning: '#d4a64a',
  error: '#c75050',
  info: '#6a9bcc',
  
  // Dark mode specific
  darkBg: '#0a0a09',
  darkCard: '#1a1a18',
  darkBorder: '#2a2a28',
  darkText: '#e8e6dc',
  darkTextMuted: '#8a8880',
};

export const fonts = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Light/Dark mode themes
export const lightTheme = {
  background: colors.light,
  card: '#ffffff',
  text: colors.dark,
  textMuted: colors.midGray,
  border: colors.lightGray,
  primary: colors.orange,
};

export const darkTheme = {
  background: colors.darkBg,
  card: colors.darkCard,
  text: colors.darkText,
  textMuted: colors.darkTextMuted,
  border: colors.darkBorder,
  primary: colors.orange,
};

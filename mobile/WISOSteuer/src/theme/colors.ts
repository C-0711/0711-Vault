/**
 * WISO Steuer Color Palette
 * Extracted from Buhl/WISO Figma designs
 */

export const colors = {
  // Primary
  primary: '#1A2B4A',
  primaryDark: '#0D1B3E',
  
  // Background
  background: '#F5F7FA',
  surface: '#FFFFFF',
  
  // Text
  textPrimary: '#1A2B4A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // CTA / Actions
  cta: '#FFD60A',
  ctaPressed: '#E6C009',
  ctaText: '#1A2B4A',
  
  // Accents
  accentBlue: '#2563EB',
  accentOrange: '#F59E0B',
  accentTeal: '#0D9488',
  accentPurple: '#7C3AED',
  
  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Money
  moneyPositive: '#0D9488',
  moneyNegative: '#EF4444',
  
  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#E5E7EB',
  
  // Shadows
  shadowColor: '#000000',
  
  // Tab Bar
  tabActive: '#2563EB',
  tabInactive: '#9CA3AF',
  tabBackground: '#FFFFFF',
  
  // Cards
  cardBackground: '#FFFFFF',
  cardBorder: '#E2E8F0',
  
  // Input
  inputBackground: '#F9FAFB',
  inputBorder: '#D1D5DB',
  inputBorderFocus: '#2563EB',
  inputText: '#1A2B4A',
  inputPlaceholder: '#9CA3AF',
};

export type ColorName = keyof typeof colors;

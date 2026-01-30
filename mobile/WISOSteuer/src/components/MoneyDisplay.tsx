import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

interface MoneyDisplayProps {
  amount: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showSign?: boolean;
  currency?: string;
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  amount,
  label,
  size = 'md',
  showSign = true,
  currency = '€',
}) => {
  const isPositive = amount >= 0;
  const color = isPositive ? colors.moneyPositive : colors.moneyNegative;
  const sign = showSign ? (isPositive ? '+' : '') : '';
  
  const formattedAmount = Math.abs(amount).toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Text style={[
        styles.amount,
        styles[`amount_${size}`],
        { color }
      ]}>
        {sign}{formattedAmount} {currency}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  label: {
    ...typography.labelSmall,
    marginBottom: spacing.xs,
  },
  amount: {
    fontWeight: '700',
  },
  amount_sm: {
    fontSize: 16,
    lineHeight: 22,
  },
  amount_md: {
    fontSize: 24,
    lineHeight: 30,
  },
  amount_lg: {
    fontSize: 32,
    lineHeight: 40,
  },
});

import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

interface YearPickerProps {
  years: number[];
  selectedYear: number;
  onYearSelect: (year: number) => void;
}

export const YearPicker: React.FC<YearPickerProps> = ({
  years,
  selectedYear,
  onYearSelect,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {years.map((year) => {
          const isSelected = year === selectedYear;
          return (
            <TouchableOpacity
              key={year}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => onYearSelect(year)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                {year}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: colors.textInverse,
  },
});

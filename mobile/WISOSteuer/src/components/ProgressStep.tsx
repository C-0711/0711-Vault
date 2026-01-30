import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';

type StepStatus = 'pending' | 'active' | 'completed' | 'error';

interface ProgressStepProps {
  title: string;
  description?: string;
  status: StepStatus;
  stepNumber: number;
  onPress?: () => void;
  isLast?: boolean;
}

const statusConfig: Record<StepStatus, { bgColor: string; iconColor: string; icon: string }> = {
  pending: { bgColor: colors.border, iconColor: colors.textMuted, icon: 'ellipse-outline' },
  active: { bgColor: colors.accentBlue, iconColor: colors.textInverse, icon: 'play' },
  completed: { bgColor: colors.success, iconColor: colors.textInverse, icon: 'checkmark' },
  error: { bgColor: colors.error, iconColor: colors.textInverse, icon: 'alert' },
};

export const ProgressStep: React.FC<ProgressStepProps> = ({
  title,
  description,
  status,
  stepNumber,
  onPress,
  isLast = false,
}) => {
  const config = statusConfig[status];
  const isPressable = status === 'active' || status === 'completed';

  const Content = (
    <View style={styles.container}>
      {/* Step indicator */}
      <View style={styles.indicatorContainer}>
        <View style={[styles.indicator, { backgroundColor: config.bgColor }]}>
          {status === 'pending' ? (
            <Text style={styles.stepNumber}>{stepNumber}</Text>
          ) : (
            <Ionicons name={config.icon as any} size={16} color={config.iconColor} />
          )}
        </View>
        {!isLast && (
          <View style={[
            styles.line,
            { backgroundColor: status === 'completed' ? colors.success : colors.border }
          ]} />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[
          styles.title,
          status === 'pending' && styles.titlePending
        ]}>
          {title}
        </Text>
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>

      {/* Chevron for active/completed */}
      {isPressable && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </View>
  );

  if (isPressable && onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  indicatorContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  indicator: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontWeight: '600',
  },
  line: {
    width: 2,
    height: 40,
    marginTop: spacing.sm,
  },
  content: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  titlePending: {
    color: colors.textMuted,
  },
  description: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
});

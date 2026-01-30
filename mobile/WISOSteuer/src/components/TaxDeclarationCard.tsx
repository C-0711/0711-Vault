import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadow } from '../theme';
import { Card } from './Card';

type DeclarationStatus = 'draft' | 'in_progress' | 'completed' | 'submitted';

interface TaxDeclarationCardProps {
  year: number;
  name: string;
  status: DeclarationStatus;
  refundAmount?: number;
  progress?: number;
  onPress: () => void;
  onContinue?: () => void;
}

const statusConfig: Record<DeclarationStatus, { label: string; color: string; icon: string }> = {
  draft: { label: 'Entwurf', color: colors.textMuted, icon: 'document-outline' },
  in_progress: { label: 'In Bearbeitung', color: colors.accentOrange, icon: 'time-outline' },
  completed: { label: 'Fertig', color: colors.success, icon: 'checkmark-circle' },
  submitted: { label: 'Abgegeben', color: colors.accentBlue, icon: 'send' },
};

export const TaxDeclarationCard: React.FC<TaxDeclarationCardProps> = ({
  year,
  name,
  status,
  refundAmount,
  progress,
  onPress,
  onContinue,
}) => {
  const { label, color, icon } = statusConfig[status];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Card style={styles.container} variant="elevated">
        <View style={styles.header}>
          {/* Preview thumbnail */}
          <View style={styles.thumbnail}>
            <View style={styles.thumbnailPlaceholder}>
              <Text style={styles.thumbnailYear}>{year}</Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.statusRow}>
              <Ionicons name={icon as any} size={16} color={color} />
              <Text style={[styles.statusText, { color }]}>{label}</Text>
            </View>
            
            {/* Progress bar */}
            {progress !== undefined && status === 'in_progress' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{progress}%</Text>
              </View>
            )}
          </View>

          {/* Chevron */}
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>

        {/* Refund amount */}
        {refundAmount !== undefined && status === 'completed' && (
          <View style={styles.refundContainer}>
            <Text style={styles.refundLabel}>Voraussichtliche Erstattung</Text>
            <Text style={styles.refundAmount}>
              {refundAmount >= 0 ? '+' : ''}{refundAmount.toLocaleString('de-DE')} €
            </Text>
          </View>
        )}

        {/* Continue button */}
        {onContinue && status !== 'submitted' && (
          <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
            <Text style={styles.continueText}>
              {status === 'draft' ? 'Starten' : 'Fortsetzen'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.ctaText} />
          </TouchableOpacity>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumbnail: {
    width: 64,
    height: 80,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  thumbnailPlaceholder: {
    flex: 1,
    backgroundColor: colors.cta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailYear: {
    ...typography.h3,
    color: colors.ctaText,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accentOrange,
    borderRadius: borderRadius.full,
  },
  progressText: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
  refundContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refundLabel: {
    ...typography.bodySmall,
  },
  refundAmount: {
    ...typography.money,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cta,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  continueText: {
    ...typography.button,
    color: colors.ctaText,
  },
});

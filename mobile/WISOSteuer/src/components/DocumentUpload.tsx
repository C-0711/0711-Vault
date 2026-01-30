import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';

interface DocumentUploadProps {
  onPress: () => void;
  documentsCount?: number;
  isProcessing?: boolean;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onPress,
  documentsCount = 0,
  isProcessing = false,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isProcessing}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={isProcessing ? 'hourglass' : 'cloud-upload-outline'}
          size={32}
          color={colors.accentBlue}
        />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {isProcessing ? 'Verarbeite...' : 'Dokumente hochladen'}
        </Text>
        <Text style={styles.subtitle}>
          {documentsCount > 0
            ? `${documentsCount} Dokument${documentsCount !== 1 ? 'e' : ''} hochgeladen`
            : 'PDF, Foto oder direkt scannen'}
        </Text>
      </View>

      <View style={styles.badge}>
        <Ionicons name="add" size={20} color={colors.textInverse} />
      </View>
    </TouchableOpacity>
  );
};

interface DocumentItemProps {
  name: string;
  type: 'pdf' | 'image' | 'scan';
  status: 'uploading' | 'processing' | 'done' | 'error';
  onRemove?: () => void;
}

export const DocumentItem: React.FC<DocumentItemProps> = ({
  name,
  type,
  status,
  onRemove,
}) => {
  const iconName = type === 'pdf' ? 'document-text' : 'image';
  const statusColor = status === 'done' ? colors.success 
    : status === 'error' ? colors.error 
    : colors.accentOrange;

  return (
    <View style={styles.itemContainer}>
      <View style={[styles.itemIcon, { backgroundColor: `${statusColor}20` }]}>
        <Ionicons name={iconName} size={20} color={statusColor} />
      </View>
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{name}</Text>
        <Text style={[styles.itemStatus, { color: statusColor }]}>
          {status === 'uploading' && 'Lädt hoch...'}
          {status === 'processing' && 'Wird verarbeitet...'}
          {status === 'done' && 'Fertig'}
          {status === 'error' && 'Fehler'}
        </Text>
      </View>

      {status === 'done' && onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="close-circle" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {(status === 'uploading' || status === 'processing') && (
        <Ionicons name="sync" size={20} color={statusColor} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.accentBlue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Document item styles
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.body,
    fontWeight: '500',
  },
  itemStatus: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  removeButton: {
    padding: spacing.xs,
  },
});

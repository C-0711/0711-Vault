import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadow } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { DocumentUpload, DocumentItem } from '../components/DocumentUpload';

interface UploadScreenProps {
  navigation?: any;
}

const UPLOAD_OPTIONS = [
  { id: 'camera', icon: 'camera-outline', label: 'Kamera', description: 'Beleg fotografieren' },
  { id: 'gallery', icon: 'images-outline', label: 'Galerie', description: 'Foto auswählen' },
  { id: 'files', icon: 'document-outline', label: 'Dateien', description: 'PDF hochladen' },
  { id: 'bank', icon: 'card-outline', label: 'Bank', description: 'Konto verknüpfen' },
];

const MOCK_DOCUMENTS = [
  { id: '1', name: 'Lohnsteuerbescheinigung_2024.pdf', type: 'pdf' as const, status: 'done' as const },
  { id: '2', name: 'Fahrtkosten_Januar.jpg', type: 'image' as const, status: 'processing' as const },
];

export const UploadScreen: React.FC<UploadScreenProps> = ({ navigation }) => {
  const [documents, setDocuments] = useState(MOCK_DOCUMENTS);

  const handleUploadOption = (optionId: string) => {
    console.log('Selected upload option:', optionId);
    // TODO: Implement upload logic
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments(docs => docs.filter(d => d.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Belege hochladen</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Upload area */}
        <DocumentUpload
          onPress={() => handleUploadOption('files')}
          documentsCount={documents.length}
        />

        {/* Upload options */}
        <View style={styles.optionsGrid}>
          {UPLOAD_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={() => handleUploadOption(option.id)}
              activeOpacity={0.8}
            >
              <View style={styles.optionIcon}>
                <Ionicons name={option.icon as any} size={28} color={colors.accentBlue} />
              </View>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Uploaded documents */}
        {documents.length > 0 && (
          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>Hochgeladene Belege</Text>
            {documents.map((doc) => (
              <DocumentItem
                key={doc.id}
                name={doc.name}
                type={doc.type}
                status={doc.status}
                onRemove={() => handleRemoveDocument(doc.id)}
              />
            ))}
          </View>
        )}

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={24} color={colors.cta} />
            <Text style={styles.tipsTitle}>Tipps für gute Belege</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.tipText}>Ganzes Dokument sichtbar</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.tipText}>Gute Beleuchtung, kein Schatten</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.tipText}>Text muss lesbar sein</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.bottomAction}>
        <Button
          title="Weiter zur Auswertung"
          onPress={() => navigation?.navigate('Results')}
          fullWidth
          disabled={documents.length === 0}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  title: {
    ...typography.navTitle,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xl,
    marginHorizontal: -spacing.sm,
  },
  optionCard: {
    width: '50%',
    padding: spacing.sm,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.accentBlue}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  optionLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  optionDescription: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  documentsSection: {
    marginTop: spacing['2xl'],
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  tipsCard: {
    marginTop: spacing['2xl'],
    backgroundColor: `${colors.cta}10`,
    borderWidth: 1,
    borderColor: `${colors.cta}30`,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipsTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tipText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  bottomAction: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.sm,
  },
});

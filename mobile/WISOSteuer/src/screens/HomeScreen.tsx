import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import { YearPicker } from '../components/YearPicker';
import { TaxDeclarationCard } from '../components/TaxDeclarationCard';
import { Card } from '../components/Card';

const YEARS = [2025, 2024, 2023, 2022, 2021];

const MOCK_DECLARATIONS = [
  { id: '1', year: 2024, name: 'Einkommensteuererklärung', status: 'in_progress' as const, progress: 65 },
  { id: '2', year: 2023, name: 'Einkommensteuererklärung', status: 'completed' as const, refundAmount: 1847 },
  { id: '3', year: 2022, name: 'Einkommensteuererklärung', status: 'submitted' as const },
];

interface HomeScreenProps {
  navigation?: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [selectedYear, setSelectedYear] = useState(2024);

  const filteredDeclarations = MOCK_DECLARATIONS.filter(d => d.year === selectedYear);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Steuererklärungen</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="grid-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Year picker */}
      <YearPicker
        years={YEARS}
        selectedYear={selectedYear}
        onYearSelect={setSelectedYear}
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Tax declarations */}
        {filteredDeclarations.map((declaration) => (
          <TaxDeclarationCard
            key={declaration.id}
            year={declaration.year}
            name={declaration.name}
            status={declaration.status}
            progress={declaration.progress}
            refundAmount={declaration.refundAmount}
            onPress={() => navigation?.navigate('Declaration', { id: declaration.id })}
            onContinue={() => navigation?.navigate('Declaration', { id: declaration.id })}
          />
        ))}

        {filteredDeclarations.length === 0 && (
          <Card style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Keine Erklärung für {selectedYear}</Text>
            <Text style={styles.emptyText}>
              Starten Sie jetzt Ihre Steuererklärung für {selectedYear}
            </Text>
            <TouchableOpacity style={styles.startButton}>
              <Text style={styles.startButtonText}>Jetzt starten</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Quick actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Schnellaktionen</Text>
          
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: `${colors.accentBlue}15` }]}>
              <Ionicons name="add-circle-outline" size={24} color={colors.accentBlue} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Neue Erklärung</Text>
              <Text style={styles.actionSubtitle}>Steuerjahr {new Date().getFullYear()} starten</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: `${colors.accentOrange}15` }]}>
              <Ionicons name="document-attach-outline" size={24} color={colors.accentOrange} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Belege hochladen</Text>
              <Text style={styles.actionSubtitle}>PDF, Foto oder scannen</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing['4xl'] }} />
      </ScrollView>
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
  },
  title: {
    ...typography.h2,
  },
  headerButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
  },
  emptyCard: {
    marginHorizontal: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    ...typography.h4,
    marginTop: spacing.lg,
  },
  emptyText: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginHorizontal: spacing.xl,
  },
  startButton: {
    backgroundColor: colors.cta,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
  },
  startButtonText: {
    ...typography.button,
    color: colors.ctaText,
  },
  actionsSection: {
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  actionSubtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
});

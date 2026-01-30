import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadow } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MoneyDisplay } from '../components/MoneyDisplay';

interface ResultsScreenProps {
  navigation?: any;
}

const RESULT_ITEMS = [
  { id: '1', label: 'Bruttolohn', value: 52400, type: 'income' },
  { id: '2', label: 'Werbungskosten', value: -1847, type: 'deduction' },
  { id: '3', label: 'Sonderausgaben', value: -2400, type: 'deduction' },
  { id: '4', label: 'Zu versteuerndes Einkommen', value: 48153, type: 'subtotal' },
  { id: '5', label: 'Einkommensteuer', value: -8642, type: 'tax' },
  { id: '6', label: 'Bereits gezahlt (Lohnsteuer)', value: -10489, type: 'paid' },
];

const ESTIMATED_REFUND = 1847;

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Ergebnis</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main result card */}
        <Card style={styles.resultCard} variant="elevated">
          <View style={styles.resultHeader}>
            <View style={styles.resultIcon}>
              <Ionicons name="trending-up" size={32} color={colors.moneyPositive} />
            </View>
            <Text style={styles.resultLabel}>Voraussichtliche Erstattung</Text>
          </View>
          
          <MoneyDisplay
            amount={ESTIMATED_REFUND}
            size="lg"
          />
          
          <Text style={styles.resultHint}>
            Basierend auf Ihren Angaben und hochgeladenen Belegen
          </Text>

          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.resultAction}>
              <Ionicons name="calculator-outline" size={20} color={colors.accentBlue} />
              <Text style={styles.resultActionText}>Berechnung ansehen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resultAction}>
              <Ionicons name="help-circle-outline" size={20} color={colors.accentBlue} />
              <Text style={styles.resultActionText}>Wie geht's weiter?</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Aufschlüsselung</Text>
          
          <Card>
            {RESULT_ITEMS.map((item, index) => (
              <View 
                key={item.id} 
                style={[
                  styles.breakdownItem,
                  index === RESULT_ITEMS.length - 1 && styles.breakdownItemLast,
                  item.type === 'subtotal' && styles.breakdownItemHighlight,
                ]}
              >
                <Text style={[
                  styles.breakdownLabel,
                  item.type === 'subtotal' && styles.breakdownLabelBold,
                ]}>
                  {item.label}
                </Text>
                <Text style={[
                  styles.breakdownValue,
                  item.value < 0 && styles.breakdownValueNegative,
                  item.type === 'subtotal' && styles.breakdownValueBold,
                ]}>
                  {item.value >= 0 ? '' : '-'}{Math.abs(item.value).toLocaleString('de-DE')} €
                </Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Optimization tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Optimierungstipps</Text>
          
          <Card style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb" size={24} color={colors.cta} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Homeoffice-Pauschale nutzen</Text>
              <Text style={styles.tipText}>
                Sie könnten bis zu 600 € zusätzlich absetzen, wenn Sie von zu Hause arbeiten.
              </Text>
              <TouchableOpacity style={styles.tipAction}>
                <Text style={styles.tipActionText}>Jetzt hinzufügen</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.accentBlue} />
              </TouchableOpacity>
            </View>
          </Card>

          <Card style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="car" size={24} color={colors.accentOrange} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Fahrtkostenpauschale erhöhen</Text>
              <Text style={styles.tipText}>
                Ihre Entfernung zur Arbeit wurde erkannt. Möchten Sie die Fahrtkosten optimieren?
              </Text>
              <TouchableOpacity style={styles.tipAction}>
                <Text style={styles.tipActionText}>Überprüfen</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.accentBlue} />
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        <View style={{ height: spacing['4xl'] }} />
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.bottomAction}>
        <Button
          title="Zur Abgabe vorbereiten"
          onPress={() => navigation?.navigate('Submit')}
          fullWidth
        />
        <Text style={styles.bottomHint}>
          Ihre Daten werden verschlüsselt übertragen
        </Text>
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
  shareButton: {
    padding: spacing.xs,
    marginRight: -spacing.xs,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  resultCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resultIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.moneyPositive}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  resultLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  resultHint: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.md,
    marginHorizontal: spacing.xl,
  },
  resultActions: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  resultAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  resultActionText: {
    ...typography.bodySmall,
    color: colors.accentBlue,
    fontWeight: '500',
  },
  breakdownSection: {
    marginTop: spacing['2xl'],
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  breakdownItemLast: {
    borderBottomWidth: 0,
  },
  breakdownItemHighlight: {
    backgroundColor: colors.background,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  breakdownLabel: {
    ...typography.body,
    flex: 1,
  },
  breakdownLabelBold: {
    fontWeight: '600',
  },
  breakdownValue: {
    ...typography.body,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  breakdownValueNegative: {
    color: colors.textSecondary,
  },
  breakdownValueBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tipsSection: {
    marginTop: spacing['2xl'],
  },
  tipCard: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  tipText: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  tipAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tipActionText: {
    ...typography.bodySmall,
    color: colors.accentBlue,
    fontWeight: '500',
  },
  bottomAction: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.sm,
  },
  bottomHint: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.sm,
    color: colors.textMuted,
  },
});

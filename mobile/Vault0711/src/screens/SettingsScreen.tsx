import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  useColorScheme,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, fonts } from '../theme';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  type: 'toggle' | 'link' | 'action';
  value?: boolean;
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  
  const handleToggle = (settingId: string, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (settingId) {
      case 'biometric':
        setBiometricEnabled(value);
        break;
      case 'notifications':
        setNotificationsEnabled(value);
        break;
      case 'autoSync':
        setAutoSync(value);
        break;
      case 'offline':
        setOfflineMode(value);
        break;
    }
  };
  
  const handlePress = (settingId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (settingId) {
      case 'export':
        Alert.alert('Export', 'Daten werden exportiert...');
        break;
      case 'delete':
        Alert.alert(
          'Alle Daten löschen',
          'Bist du sicher? Diese Aktion kann nicht rückgängig gemacht werden.',
          [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Löschen', style: 'destructive', onPress: () => {} },
          ]
        );
        break;
    }
  };
  
  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.midGray }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: isDark ? colors.darkCard : '#fff' }]}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.settingItem,
              index < items.length - 1 && styles.settingItemBorder,
              { borderBottomColor: isDark ? colors.darkBorder : colors.lightGray }
            ]}
            onPress={() => item.type !== 'toggle' && handlePress(item.id)}
            disabled={item.type === 'toggle'}
          >
            <View style={[styles.settingIcon, { backgroundColor: item.iconColor + '15' }]}>
              <Ionicons name={item.icon} size={22} color={item.iconColor} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: isDark ? colors.darkText : colors.dark }]}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={[styles.settingSubtitle, { color: colors.midGray }]}>
                  {item.subtitle}
                </Text>
              )}
            </View>
            {item.type === 'toggle' && (
              <Switch
                value={item.value}
                onValueChange={(v) => handleToggle(item.id, v)}
                trackColor={{ false: colors.lightGray, true: colors.orange + '60' }}
                thumbColor={item.value ? colors.orange : '#f4f3f4'}
              />
            )}
            {item.type === 'link' && (
              <Ionicons name="chevron-forward" size={20} color={colors.midGray} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: isDark ? colors.darkBg : colors.light }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Account */}
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: colors.orange + '20' }]}>
          <Text style={[styles.avatarText, { color: colors.orange }]}>CB</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: isDark ? colors.darkText : colors.dark }]}>
            Christoph Bertsch
          </Text>
          <Text style={[styles.profileEmail, { color: colors.midGray }]}>
            christoph@0711.ai
          </Text>
        </View>
      </View>
      
      {renderSection('SICHERHEIT', [
        { 
          id: 'biometric', 
          title: 'Face ID / Touch ID', 
          subtitle: 'Biometrische Entsperrung',
          icon: 'finger-print', 
          iconColor: colors.info,
          type: 'toggle',
          value: biometricEnabled
        },
        { 
          id: 'pin', 
          title: 'PIN ändern', 
          icon: 'keypad', 
          iconColor: colors.success,
          type: 'link'
        },
      ])}
      
      {renderSection('SYNCHRONISATION', [
        { 
          id: 'autoSync', 
          title: 'Automatische Synchronisation', 
          subtitle: 'Daten mit Server abgleichen',
          icon: 'sync', 
          iconColor: colors.info,
          type: 'toggle',
          value: autoSync
        },
        { 
          id: 'offline', 
          title: 'Offline-Modus', 
          subtitle: 'Ohne Internet verwenden',
          icon: 'cloud-offline', 
          iconColor: colors.warning,
          type: 'toggle',
          value: offlineMode
        },
      ])}
      
      {renderSection('BENACHRICHTIGUNGEN', [
        { 
          id: 'notifications', 
          title: 'Push-Benachrichtigungen', 
          icon: 'notifications', 
          iconColor: colors.orange,
          type: 'toggle',
          value: notificationsEnabled
        },
      ])}
      
      {renderSection('DATEN', [
        { 
          id: 'export', 
          title: 'Daten exportieren', 
          subtitle: 'Als JSON oder PDF',
          icon: 'download', 
          iconColor: colors.success,
          type: 'action'
        },
        { 
          id: 'delete', 
          title: 'Alle Daten löschen', 
          icon: 'trash', 
          iconColor: colors.error,
          type: 'action'
        },
      ])}
      
      {renderSection('INFO', [
        { 
          id: 'about', 
          title: 'Über 0711 Vault', 
          subtitle: 'Version 1.0.0',
          icon: 'information-circle', 
          iconColor: colors.midGray,
          type: 'link'
        },
        { 
          id: 'privacy', 
          title: 'Datenschutz', 
          icon: 'shield-checkmark', 
          iconColor: colors.info,
          type: 'link'
        },
        { 
          id: 'help', 
          title: 'Hilfe & Support', 
          icon: 'help-circle', 
          iconColor: colors.orange,
          type: 'link'
        },
      ])}
      
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
  },
  profileInfo: {
    marginLeft: spacing.md,
  },
  profileName: {
    fontSize: fonts.sizes.lg,
    fontWeight: '600',
  },
  profileEmail: {
    fontSize: fonts.sizes.sm,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.sizes.xs,
    fontWeight: '600',
    marginLeft: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  sectionContent: {
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  settingTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: fonts.sizes.xs,
    marginTop: 2,
  },
});

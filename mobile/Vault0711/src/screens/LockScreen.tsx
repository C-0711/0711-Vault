import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, fonts } from '../theme';

interface LockScreenProps {
  route: {
    params: {
      onAuthenticate: () => void;
    };
  };
}

export default function LockScreen({ route }: LockScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { onAuthenticate } = route.params;
  
  const handleUnlock = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Entsperren Sie 0711 Vault',
        cancelLabel: 'Abbrechen',
        fallbackLabel: 'PIN verwenden',
      });
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onAuthenticate();
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.darkBg : colors.light }]}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={[styles.logoContainer, { backgroundColor: colors.orange + '15' }]}>
          <Text style={[styles.logo, { color: colors.orange }]}>0711</Text>
        </View>
        
        <Text style={[styles.title, { color: isDark ? colors.darkText : colors.dark }]}>
          Vault
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.midGray }]}>
          Dein persönliches Wissen, sicher geschützt
        </Text>
        
        {/* Unlock Button */}
        <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
          <View style={[styles.unlockIcon, { backgroundColor: colors.orange }]}>
            <Ionicons name="finger-print" size={40} color="#fff" />
          </View>
          <Text style={[styles.unlockText, { color: isDark ? colors.darkText : colors.dark }]}>
            Zum Entsperren tippen
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Bottom */}
      <View style={styles.bottom}>
        <View style={styles.brandRow}>
          <Text style={[styles.brandText, { color: colors.midGray }]}>
            Powered by
          </Text>
          <Text style={[styles.brandName, { color: colors.orange }]}>
            0711 AI
          </Text>
        </View>
        <Text style={[styles.privacyText, { color: colors.midGray }]}>
          100% lokal • Deine Daten, dein Gerät
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
  },
  title: {
    fontSize: fonts.sizes.xxxl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  unlockButton: {
    alignItems: 'center',
  },
  unlockIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  unlockText: {
    fontSize: fonts.sizes.md,
    fontWeight: '500',
  },
  bottom: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  brandText: {
    fontSize: fonts.sizes.sm,
  },
  brandName: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    marginLeft: spacing.xs,
  },
  privacyText: {
    fontSize: fonts.sizes.xs,
  },
});

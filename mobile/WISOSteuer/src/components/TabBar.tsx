import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadow, borderRadius } from '../theme';

interface TabItem {
  id: string;
  label: string;
  icon: string;
  iconActive?: string;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
  centerAction?: {
    icon: string;
    onPress: () => void;
  };
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
  centerAction,
}) => {
  const midIndex = Math.floor(tabs.length / 2);
  const leftTabs = tabs.slice(0, midIndex);
  const rightTabs = tabs.slice(midIndex);

  const renderTab = (tab: TabItem) => {
    const isActive = tab.id === activeTab;
    const iconName = isActive && tab.iconActive ? tab.iconActive : tab.icon;
    
    return (
      <TouchableOpacity
        key={tab.id}
        style={styles.tab}
        onPress={() => onTabPress(tab.id)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={iconName as any}
          size={24}
          color={isActive ? colors.tabActive : colors.tabInactive}
        />
        <Text style={[
          styles.tabLabel,
          { color: isActive ? colors.tabActive : colors.tabInactive }
        ]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {/* Left tabs */}
        {leftTabs.map(renderTab)}
        
        {/* Center action button */}
        {centerAction && (
          <View style={styles.centerContainer}>
            <TouchableOpacity
              style={styles.centerButton}
              onPress={centerAction.onPress}
              activeOpacity={0.8}
            >
              <Ionicons
                name={centerAction.icon as any}
                size={28}
                color={colors.textInverse}
              />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Right tabs */}
        {rightTabs.map(renderTab)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.tabBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: spacing.xl, // Safe area
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    minWidth: 64,
  },
  tabLabel: {
    ...typography.tabLabel,
    marginTop: spacing.xs,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -spacing['2xl'],
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cta,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
});

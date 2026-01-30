import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fonts } from '../theme';

interface VaultItem {
  id: string;
  title: string;
  type: 'document' | 'note' | 'image' | 'audio';
  category: string;
  date: Date;
  size?: string;
}

const mockVaultItems: VaultItem[] = [
  { id: '1', title: 'Steuerbescheid 2023', type: 'document', category: 'Finanzen', date: new Date('2024-03-15'), size: '2.4 MB' },
  { id: '2', title: 'Meeting Notes Q1', type: 'note', category: 'Arbeit', date: new Date('2024-03-10') },
  { id: '3', title: 'Versicherungspolice', type: 'document', category: 'Versicherungen', date: new Date('2024-02-20'), size: '1.8 MB' },
  { id: '4', title: 'Produktideen 2024', type: 'note', category: 'Ideen', date: new Date('2024-03-01') },
  { id: '5', title: 'Reisefotos Portugal', type: 'image', category: 'Persönlich', date: new Date('2024-01-15'), size: '45 MB' },
  { id: '6', title: 'Voice Memo - Interview', type: 'audio', category: 'Arbeit', date: new Date('2024-03-12'), size: '12 MB' },
];

const categories = ['Alle', 'Finanzen', 'Arbeit', 'Versicherungen', 'Ideen', 'Persönlich'];

export default function VaultScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [refreshing, setRefreshing] = useState(false);
  
  const filteredItems = selectedCategory === 'Alle' 
    ? mockVaultItems 
    : mockVaultItems.filter(item => item.category === selectedCategory);
  
  const getIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'document': return 'document-text';
      case 'note': return 'create';
      case 'image': return 'image';
      case 'audio': return 'mic';
      default: return 'document';
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.darkBg : colors.light }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? colors.darkCard : '#fff' }]}>
        <Ionicons name="search" size={20} color={colors.midGray} />
        <Text style={[styles.searchPlaceholder, { color: colors.midGray }]}>
          Im Vault suchen...
        </Text>
      </View>
      
      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryPill,
              selectedCategory === category && styles.categoryPillActive,
              { backgroundColor: selectedCategory === category ? colors.orange : (isDark ? colors.darkCard : '#fff') }
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              { color: selectedCategory === category ? '#fff' : (isDark ? colors.darkText : colors.dark) }
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: isDark ? colors.darkCard : '#fff' }]}>
          <Text style={[styles.statNumber, { color: isDark ? colors.darkText : colors.dark }]}>
            {mockVaultItems.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.midGray }]}>Dokumente</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? colors.darkCard : '#fff' }]}>
          <Text style={[styles.statNumber, { color: isDark ? colors.darkText : colors.dark }]}>
            {categories.length - 1}
          </Text>
          <Text style={[styles.statLabel, { color: colors.midGray }]}>Kategorien</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? colors.darkCard : '#fff' }]}>
          <Text style={[styles.statNumber, { color: isDark ? colors.darkText : colors.dark }]}>
            61 MB
          </Text>
          <Text style={[styles.statLabel, { color: colors.midGray }]}>Gesamt</Text>
        </View>
      </View>
      
      {/* Items List */}
      <ScrollView
        style={styles.itemsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange} />
        }
      >
        {filteredItems.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[styles.itemCard, { backgroundColor: isDark ? colors.darkCard : '#fff' }]}
          >
            <View style={[styles.itemIcon, { backgroundColor: colors.orange + '15' }]}>
              <Ionicons name={getIcon(item.type)} size={24} color={colors.orange} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: isDark ? colors.darkText : colors.dark }]}>
                {item.title}
              </Text>
              <View style={styles.itemMeta}>
                <Text style={[styles.itemCategory, { color: colors.midGray }]}>
                  {item.category}
                </Text>
                <Text style={[styles.itemDate, { color: colors.midGray }]}>
                  {item.date.toLocaleDateString('de-DE')}
                </Text>
                {item.size && (
                  <Text style={[styles.itemSize, { color: colors.midGray }]}>
                    {item.size}
                  </Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.midGray} />
          </TouchableOpacity>
        ))}
        
        {/* Add Button */}
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.orange }]}>
          <Ionicons name="add" size={28} color="#fff" />
          <Text style={styles.addButtonText}>Hinzufügen</Text>
        </TouchableOpacity>
        
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  searchPlaceholder: {
    marginLeft: spacing.sm,
    fontSize: fonts.sizes.md,
  },
  categoriesContainer: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  categoryPillActive: {},
  categoryText: {
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fonts.sizes.xs,
    marginTop: spacing.xs,
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
  },
  itemMeta: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  itemCategory: {
    fontSize: fonts.sizes.xs,
  },
  itemDate: {
    fontSize: fonts.sizes.xs,
  },
  itemSize: {
    fontSize: fonts.sizes.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  addButtonText: {
    color: '#fff',
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});

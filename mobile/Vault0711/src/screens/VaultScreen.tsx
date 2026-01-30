import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fonts } from '../theme';
import api from '../services/api';
import { getMasterKey } from '../services/crypto';

interface VaultItem {
  id: string;
  title: string;
  type: 'document' | 'photo' | 'video';
  category: string;
  date: Date;
  size?: string;
  file_size?: number;
  item_type?: string;
  encrypted_metadata?: string;
  created_at?: string;
}

const categories = ['Alle', 'Fotos', 'Dokumente', 'Videos'];

export default function VaultScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [items, setItems] = useState<VaultItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    try {
      const [itemsResponse, statsResponse] = await Promise.all([
        api.getItems(null, 100),
        api.getStats().catch(() => null),
      ]);
      
      // Transform items
      const transformedItems = (itemsResponse.items || []).map((item: any) => ({
        id: item.id,
        title: item.encrypted_metadata ? '•••••' : getDefaultTitle(item.item_type),
        type: item.item_type,
        category: getCategoryFromType(item.item_type),
        date: new Date(item.created_at),
        size: formatFileSize(item.file_size),
        file_size: item.file_size,
      }));
      
      setItems(transformedItems);
      setStats(statsResponse);
    } catch (err) {
      console.error('Failed to load vault data:', err);
    } finally {
      setLoading(false);
    }
  }
  
  function getDefaultTitle(type: string): string {
    switch (type) {
      case 'photo': return 'Foto';
      case 'document': return 'Dokument';
      case 'video': return 'Video';
      default: return 'Datei';
    }
  }
  
  function getCategoryFromType(type: string): string {
    switch (type) {
      case 'photo': return 'Fotos';
      case 'document': return 'Dokumente';
      case 'video': return 'Videos';
      default: return 'Sonstige';
    }
  }
  
  function formatFileSize(bytes: number): string {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
  
  const filteredItems = selectedCategory === 'Alle' 
    ? items 
    : items.filter(item => item.category === selectedCategory);
  
  const getIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'document': return 'document-text';
      case 'photo': return 'image';
      case 'video': return 'videocam';
      default: return 'document';
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? colors.darkBg : colors.light }]}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }
  
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
            {stats?.photos || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.midGray }]}>Fotos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? colors.darkCard : '#fff' }]}>
          <Text style={[styles.statNumber, { color: isDark ? colors.darkText : colors.dark }]}>
            {stats?.documents || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.midGray }]}>Dokumente</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? colors.darkCard : '#fff' }]}>
          <Text style={[styles.statNumber, { color: isDark ? colors.darkText : colors.dark }]}>
            {stats?.total_gb?.toFixed(1) || 0} GB
          </Text>
          <Text style={[styles.statLabel, { color: colors.midGray }]}>Speicher</Text>
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
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color={colors.midGray} />
            <Text style={[styles.emptyText, { color: colors.midGray }]}>
              Keine Einträge gefunden
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.midGray }]}>
              Lade Fotos oder Dokumente hoch, um loszulegen
            </Text>
          </View>
        ) : (
          filteredItems.map(item => (
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
          ))
        )}
        
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fonts.sizes.lg,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fonts.sizes.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
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

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fonts } from '../theme';
import api, { AssistantSource } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: AssistantSource[];
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  { icon: 'person-outline', text: 'Wann habe ich Mama zuletzt gesehen?' },
  { icon: 'images-outline', text: 'Zeig mir Fotos vom letzten Sommer' },
  { icon: 'document-text-outline', text: 'Finde meine Versicherungsdokumente' },
  { icon: 'calendar-outline', text: 'Was ist letzte Woche passiert?' },
];

export default function AssistantScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  const flatListRef = useRef<FlatList>(null);

  const handleSend = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.chatWithAssistant(messageText, conversationId);

      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Entschuldigung, es gab einen Fehler bei der Verbindung zum Assistenten. Bitte versuche es erneut.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSources = (sources: AssistantSource[]) => {
    if (!sources || sources.length === 0) return null;

    const photoCount = sources.filter(s => s.type === 'photo').length;
    const docCount = sources.filter(s => s.type === 'document').length;

    return (
      <View style={styles.sourcesContainer}>
        {photoCount > 0 && (
          <View style={styles.sourceTag}>
            <Ionicons name="images" size={12} color={colors.orange} />
            <Text style={styles.sourceText}>{photoCount} Fotos</Text>
          </View>
        )}
        {docCount > 0 && (
          <View style={styles.sourceTag}>
            <Ionicons name="document-text" size={12} color={colors.orange} />
            <Text style={styles.sourceText}>{docCount} Dokumente</Text>
          </View>
        )}
      </View>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[
        styles.messageRow,
        isUser ? styles.userRow : styles.assistantRow,
      ]}>
        {!isUser && (
          <View style={styles.brainIconContainer}>
            <Ionicons name="sparkles" size={16} color={colors.orange} />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          isUser
            ? { backgroundColor: '#8B5CF6' }
            : { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0efeb' }
        ]}>
          <Text style={[
            styles.messageText,
            { color: isUser ? '#fff' : (isDark ? colors.darkText : colors.dark) }
          ]}>
            {item.content}
          </Text>
          {!isUser && item.sources && renderSources(item.sources)}
          <Text style={[
            styles.timestamp,
            { color: isUser ? 'rgba(255,255,255,0.7)' : colors.midGray }
          ]}>
            {item.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? colors.darkCard : '#fff' }]}>
        <Ionicons name="sparkles" size={48} color={colors.orange} />
      </View>
      <Text style={[styles.emptyTitle, { color: isDark ? colors.darkText : colors.dark }]}>
        Dein persönlicher Assistent
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.midGray }]}>
        Ich kenne dein Vault und helfe dir, Fotos, Dokumente und Erinnerungen zu finden.
      </Text>

      <View style={styles.suggestionsContainer}>
        <Text style={[styles.suggestionsTitle, { color: colors.midGray }]}>
          Probiere zum Beispiel:
        </Text>
        {SUGGESTED_PROMPTS.map((prompt, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.suggestionCard, { backgroundColor: isDark ? colors.darkCard : '#fff' }]}
            onPress={() => handleSend(prompt.text)}
          >
            <Ionicons
              name={prompt.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={colors.orange}
            />
            <Text style={[styles.suggestionText, { color: isDark ? colors.darkText : colors.dark }]}>
              {prompt.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.darkBg : colors.light }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? colors.darkCard : '#fff', borderBottomColor: isDark ? colors.darkBorder : colors.lightGray }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={isDark ? colors.darkText : colors.dark} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Ionicons name="sparkles" size={20} color={colors.orange} />
          <Text style={[styles.headerText, { color: isDark ? colors.darkText : colors.dark }]}>
            Persönlicher Assistent
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setMessages([]);
            setConversationId(undefined);
          }}
          style={styles.clearButton}
        >
          <Ionicons name="refresh" size={22} color={colors.midGray} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            showsVerticalScrollIndicator={false}
          />
        )}

        {isLoading && (
          <View style={[styles.loadingContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0efeb' }]}>
            <View style={styles.brainIconContainer}>
              <Ionicons name="sparkles" size={14} color={colors.orange} />
            </View>
            <ActivityIndicator size="small" color={colors.orange} style={{ marginLeft: spacing.sm }} />
            <Text style={[styles.loadingText, { color: isDark ? colors.darkTextMuted : colors.midGray }]}>
              Durchsuche dein Vault...
            </Text>
          </View>
        )}

        <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.darkCard : '#fff', borderTopColor: isDark ? colors.darkBorder : colors.lightGray }]}>
          <TextInput
            style={[styles.input, { color: isDark ? colors.darkText : colors.dark, backgroundColor: isDark ? colors.darkBg : colors.light }]}
            placeholder="Frag mich etwas über dein Vault..."
            placeholderTextColor={colors.midGray}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[styles.sendButton, { opacity: input.trim() ? 1 : 0.5, backgroundColor: '#8B5CF6' }]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerText: {
    fontSize: fonts.sizes.lg,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  clearButton: {
    padding: spacing.xs,
  },
  keyboardContainer: {
    flex: 1,
  },
  messageList: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  brainIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  userBubble: {
    borderBottomRightRadius: spacing.xs,
  },
  assistantBubble: {
    borderBottomLeftRadius: spacing.xs,
  },
  messageText: {
    fontSize: fonts.sizes.md,
    lineHeight: 22,
  },
  sourcesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 87, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  sourceText: {
    fontSize: fonts.sizes.xs,
    color: colors.orange,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: fonts.sizes.xs,
    marginTop: spacing.xs,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  loadingText: {
    marginLeft: spacing.sm,
    fontSize: fonts.sizes.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.sizes.md,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fonts.sizes.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  suggestionsContainer: {
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: fonts.sizes.sm,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  suggestionText: {
    fontSize: fonts.sizes.md,
    flex: 1,
  },
});

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fonts } from '../theme';
import { useChatService } from '../hooks/useChatService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation<any>();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hallo! Ich bin dein persönlicher 0711 Vault Assistent. Ich kenne all dein Wissen und helfe dir dabei, es zu nutzen. Was möchtest du wissen?',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const { sendMessage } = useChatService();

  // Add brain icon to header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Assistant')}
          style={{ marginRight: spacing.md }}
        >
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#8B5CF6',
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.md,
          }}>
            <Ionicons name="sparkles" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: fonts.sizes.xs, fontWeight: '600', marginLeft: 4 }}>
              AI
            </Text>
          </View>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await sendMessage(input.trim());
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.assistantBubble,
        isUser 
          ? { backgroundColor: colors.orange }
          : { backgroundColor: isDark ? colors.darkCard : '#f0efeb' }
      ]}>
        <Text style={[
          styles.messageText,
          { color: isUser ? '#fff' : (isDark ? colors.darkText : colors.dark) }
        ]}>
          {item.content}
        </Text>
        <Text style={[
          styles.timestamp,
          { color: isUser ? 'rgba(255,255,255,0.7)' : colors.midGray }
        ]}>
          {item.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };
  
  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: isDark ? colors.darkBg : colors.light }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
      />
      
      {isLoading && (
        <View style={[styles.loadingContainer, { backgroundColor: isDark ? colors.darkCard : '#f0efeb' }]}>
          <ActivityIndicator size="small" color={colors.orange} />
          <Text style={[styles.loadingText, { color: isDark ? colors.darkTextMuted : colors.midGray }]}>
            Denke nach...
          </Text>
        </View>
      )}
      
      <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.darkCard : '#fff', borderTopColor: isDark ? colors.darkBorder : colors.lightGray }]}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add-circle-outline" size={28} color={colors.midGray} />
        </TouchableOpacity>
        
        <TextInput
          style={[styles.input, { color: isDark ? colors.darkText : colors.dark, backgroundColor: isDark ? colors.darkBg : colors.light }]}
          placeholder="Frag mich etwas..."
          placeholderTextColor={colors.midGray}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        
        <TouchableOpacity style={styles.micButton}>
          <Ionicons name="mic-outline" size={24} color={colors.midGray} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.sendButton, { opacity: input.trim() ? 1 : 0.5 }]}
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: spacing.xs,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: spacing.xs,
  },
  messageText: {
    fontSize: fonts.sizes.md,
    lineHeight: 22,
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
  },
  attachButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
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
  micButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
    marginBottom: spacing.xs,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
});

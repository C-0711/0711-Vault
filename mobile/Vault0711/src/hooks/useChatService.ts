import { useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

// Configuration
const API_BASE_URL = 'http://localhost:4080/api';
const MISTRAL_API_KEY = ''; // Will be set from SecureStore

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export function useChatService() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  
  const getApiKey = useCallback(async () => {
    try {
      const key = await SecureStore.getItemAsync('api_key');
      return key || MISTRAL_API_KEY;
    } catch {
      return MISTRAL_API_KEY;
    }
  }, []);
  
  const sendMessage = useCallback(async (
    message: string,
    options: ChatOptions = {}
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    const {
      systemPrompt = 'Du bist ein hilfreicher persönlicher Assistent namens 0711 Vault. Du hast Zugriff auf das gesamte Wissen des Benutzers und hilfst ihm dabei, Informationen zu finden und Fragen zu beantworten. Antworte immer auf Deutsch, es sei denn, der Benutzer fragt in einer anderen Sprache.',
      temperature = 0.7,
      maxTokens = 2048,
    } = options;
    
    try {
      // Add user message to history
      const newHistory: ChatMessage[] = [
        ...conversationHistory,
        { role: 'user', content: message }
      ];
      
      // Build messages array
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...newHistory.slice(-10) // Keep last 10 messages for context
      ];
      
      // Try local API first, fallback to Mistral
      let response: string;
      
      try {
        // Try local 0711 API
        const localResponse = await fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        });
        
        if (localResponse.ok) {
          const data = await localResponse.json();
          response = data.response || data.choices?.[0]?.message?.content;
        } else {
          throw new Error('Local API unavailable');
        }
      } catch (localError) {
        // Fallback to Mistral API
        const apiKey = await getApiKey();
        
        const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'mistral-large-latest',
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        });
        
        if (!mistralResponse.ok) {
          throw new Error(`API error: ${mistralResponse.status}`);
        }
        
        const data = await mistralResponse.json();
        response = data.choices[0].message.content;
      }
      
      // Add assistant response to history
      setConversationHistory([
        ...newHistory,
        { role: 'assistant', content: response }
      ]);
      
      return response;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [conversationHistory, getApiKey]);
  
  const clearHistory = useCallback(() => {
    setConversationHistory([]);
  }, []);
  
  const setApiKey = useCallback(async (key: string) => {
    await SecureStore.setItemAsync('api_key', key);
  }, []);
  
  return {
    sendMessage,
    clearHistory,
    setApiKey,
    isLoading,
    error,
    conversationHistory,
  };
}

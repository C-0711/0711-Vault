/**
 * AI Assistant - Chat interface with vault context
 */

import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Send, Sparkles, Image, FileText, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    type: string;
    id: string;
    date: string | null;
  }>;
}

const SUGGESTED_PROMPTS = [
  "What photos do I have?",
  "Show me photos from last month",
  "Find my documents",
  "Who appears most in my photos?",
];

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await api.chat(message, conversationId || undefined);
      return response.data;
    },
    onSuccess: (data) => {
      setConversationId(data.conversation_id);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          sources: data.sources,
        },
      ]);
    },
  });
  
  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(input.trim());
    setInput('');
  };
  
  const handlePrompt = (prompt: string) => {
    setInput(prompt);
    handleSend();
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">AI Assistant</h1>
          <p className="text-sm text-muted-foreground">Ask about your photos, documents, and memories</p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-auto p-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2">How can I help you?</h2>
            <p className="text-muted-foreground mb-8 text-center max-w-md">
              I can help you find photos, search documents, and explore your memories. Try asking me something!
            </p>
            
            {/* Suggested prompts */}
            <div className="grid grid-cols-2 gap-3 max-w-lg">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handlePrompt(prompt)}
                  className="px-4 py-3 rounded-lg bg-muted hover:bg-muted/80 text-left text-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-primary'
                    : 'bg-gradient-to-br from-purple-500 to-blue-600'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-white" />
                  )}
                </div>
                
                {/* Content */}
                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.sources.slice(0, 5).map((source) => (
                        <button
                          key={source.id}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50 hover:bg-muted text-xs"
                        >
                          {source.type === 'photo' ? (
                            <Image className="w-3 h-3" />
                          ) : (
                            <FileText className="w-3 h-3" />
                          )}
                          <span>{source.type}</span>
                        </button>
                      ))}
                      {message.sources.length > 5 && (
                        <span className="text-xs text-muted-foreground">
                          +{message.sources.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {chatMutation.isPending && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about your photos, documents, or memories..."
            className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            className="px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Personal AI Assistant Page
 * Chat with your vault - ask questions about your photos, documents, and memories.
 * 100% local. No cloud. No Big Tech surveillance.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://api-vault.0711.io';

// Message bubble component
const MessageBubble = ({ message, isUser }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
    <div
      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-orange-500 text-white rounded-br-md'
          : 'bg-gray-800 text-gray-100 rounded-bl-md'
      }`}
    >
      <p className="whitespace-pre-wrap">{message.content}</p>
      {message.sources && message.sources.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <p className="text-xs text-gray-400">
            📎 {message.sources.length} related items
          </p>
        </div>
      )}
    </div>
  </div>
);

// Suggested prompts
const SUGGESTIONS = [
  "When did I last see Mom?",
  "Show me photos from last summer",
  "Find my insurance documents",
  "What places have I visited this year?",
  "Who appears most in my photos?",
];

export default function Assistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const token = localStorage.getItem('vault_token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (content) => {
    if (!content.trim() || loading) return;

    const userMessage = { role: 'user', content: content.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: content.trim(),
          conversation_id: conversationId,
          include_context: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      setConversationId(data.conversation_id);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          sources: data.sources,
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I couldn't process that request. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (suggestion) => {
    sendMessage(suggestion);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          <div className="w-px h-6 bg-gray-700" />
          <div>
            <h1 className="text-xl font-semibold">AI Assistant</h1>
            <p className="text-xs text-gray-500">
              100% local • Your data never leaves your device
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Running on your hardware
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          // Welcome state
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl">
              🧠
            </div>
            <h2 className="text-2xl font-bold mb-3">
              Your Personal AI Assistant
            </h2>
            <p className="text-gray-400 mb-8">
              Ask me anything about your photos, documents, and memories.
              <br />I run 100% locally — your data stays yours.
            </p>
            
            {/* Suggestions */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-3">Try asking:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(suggestion)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Messages
          <div className="max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} isUser={msg.role === 'user'} />
            ))}
            {loading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your photos, documents, or memories..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-medium transition-colors"
          >
            Send
          </button>
        </form>
        <p className="text-center text-xs text-gray-600 mt-3">
          Powered by local AI • No data sent to external servers
        </p>
      </div>
    </div>
  );
}

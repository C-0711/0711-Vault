import { useState, useEffect, useCallback, useRef } from "react";
import * as crypto from "../lib/chatCrypto";

const API_URL = import.meta.env.VITE_API_URL || "";

export function useChat(token, userId, masterKey) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [keys, setKeys] = useState(null);
  const [keysReady, setKeysReady] = useState(false);
  const wsRef = useRef(null);
  const keysRef = useRef(null);

  // Initialize crypto keys
  useEffect(() => {
    if (!userId || !masterKey) return;
    
    (async () => {
      try {
        const userKeys = await crypto.initializeChatKeys(userId, masterKey);
        setKeys(userKeys);
        keysRef.current = userKeys;
        setKeysReady(true);
        
        // Upload public keys to server if not already done
        if (token) {
          await fetch(`${API_URL}/chat/keys`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              encryption_public_key: userKeys.encryption.publicKey,
              signing_public_key: userKeys.signing.publicKey,
            }),
          }).catch(() => {}); // Ignore if already uploaded
        }
      } catch (err) {
        console.error("Failed to initialize keys:", err);
      }
    })();
  }, [userId, masterKey, token]);

  // Fetch recipient's public key
  const fetchPublicKey = useCallback(async (targetUserId) => {
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/chat/keys/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, [token]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  }, [token]);

  // Decrypt message content
  const decryptMessage = useCallback((encryptedContent, conversationId) => {
    const convKey = keysRef.current?.conversationKeys?.[conversationId];
    if (!convKey) {
      // Fallback: try hex decode (for non-E2EE messages)
      try {
        const bytes = encryptedContent.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || [];
        return new TextDecoder().decode(new Uint8Array(bytes));
      } catch {
        return "[Encrypted]";
      }
    }
    try {
      return crypto.decryptChat(encryptedContent, convKey);
    } catch {
      return "[Decryption failed]";
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId) => {
    if (!token || !conversationId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/chat/conversations/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
    setLoading(false);
  }, [token]);

  // Send a message (encrypted)
  const sendMessage = useCallback(async (conversationId, content, type = "text") => {
    if (!token || !conversationId || !content || !keysRef.current) return null;
    
    // Get or create conversation key
    let convKey = keysRef.current.conversationKeys?.[conversationId];
    if (!convKey) {
      // For now, use a simple key (in production, would do key exchange)
      convKey = crypto.generateConversationKey();
      await crypto.storeConversationKey(userId, conversationId, convKey, masterKey);
      keysRef.current.conversationKeys[conversationId] = convKey;
    }
    
    // Encrypt the content
    const encryptedContent = crypto.encryptChat(content, convKey);
    
    // Sign the message
    const signature = crypto.signMessage(encryptedContent, keysRef.current.signing.privateKey);
    
    try {
      const res = await fetch(
        `${API_URL}/chat/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            encrypted_content: encryptedContent,
            message_type: type,
            signature: signature,
          }),
        }
      );
      const data = await res.json();
      
      // Add message locally (decrypted for display)
      if (data.message_id) {
        const newMsg = {
          id: data.message_id,
          sender_id: userId,
          encrypted_content: encryptedContent,
          message_type: type,
          created_at: new Date().toISOString(),
          _decrypted: content, // Cache decrypted content
        };
        setMessages(prev => [...prev, newMsg]);
      }
      
      return data;
    } catch (err) {
      console.error("Failed to send message:", err);
      return null;
    }
  }, [token, userId, masterKey]);

  // Create a new conversation with key exchange
  const createConversation = useCallback(async (memberIds, type = "direct", name = null) => {
    if (!token || !memberIds.length || !keysRef.current) return null;
    
    // Generate a new conversation key
    const conversationKey = crypto.generateConversationKey();
    
    // Encrypt the key for each member
    const encryptedKeys = {};
    for (const memberId of memberIds) {
      if (memberId === userId) {
        // Encrypt for self
        encryptedKeys[memberId] = crypto.encryptKeyForRecipient(
          conversationKey,
          keysRef.current.encryption.privateKey,
          keysRef.current.encryption.publicKey
        );
      } else {
        // Fetch recipient's public key and encrypt
        const recipientKeys = await fetchPublicKey(memberId);
        if (recipientKeys?.encryption_public_key) {
          encryptedKeys[memberId] = crypto.encryptKeyForRecipient(
            conversationKey,
            keysRef.current.encryption.privateKey,
            recipientKeys.encryption_public_key
          );
        } else {
          // Placeholder if no keys found
          encryptedKeys[memberId] = "0000";
        }
      }
    }
    
    // Encrypt conversation name if provided
    const encryptedName = name 
      ? crypto.encryptChat(name, conversationKey)
      : null;
    
    try {
      const res = await fetch(`${API_URL}/chat/conversations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          member_ids: memberIds,
          encrypted_keys: encryptedKeys,
          encrypted_name: encryptedName,
        }),
      });
      const data = await res.json();
      
      // Store conversation key locally
      if (data.conversation_id) {
        await crypto.storeConversationKey(userId, data.conversation_id, conversationKey, masterKey);
        keysRef.current.conversationKeys[data.conversation_id] = conversationKey;
      }
      
      await fetchConversations();
      return data;
    } catch (err) {
      console.error("Failed to create conversation:", err);
      return null;
    }
  }, [token, userId, masterKey, fetchConversations, fetchPublicKey]);

  // Decrypt conversation key when joining
  const decryptConversationKey = useCallback(async (conversationId, encryptedKey, senderPublicKey) => {
    if (!keysRef.current) return null;
    
    try {
      const key = crypto.decryptKeyFromSender(
        encryptedKey,
        keysRef.current.encryption.privateKey,
        senderPublicKey
      );
      await crypto.storeConversationKey(userId, conversationId, key, masterKey);
      keysRef.current.conversationKeys[conversationId] = key;
      return key;
    } catch (err) {
      console.error("Failed to decrypt conversation key:", err);
      return null;
    }
  }, [userId, masterKey]);

  // WebSocket connection
  useEffect(() => {
    if (!token) return;
    
    const wsUrl = `${API_URL.replace("http", "ws")}/chat/ws/${token}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("Chat WebSocket connected");
      setConnected(true);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "message:new") {
        // Add new message if we are in that conversation
        if (data.conversation_id === activeConversation) {
          setMessages(prev => [...prev, data.message]);
        }
        // Update conversation list
        fetchConversations();
      }
      
      if (data.type === "key:update") {
        // Someone shared a key with us
        decryptConversationKey(
          data.conversation_id,
          data.encrypted_key,
          data.sender_public_key
        );
      }
    };
    
    ws.onclose = () => {
      console.log("Chat WebSocket disconnected");
      setConnected(false);
    };
    
    ws.onerror = (err) => {
      console.error("Chat WebSocket error:", err);
    };
    
    wsRef.current = ws;
    
    // Ping to keep alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
    
    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [token, activeConversation, fetchConversations, decryptConversationKey]);

  // Select a conversation
  const selectConversation = useCallback((conversationId) => {
    setActiveConversation(conversationId);
    fetchMessages(conversationId);
  }, [fetchMessages]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Decode content (wrapper that handles both encrypted and plain)
  const decodeContent = useCallback((encryptedContent, conversationId) => {
    if (!conversationId) {
      // Fallback for conversation names etc
      try {
        const bytes = encryptedContent.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || [];
        return new TextDecoder().decode(new Uint8Array(bytes));
      } catch {
        return encryptedContent;
      }
    }
    return decryptMessage(encryptedContent, conversationId);
  }, [decryptMessage]);

  return {
    conversations,
    activeConversation,
    messages,
    loading,
    connected,
    keysReady,
    selectConversation,
    sendMessage,
    createConversation,
    fetchConversations,
    decodeContent,
    decryptMessage,
    publicKey: keys?.encryption?.publicKey,
  };
}

export default useChat;

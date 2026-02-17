import { useState, useEffect, useCallback, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export function useChat(token) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

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

  // Send a message
  const sendMessage = useCallback(async (conversationId, content, type = "text") => {
    if (!token || !conversationId || !content) return null;
    
    // For now, just hex-encode the content (real E2EE would encrypt here)
    const encryptedContent = Array.from(new TextEncoder().encode(content))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    
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
          }),
        }
      );
      const data = await res.json();
      
      // Add message locally
      if (data.message_id) {
        const newMsg = {
          id: data.message_id,
          sender_id: "me", // Will be replaced with actual user ID
          encrypted_content: encryptedContent,
          message_type: type,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newMsg]);
      }
      
      return data;
    } catch (err) {
      console.error("Failed to send message:", err);
      return null;
    }
  }, [token]);

  // Create a new conversation
  const createConversation = useCallback(async (memberIds, type = "direct", name = null) => {
    if (!token || !memberIds.length) return null;
    
    // Generate placeholder encrypted keys (real E2EE would do key exchange here)
    const encryptedKeys = {};
    memberIds.forEach(id => {
      encryptedKeys[id] = "0000000000000000"; // Placeholder
    });
    
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
          encrypted_name: name ? Array.from(new TextEncoder().encode(name))
            .map(b => b.toString(16).padStart(2, "0")).join("") : null,
        }),
      });
      const data = await res.json();
      await fetchConversations();
      return data;
    } catch (err) {
      console.error("Failed to create conversation:", err);
      return null;
    }
  }, [token, fetchConversations]);

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
        // Update conversation list (bump to top, increment unread)
        fetchConversations();
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
  }, [token, activeConversation, fetchConversations]);

  // Select a conversation
  const selectConversation = useCallback((conversationId) => {
    setActiveConversation(conversationId);
    fetchMessages(conversationId);
  }, [fetchMessages]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Decode hex content to string (for display)
  const decodeContent = (hexContent) => {
    try {
      const bytes = hexContent.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || [];
      return new TextDecoder().decode(new Uint8Array(bytes));
    } catch {
      return hexContent;
    }
  };

  return {
    conversations,
    activeConversation,
    messages,
    loading,
    connected,
    selectConversation,
    sendMessage,
    createConversation,
    fetchConversations,
    decodeContent,
  };
}

export default useChat;

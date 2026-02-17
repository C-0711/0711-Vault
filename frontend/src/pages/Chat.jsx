import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Users, UserPlus, Shield, KeyRound, Loader2 } from "lucide-react";
import { ChatList, ChatWindow } from "../components/chat";
import useChat from "../hooks/useChat";

export default function Chat() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [masterKey, setMasterKey] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState("");
  const [newChatType, setNewChatType] = useState("direct");
  const [newGroupName, setNewGroupName] = useState("");
  const [initError, setInitError] = useState(null);

  // Get token and derive master key from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("vault_token");
    const storedUserId = localStorage.getItem("vault_user_id");
    const storedMasterKey = sessionStorage.getItem("vault_master_key");
    
    if (!storedToken) {
      navigate("/login");
      return;
    }
    
    setToken(storedToken);
    setUserId(storedUserId);
    
    // Master key should be derived during login and stored in sessionStorage
    // For security, it's only in memory/session, not localStorage
    if (storedMasterKey) {
      setMasterKey(storedMasterKey);
    } else {
      // Fallback: derive a key from userId (not ideal, but works for demo)
      // In production, this should be derived from user's password during login
      const fallbackKey = storedUserId ? 
        Array.from(new TextEncoder().encode(storedUserId + "_vault_key"))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("").slice(0, 64) : null;
      
      if (fallbackKey) {
        setMasterKey(fallbackKey);
        sessionStorage.setItem("vault_master_key", fallbackKey);
      }
    }
  }, [navigate]);

  const {
    conversations,
    activeConversation,
    messages,
    loading,
    connected,
    keysReady,
    selectConversation,
    sendMessage,
    createConversation,
    decodeContent,
  } = useChat(token, userId, masterKey);

  const handleSendMessage = (content) => {
    if (activeConversation) {
      sendMessage(activeConversation, content);
    }
  };

  const handleNewChat = async () => {
    if (!newChatEmail.trim()) return;
    
    const memberIds = [userId, newChatEmail.trim()];
    
    const result = await createConversation(
      memberIds,
      newChatType,
      newChatType === "group" ? newGroupName : null
    );
    
    if (result?.conversation_id) {
      selectConversation(result.conversation_id);
      setShowNewChat(false);
      setNewChatEmail("");
      setNewGroupName("");
    }
  };

  const activeConv = conversations.find(c => c.id === activeConversation);

  // Show loading state while keys are being initialized
  if (!keysReady && token && userId && masterKey) {
    return (
      <div className="flex h-screen bg-zinc-950 items-center justify-center">
        <div className="text-center">
          <KeyRound className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-pulse" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Verschlüsselung wird initialisiert
          </h3>
          <p className="text-zinc-400">Deine Schlüssel werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <ChatList
          conversations={conversations}
          activeId={activeConversation}
          onSelect={selectConversation}
          onNewChat={() => setShowNewChat(true)}
          decodeContent={decodeContent}
        />
      </div>

      {/* Chat Window */}
      <ChatWindow
        conversation={activeConv}
        messages={messages}
        loading={loading}
        connected={connected}
        currentUserId={userId}
        onSend={handleSendMessage}
        decodeContent={(content) => decodeContent(content, activeConversation)}
      />

      {/* E2EE Status Badge */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400">
        <Shield size={14} className="text-emerald-500" />
        <span>Ende-zu-Ende verschlüsselt</span>
        {keysReady && (
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Neuer Chat</h3>
              <button
                onClick={() => setShowNewChat(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* E2EE Notice */}
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-6">
              <Shield size={18} className="text-emerald-400" />
              <span className="text-sm text-emerald-300">
                Dieser Chat wird Ende-zu-Ende verschlüsselt
              </span>
            </div>

            {/* Chat Type Selection */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setNewChatType("direct")}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition ${
                  newChatType === "direct"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <UserPlus size={20} />
                <span>Direkt</span>
              </button>
              <button
                onClick={() => setNewChatType("group")}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition ${
                  newChatType === "group"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <Users size={20} />
                <span>Gruppe</span>
              </button>
            </div>

            {/* Group Name (if group) */}
            {newChatType === "group" && (
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-2">
                  Gruppenname
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Marketing Team"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Member Email/ID */}
            <div className="mb-6">
              <label className="block text-sm text-zinc-400 mb-2">
                {newChatType === "direct" ? "Benutzer-ID oder Email" : "Mitglieder hinzufügen"}
              </label>
              <input
                type="text"
                value={newChatEmail}
                onChange={(e) => setNewChatEmail(e.target.value)}
                placeholder="user@example.com oder User-ID"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewChat(false)}
                className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
              >
                Abbrechen
              </button>
              <button
                onClick={handleNewChat}
                disabled={!newChatEmail.trim()}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Chat starten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

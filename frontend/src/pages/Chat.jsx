import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Users, UserPlus } from "lucide-react";
import { ChatList, ChatWindow } from "../components/chat";
import useChat from "../hooks/useChat";

export default function Chat() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState("");
  const [newChatType, setNewChatType] = useState("direct");
  const [newGroupName, setNewGroupName] = useState("");

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("vault_token");
    const storedUserId = localStorage.getItem("vault_user_id");
    if (!storedToken) {
      navigate("/login");
      return;
    }
    setToken(storedToken);
    setUserId(storedUserId);
  }, [navigate]);

  const {
    conversations,
    activeConversation,
    messages,
    loading,
    connected,
    selectConversation,
    sendMessage,
    createConversation,
    decodeContent,
  } = useChat(token);

  const handleSendMessage = (content) => {
    if (activeConversation) {
      sendMessage(activeConversation, content);
    }
  };

  const handleNewChat = async () => {
    if (!newChatEmail.trim()) return;
    
    // For now, use email as member ID (in real app, would lookup user)
    // This is a simplified version
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
        decodeContent={decodeContent}
      />

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

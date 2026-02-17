import { useRef, useEffect } from "react";
import { MoreVertical, Phone, Video, Shield, Loader2 } from "lucide-react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

export default function ChatWindow({ 
  conversation, 
  messages, 
  loading, 
  connected,
  currentUserId,
  onSend,
  decodeContent 
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <div className="text-center text-zinc-500">
          <Shield size={64} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">0711 Secure Chat</h3>
          <p>Wähle einen Chat oder starte einen neuen</p>
          <p className="text-sm mt-2 text-emerald-500">
            Ende-zu-Ende verschlüsselt
          </p>
        </div>
      </div>
    );
  }

  const chatName = conversation.encrypted_name 
    ? decodeContent(conversation.encrypted_name) 
    : "Chat";

  return (
    <div className="flex-1 flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            conversation.type === "group" ? "bg-blue-600" : 
            conversation.type === "channel" ? "bg-purple-600" : "bg-emerald-600"
          }`}>
            <span className="text-white font-semibold">
              {chatName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-white">{chatName}</h3>
            <div className="flex items-center gap-2 text-xs">
              {connected ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                  Verbunden
                </span>
              ) : (
                <span className="text-yellow-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                  Verbinde...
                </span>
              )}
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-500 flex items-center gap-1">
                <Shield size={12} />
                Verschlüsselt
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <Phone size={20} />
          </button>
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <Video size={20} />
          </button>
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-500">
            <div className="text-center">
              <Shield size={48} className="mx-auto mb-3 opacity-50" />
              <p>Noch keine Nachrichten</p>
              <p className="text-sm">Starte die Unterhaltung!</p>
            </div>
          </div>
        ) : (
          <>
            {/* Encryption Notice */}
            <div className="flex justify-center mb-4">
              <span className="px-3 py-1 bg-zinc-900 text-zinc-500 text-xs rounded-full flex items-center gap-1">
                <Shield size={12} />
                Nachrichten sind Ende-zu-Ende verschlüsselt
              </span>
            </div>
            
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === currentUserId || msg.sender_id === "me"}
                decodeContent={decodeContent}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput onSend={onSend} disabled={!connected} />
    </div>
  );
}

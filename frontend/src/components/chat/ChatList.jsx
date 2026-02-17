import { useState } from "react";
import { MessageCircle, Plus, Users, Hash, Search } from "lucide-react";

export default function ChatList({ 
  conversations, 
  activeId, 
  onSelect, 
  onNewChat,
  decodeContent 
}) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter(c => {
    if (!search) return true;
    const name = c.encrypted_name ? decodeContent(c.encrypted_name) : "Chat";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const getIcon = (type) => {
    switch (type) {
      case "group": return <Users size={18} />;
      case "channel": return <Hash size={18} />;
      default: return <MessageCircle size={18} />;
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Chats</h2>
          <button
            onClick={onNewChat}
            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
            <p>Keine Chats</p>
            <button
              onClick={onNewChat}
              className="mt-3 text-emerald-400 hover:text-emerald-300"
            >
              Neuen Chat starten
            </button>
          </div>
        ) : (
          filtered.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`flex items-center gap-3 p-4 cursor-pointer border-b border-zinc-800 hover:bg-zinc-800 transition ${
                activeId === conv.id ? "bg-zinc-800 border-l-2 border-l-emerald-500" : ""
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                conv.type === "group" ? "bg-blue-600" : 
                conv.type === "channel" ? "bg-purple-600" : "bg-emerald-600"
              }`}>
                {getIcon(conv.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white truncate">
                    {conv.encrypted_name ? decodeContent(conv.encrypted_name) : "Chat"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatTime(conv.created_at)}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 truncate">
                  {conv.type === "direct" ? "Direkte Nachricht" :
                   conv.type === "group" ? "Gruppe" : "Kanal"}
                </p>
              </div>
              {conv.unread_count > 0 && (
                <span className="px-2 py-1 text-xs font-bold bg-emerald-500 text-white rounded-full">
                  {conv.unread_count}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

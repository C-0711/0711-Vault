import { Check, CheckCheck } from "lucide-react";

export default function MessageBubble({ message, isOwn, decodeContent }) {
  const content = decodeContent(message.encrypted_content);
  
  const formatTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          isOwn
            ? "bg-emerald-600 text-white rounded-br-md"
            : "bg-zinc-800 text-white rounded-bl-md"
        }`}
      >
        {/* Message Content */}
        {message.message_type === "text" && (
          <p className="whitespace-pre-wrap break-words">{content}</p>
        )}
        
        {message.message_type === "image" && (
          <div className="mb-1">
            <img 
              src={`data:image/jpeg;base64,${content}`} 
              alt="Image" 
              className="rounded-lg max-w-full"
            />
          </div>
        )}

        {/* Timestamp & Status */}
        <div className={`flex items-center gap-1 mt-1 ${
          isOwn ? "justify-end" : "justify-start"
        }`}>
          <span className={`text-xs ${isOwn ? "text-emerald-200" : "text-zinc-500"}`}>
            {formatTime(message.created_at)}
          </span>
          {isOwn && (
            <CheckCheck size={14} className="text-emerald-200" />
          )}
        </div>
      </div>
    </div>
  );
}

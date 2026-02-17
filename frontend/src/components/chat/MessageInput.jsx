import { useState, useRef } from "react";
import { Send, Paperclip, Mic, Image, Smile } from "lucide-react";

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-zinc-900 border-t border-zinc-800">
      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <button
          type="button"
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
        >
          <Paperclip size={20} />
        </button>

        {/* Input Container */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht schreiben..."
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-2xl text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
          
          {/* Emoji Button */}
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            <Smile size={20} />
          </button>
        </div>

        {/* Send / Voice Button */}
        {text.trim() ? (
          <button
            type="submit"
            disabled={disabled}
            className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            className={`p-3 rounded-full transition ${
              isRecording 
                ? "bg-red-600 hover:bg-red-500 text-white" 
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
            }`}
          >
            <Mic size={20} />
          </button>
        )}
      </div>
    </form>
  );
}

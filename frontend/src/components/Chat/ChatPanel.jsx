import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";

export default function ChatPanel({ messages, typingUsers, userInfo, onSend, onTypingStart, onTypingStop }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleInput = (e) => {
    setInput(e.target.value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingStart();
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTypingStop();
    }, 1500);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput("");
    isTypingRef.current = false;
    onTypingStop();
    clearTimeout(typingTimerRef.current);
  };

  return (
    <div className="flex flex-col h-full workspace-card border-l">
      <div className="px-4 py-3 border-b border-app flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-xs font-black text-brand">CH</span>
        <h3 className="text-sm font-black text-app">Chat</h3>
        <span className="ml-auto rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">{messages.length} msgs</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="console-empty mt-8 text-center">
            <p className="text-xs font-bold text-app">No messages yet</p>
            <p className="mt-1 text-xs text-muted">Start the interview conversation here.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.username === userInfo?.username;
          return (
            <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
              {!isOwn && (
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: msg.color }} />
                  <span className="text-xs font-bold" style={{ color: msg.color }}>{msg.username}</span>
                  <span className="text-xs text-muted">{format(new Date(msg.timestamp), "HH:mm")}</span>
                </div>
              )}
              <div
                className={`max-w-[86%] px-3 py-2 rounded-xl text-sm break-words border ${
                  isOwn ? "rounded-br-sm text-app" : "rounded-bl-sm text-app"
                }`}
                style={{
                  background: isOwn ? "var(--brand-soft)" : "var(--surface-soft)",
                  borderColor: isOwn ? "color-mix(in srgb, var(--brand) 26%, transparent)" : "var(--border)",
                }}
              >
                {msg.message}
              </div>
              {isOwn && <span className="text-xs text-muted mt-0.5">{format(new Date(msg.timestamp), "HH:mm")}</span>}
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted italic">
            <span className="flex gap-0.5 text-brand">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
            </span>
            {typingUsers.map((u) => u.username).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-app">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={handleInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message..."
            rows={1}
            className="field-input flex-1 text-sm resize-none font-sans"
            style={{ minHeight: "38px", maxHeight: "120px" }}
          />
          <button onClick={handleSend} disabled={!input.trim()} className="primary-button px-3 py-2 text-sm disabled:cursor-not-allowed">
            Send
          </button>
        </div>
        <p className="text-xs text-muted mt-1">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
}

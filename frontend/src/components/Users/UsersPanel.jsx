import React from "react";

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function UsersPanel({ users, currentSocketId, isHost, onToggleLock, editingLocked }) {
  return (
    <div className="workspace-card border-b">
      <div className="px-4 py-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-xs font-black text-brand">US</span>
        <h3 className="text-sm font-black text-app">
          Participants <span className="text-muted font-normal">({users.length})</span>
        </h3>

        {isHost && (
          <button
            onClick={() => onToggleLock(!editingLocked)}
            title={editingLocked ? "Unlock editing" : "Lock editing"}
            className="ml-auto workspace-pill text-xs px-2 py-1 rounded-md transition-colors"
          >
            {editingLocked ? "Locked" : "Lock"}
          </button>
        )}
      </div>

      <div className="px-3 pb-3 space-y-1.5 max-h-56 overflow-y-auto">
        {users.map((user) => (
          <div
            key={user.socketId}
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg border"
            style={{
              background: user.socketId === currentSocketId ? "var(--brand-soft)" : "var(--surface-soft)",
              borderColor: user.socketId === currentSocketId ? "color-mix(in srgb, var(--brand) 24%, transparent)" : "var(--border)",
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{
                backgroundColor: user.color + "33",
                color: user.color,
                border: `1.5px solid ${user.color}66`,
              }}
            >
              {getInitials(user.username)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-app truncate">
                {user.username}
                {user.socketId === currentSocketId && <span className="text-muted font-normal"> (you)</span>}
              </p>
            </div>

            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-black border"
              style={{
                color: user.role === "host" ? "#facc15" : "var(--muted)",
                background: user.role === "host" ? "rgba(250,204,21,0.12)" : "var(--surface-soft)",
                borderColor: user.role === "host" ? "rgba(250,204,21,0.24)" : "var(--border)",
              }}
            >
              {user.role}
            </span>

            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

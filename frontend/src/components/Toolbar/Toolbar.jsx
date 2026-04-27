import React, { useState } from "react";
import InterviewTimer from "../InterviewTimer/InterviewTimer";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript", icon: "JS", color: "#f7df1e" },
  { value: "python", label: "Python 3", icon: "PY", color: "#3776ab" },
  { value: "cpp", label: "C++", icon: "C++", color: "#00599c" },
];

export default function Toolbar({
  roomId, language, theme, connected, isHost,
  interviewMode, timerEnd, userCount,
  onLanguageChange, onThemeToggle, onSaveSnapshot,
  onToggleInterviewMode, onOpenHistory, onOpenTemplates, onLogout,
}) {
  const [copied, setCopied] = useState(false);
  const [showInterview, setShowInterview] = useState(false);
  const [timerMins, setTimerMins] = useState(60);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeLang = LANGUAGES.find(l => l.value === language) || LANGUAGES[0];

  return (
    <div className="workspace-toolbar flex items-center gap-2 px-4 py-2 border-b flex-shrink-0 flex-wrap">

      {/* Logo */}
      <div className="flex items-center gap-2 mr-2 shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono text-xs"
          style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.25)", color: "#22d3ee" }}>
          CS
        </div>
        <span className="text-app font-bold text-sm hidden md:block">CodeSync</span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-white/8 hidden md:block" />

      {/* Room ID pill */}
      <button onClick={copyLink}
        className="workspace-pill flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all group shrink-0">
        <span className="workspace-muted hidden sm:block">Room</span>
        <span className="text-app font-mono">{roomId}</span>
        <span className="workspace-muted transition-colors">
          {copied ? "✓" : "⎘"}
        </span>
      </button>

      {/* Language selector */}
      <div className="relative shrink-0">
        <select value={language} onChange={e => onLanguageChange(e.target.value)}
          className="appearance-none pl-7 pr-3 py-1.5 rounded-lg text-xs font-semibold font-mono outline-none cursor-pointer transition-all"
          style={{
            background: `${activeLang.color}12`,
            border: `1px solid ${activeLang.color}30`,
            color: activeLang.color,
          }}>
          {LANGUAGES.map(l => (
            <option key={l.value} value={l.value} style={{ background: "#0a0e1a", color: l.color }}>
              {l.label}
            </option>
          ))}
        </select>
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold pointer-events-none"
          style={{ color: activeLang.color }}>
          {activeLang.icon.slice(0, 2)}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-white/8 hidden lg:block" />

      {/* Templates */}
      <ToolbarBtn icon="📋" label="Templates" onClick={onOpenTemplates} />

      {/* Snapshot */}
      <ToolbarBtn icon="💾" label="Snapshot" onClick={onSaveSnapshot} />

      {/* History */}
      <ToolbarBtn icon="🕐" label="History" onClick={onOpenHistory} />

      {/* Interview Mode (host only) */}
      {isHost && (
        <div className="relative">
          <button onClick={() => setShowInterview(s => !s)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
            style={interviewMode
              ? { background: "rgba(167,139,250,0.15)", color: "#c084fc", border: "1px solid rgba(192,132,252,0.35)" }
              : { background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.07)" }}>
            🎯
            <span className="hidden sm:inline">{interviewMode ? "Live" : "Interview"}</span>
          </button>

          {showInterview && (
            <div className="absolute top-full left-0 mt-1.5 rounded-xl p-4 z-50 shadow-2xl w-56"
              style={{ background: "#0d1221", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-app text-xs font-bold mb-3">Interview Mode</p>
              <div className="flex items-center gap-2 mb-3">
                <label className="text-slate-500 text-xs shrink-0">Timer (min)</label>
                <input type="number" value={timerMins} min={5} max={180}
                  onChange={e => setTimerMins(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 text-white text-xs rounded-lg px-2 py-1 outline-none" />
              </div>
              <button
                onClick={() => { onToggleInterviewMode(!interviewMode, timerMins); setShowInterview(false); }}
                className="w-full py-2 rounded-lg text-xs font-bold transition-all"
                style={interviewMode
                  ? { background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }
                  : { background: "rgba(167,139,250,0.15)", color: "#c084fc", border: "1px solid rgba(192,132,252,0.3)" }}>
                {interviewMode ? "⏹ End Interview" : "▶ Start Interview"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Interview timer */}
      {interviewMode && timerEnd && (
        <InterviewTimer timerEnd={timerEnd} isHost={isHost} />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User count */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs shrink-0"
        style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)", color: "#34d399" }}>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono font-bold">{userCount}</span>
        <span className="hidden sm:inline text-emerald-600">online</span>
      </div>

      {/* Connection status */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400 animate-pulse"}`} />
      </div>

      {/* Theme */}
      <button onClick={onThemeToggle}
        className="workspace-pill w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all shrink-0">
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      {/* Share */}
      <button onClick={copyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
        style={{ background: copied ? "rgba(52,211,153,0.15)" : "rgba(34,211,238,0.1)", color: copied ? "#34d399" : "#22d3ee", border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(34,211,238,0.25)"}` }}>
        {copied ? "✓ Copied!" : "🔗 Share"}
      </button>

      <button onClick={onLogout}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
        style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.24)" }}>
        Logout
      </button>
    </div>
  );
}

function ToolbarBtn({ icon, label, onClick }) {
  return (
    <button onClick={onClick}
      className="workspace-pill flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs workspace-muted hover:text-app transition-all shrink-0">
      <span>{icon}</span>
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

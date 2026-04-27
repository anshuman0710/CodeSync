import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authApi, clearSession, getStoredUser, getToken } from "../services/auth";

import Toolbar from "../components/Toolbar/Toolbar";
import CodeEditor from "../components/Editor/CodeEditor";
import ChatPanel from "../components/Chat/ChatPanel";
import UsersPanel from "../components/Users/UsersPanel";
import ConsolePanel from "../components/Console/ConsolePanel";
import VersionHistory from "../components/VersionHistory/VersionHistory";
import TemplatesModal from "../components/Templates/TemplatesModal";
import { useRoom } from "../hooks/useRoom";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [currentUser] = useState(() => getStoredUser());
  const [username] = useState(() => currentUser?.name || sessionStorage.getItem("codesync-username") || "Guest");

  const [theme, setTheme] = useState(() => localStorage.getItem("codesync-theme") || "dark");
  const [consoleHeight, setConsoleHeight] = useState(200);
  const [isDragging, setIsDragging] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [activePanel, setActivePanel] = useState("chat"); // "chat" | "users"
  const [notification, setNotification] = useState(null);
  const [problemDraft, setProblemDraft] = useState({ title: "", prompt: "" });

  const {
    roomState, cursors, selections, chatMessages, typingUsers,
    error, connected, lastExecution, isExecuting,
    sendCodeChange, sendCursorMove, sendSelection,
    sendChatMessage, sendTypingStart, sendTypingStop,
    changeLanguage, saveSnapshot, executeCode,
    toggleInterviewMode, toggleEditingLock,
    assignProblem,
  } = useRoom(roomId, username);

  const isHost = roomState.userInfo?.role === "host";
  const isViewer = roomState.userInfo?.role === "viewer";
  const isReadOnly = isViewer || (roomState.editingLocked && !isHost);
  const analysis = getCodeAnalysis(roomState.code, roomState.language);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("codesync-theme", theme);
  }, [theme]);

  // Show toast notifications
  const showToast = (msg, type = "info") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch snapshots when history opens
  const handleOpenHistory = async () => {
    try {
      const res = await authApi.get(`/api/rooms/${roomId}/snapshots`);
      setSnapshots(res.data);
    } catch { setSnapshots([]); }
    setShowHistory(true);
  };

  // Restore snapshot
  const handleRestore = async (snapshotId, code, lang) => {
    try {
      await authApi.post(`/api/rooms/${roomId}/restore`, { snapshotId });
      changeLanguage(lang);
      // Trigger code sync via socket (emit full code change)
      sendCodeChange({ range: { startLineNumber: 1, startColumn: 1, endLineNumber: 999999, endColumn: 1 }, text: code }, code);
      showToast("Snapshot restored!", "success");
    } catch { showToast("Restore failed", "error"); }
  };

  // Apply template
  const handleSelectTemplate = (template) => {
    changeLanguage(template.language);
    sendCodeChange({ range: { startLineNumber: 1, startColumn: 1, endLineNumber: 999999, endColumn: 1 }, text: template.code }, template.code);
    setShowTemplates(false);
    showToast(`Template "${template.name}" applied`, "success");
  };

  // Snapshot with toast
  const handleSaveSnapshot = () => {
    saveSnapshot();
    showToast("Snapshot saved ✓", "success");
  };

  // Console drag resize
  useEffect(() => {
    if (!isDragging) return;
    const move = (e) => {
      const h = window.innerHeight - e.clientY;
      setConsoleHeight(Math.max(80, Math.min(window.innerHeight * 0.55, h)));
    };
    const up = () => setIsDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [isDragging]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!getToken()) {
      navigate(`/?room=${roomId}`);
    }
  }, [roomId, navigate]);

  const handleAssignProblem = () => {
    assignProblem(problemDraft);
    showToast("Problem assigned", "success");
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#030712" }}>
        <div className="text-center p-8 rounded-2xl" style={{ border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-400 font-semibold mb-2">{error}</p>
          <button onClick={() => navigate("/")}
            className="text-sm text-cyan-400 hover:underline mt-2 block mx-auto">← Back to home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-shell flex flex-col h-screen overflow-hidden text-app transition-colors"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        .room-side-card {
          background: color-mix(in srgb, var(--surface) 82%, transparent);
          border: 1px solid var(--border);
          box-shadow: 0 14px 40px var(--shadow);
        }
        .room-tab-active {
          color: var(--brand);
          border-bottom: 2px solid var(--brand);
          background: var(--brand-soft);
        }
      `}</style>

      {/* Toast notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-xl text-sm font-semibold shadow-2xl transition-all"
          style={{
            background: notification.type === "success" ? "rgba(52,211,153,0.15)" : notification.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(34,211,238,0.15)",
            border: `1px solid ${notification.type === "success" ? "rgba(52,211,153,0.35)" : notification.type === "error" ? "rgba(239,68,68,0.35)" : "rgba(34,211,238,0.35)"}`,
            color: notification.type === "success" ? "#34d399" : notification.type === "error" ? "#f87171" : "#22d3ee",
          }}>
          {notification.type === "success" ? "✓ " : notification.type === "error" ? "✗ " : "ℹ "}{notification.msg}
        </div>
      )}

      {/* Toolbar */}
      <Toolbar
        roomId={roomId}
        language={roomState.language}
        theme={theme}
        connected={connected}
        isHost={isHost}
        interviewMode={roomState.interviewMode}
        timerEnd={roomState.timerEnd}
        userCount={roomState.users.length}
        onLanguageChange={changeLanguage}
        onThemeToggle={() => setTheme(t => t === "dark" ? "light" : "dark")}
        onSaveSnapshot={handleSaveSnapshot}
        onToggleInterviewMode={toggleInterviewMode}
        onOpenHistory={handleOpenHistory}
        onOpenTemplates={() => setShowTemplates(true)}
        onLogout={handleLogout}
      />

      {/* Interview mode banner */}
      {roomState.interviewMode && (
        <div className="flex items-center justify-center gap-3 py-1.5 text-xs font-semibold border-b shrink-0"
          style={{ background: "rgba(167,139,250,0.08)", borderColor: "rgba(167,139,250,0.2)", color: "#c084fc" }}>
          <span className="animate-pulse">🎯</span>
          Interview Mode Active
          {isHost && <span className="text-violet-600">— You are the host</span>}
        </div>
      )}

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="flex items-center justify-center gap-2 py-1.5 text-xs font-semibold border-b shrink-0"
          style={{ background: "rgba(250,204,21,0.07)", borderColor: "rgba(250,204,21,0.18)", color: "#facc15" }}>
          🔒 Editing locked by host — view only
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Editor + console column */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Monaco editor */}
          <div className="flex-1 overflow-hidden" style={{ height: `calc(100% - ${consoleHeight}px)` }}>
            <CodeEditor
              code={roomState.code}
              language={roomState.language}
              readOnly={isReadOnly}
              theme={theme}
              cursors={cursors}
              selections={selections}
              userInfo={roomState.userInfo}
              onCodeChange={sendCodeChange}
              onCursorMove={sendCursorMove}
              onSelection={sendSelection}
            />
          </div>

          {/* Drag handle */}
          <div
            className="h-1.5 flex items-center justify-center cursor-row-resize transition-all shrink-0 group"
            style={{ background: "var(--surface-soft)" }}
            onMouseDown={() => setIsDragging(true)}>
            <div className="w-12 h-0.5 rounded-full transition-all group-hover:bg-cyan-500/50"
              style={{ background: "var(--border)" }} />
          </div>

          {/* Console */}
          <div style={{ height: consoleHeight }} className="flex-shrink-0 overflow-hidden">
            <ConsolePanel lastExecution={lastExecution} isExecuting={isExecuting} onRun={executeCode} />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-80 flex-shrink-0 flex flex-col border-l overflow-hidden panel-surface">

          {/* Panel tabs */}
          <div className="flex border-b shrink-0" style={{ borderColor: "var(--border)" }}>
            {[
              { id: "chat", icon: "💬", label: "Chat", badge: chatMessages.length > 0 ? chatMessages.length : null },
              { id: "users", icon: "👥", label: `Users (${roomState.users.length})` },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActivePanel(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all relative"
                style={activePanel === tab.id
                  ? { color: "var(--brand)", borderBottom: "2px solid var(--brand)", background: "var(--brand-soft)" }
                  : { color: "var(--muted)" }}>
                {tab.icon} {tab.label}
                {tab.badge && activePanel !== tab.id && (
                  <span className="absolute top-1.5 right-6 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold"
                    style={{ background: "#22d3ee", color: "#000" }}>{tab.badge > 9 ? "9+" : tab.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Users panel */}
          {activePanel === "users" && (
            <div className="flex-1 overflow-y-auto">
              <UsersPanel
                users={roomState.users}
                currentSocketId={roomState.userInfo?.socketId}
                isHost={isHost}
                editingLocked={roomState.editingLocked}
                onToggleLock={toggleEditingLock}
              />

              {/* Room info card */}
              <div className="room-side-card m-3 p-3 rounded-xl">
                <p className="text-muted text-[10px] uppercase tracking-widest mb-2 font-semibold">Room Info</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Room ID</span>
                    <span className="text-app font-mono">{roomId}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Language</span>
                    <span className="text-app font-mono">{roomState.language}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Your role</span>
                    <span className="font-semibold" style={{ color: isHost ? "#facc15" : "#64748b" }}>
                      {roomState.userInfo?.role || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="m-3 p-3 rounded-xl" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                <p className="text-muted text-[10px] uppercase tracking-widest mb-2 font-semibold">Code Analysis</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg p-2" style={{ background: "var(--surface)" }}>
                    <p className="text-xs font-bold text-app">{analysis.lines}</p>
                    <p className="text-[10px] text-muted">lines</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: "var(--surface)" }}>
                    <p className="text-xs font-bold text-app">{analysis.complexity}</p>
                    <p className="text-[10px] text-muted">time</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: "var(--surface)" }}>
                    <p className="text-xs font-bold text-app">{analysis.score}</p>
                    <p className="text-[10px] text-muted">score</p>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{analysis.suggestion}</p>
              </div>

              {(isHost || roomState.problem?.title) && (
                <div className="mx-3 mb-3 p-3 rounded-xl" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                  <p className="text-muted text-[10px] uppercase tracking-widest mb-2 font-semibold">Problem</p>
                  {isHost ? (
                    <div className="space-y-2">
                      <input
                        className="field-input text-xs"
                        placeholder="Problem title"
                        value={problemDraft.title}
                        onChange={(e) => setProblemDraft({ ...problemDraft, title: e.target.value })}
                      />
                      <textarea
                        className="field-input min-h-[90px] text-xs"
                        placeholder="Prompt or constraints"
                        value={problemDraft.prompt}
                        onChange={(e) => setProblemDraft({ ...problemDraft, prompt: e.target.value })}
                      />
                      <button className="primary-button w-full py-2 text-xs" onClick={handleAssignProblem}>
                        Assign Problem
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-app">{roomState.problem.title}</p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-muted">{roomState.problem.prompt}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Quick actions */}
              {isHost && (
                <div className="room-side-card mx-3 mb-3 p-3 rounded-xl">
                  <p className="text-muted text-[10px] uppercase tracking-widest mb-2 font-semibold">Host Controls</p>
                  <button onClick={() => toggleEditingLock(!roomState.editingLocked)}
                    className="w-full py-2 rounded-lg text-xs font-semibold transition-all mb-2"
                    style={roomState.editingLocked
                      ? { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }
                      : { background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {roomState.editingLocked ? "🔒 Unlock Editing" : "🔓 Lock Editing"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Chat panel */}
          {activePanel === "chat" && (
            <div className="flex-1 overflow-hidden">
              <ChatPanel
                messages={chatMessages}
                typingUsers={typingUsers}
                userInfo={roomState.userInfo}
                onSend={sendChatMessage}
                onTypingStart={sendTypingStart}
                onTypingStop={sendTypingStop}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showHistory && (
        <VersionHistory
          snapshots={snapshots}
          onRestore={handleRestore}
          onClose={() => setShowHistory(false)}
        />
      )}
      {showTemplates && (
        <TemplatesModal
          onSelect={handleSelectTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}

function getCodeAnalysis(code = "", language = "javascript") {
  const lines = code.split("\n").filter((line) => line.trim()).length;
  const loopCount = (code.match(/\b(for|while|forEach|map|filter|reduce)\b/g) || []).length;
  const nestedLoop = /\b(for|while)\b[\s\S]*\{[\s\S]*\b(for|while)\b/.test(code);
  const recursion =
    language !== "python"
      ? /function\s+(\w+)[\s\S]*\1\s*\(/.test(code)
      : /def\s+(\w+)[\s\S]*\1\s*\(/.test(code);

  let complexity = "O(1)";
  if (nestedLoop) complexity = "O(n^2)";
  else if (loopCount > 0 || recursion) complexity = "O(n)";

  const score = Math.max(55, Math.min(98, 100 - loopCount * 7 - (lines > 120 ? 12 : 0)));
  const suggestion = nestedLoop
    ? "Nested loops detected. Ask whether sorting, hashing, or two pointers can reduce the cost."
    : recursion
      ? "Recursive flow detected. Check base cases and stack depth before submitting."
      : loopCount
        ? "Linear scan detected. Good baseline; confirm edge cases and input constraints."
        : "Small constant-time surface. Add tests for empty, single, and invalid inputs.";

  return { lines, complexity, score, suggestion };
}

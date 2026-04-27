import { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "./useSocket";
import { authApi, getToken } from "../services/auth";

export function useRoom(roomId, username) {
  const { socket, emit, on, connected } = useSocket();

  const [roomState, setRoomState] = useState({
    code: "// Loading...",
    language: "javascript",
    users: [],
    userInfo: null,
    interviewMode: false,
    editingLocked: false,
    timerEnd: null,
    problem: { title: "", prompt: "" },
  });

  const [cursors, setCursors] = useState({}); // { socketId: { username, color, position } }
  const [selections, setSelections] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [error, setError] = useState(null);
  const [lastExecution, setLastExecution] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const codeRef = useRef(roomState.code);
  const debounceTimer = useRef(null);

  // Join room on connection
  useEffect(() => {
    if (!connected || !roomId || !username) return;
    emit("join-room", {
      roomId,
      username,
      token: getToken(),
      requestedRole: sessionStorage.getItem("codesync-role") || "participant",
    });
  }, [connected, roomId, username, emit]);

  // Set up all socket listeners
  useEffect(() => {
    const cleanups = [];

    cleanups.push(
      on("room-joined", (data) => {
        setRoomState((s) => ({ ...s, ...data }));
        codeRef.current = data.code;
      })
    );

    cleanups.push(
      on("code-update", ({ delta, senderId }) => {
        // Apply delta to editor via ref (handled in Editor component)
        // Full code sync happens via delta application in Monaco
        if (socket?.id !== senderId) {
          // Trigger Monaco to apply the delta
          document.dispatchEvent(
            new CustomEvent("remote-code-update", { detail: { delta } })
          );
        }
      })
    );

    cleanups.push(
      on("cursor-update", ({ socketId, username, color, position }) => {
        setCursors((prev) => ({ ...prev, [socketId]: { username, color, position } }));
      })
    );

    cleanups.push(
      on("selection-update", ({ socketId, username, color, selection }) => {
        setSelections((prev) => ({ ...prev, [socketId]: { username, color, selection } }));
      })
    );

    cleanups.push(
      on("user-joined", ({ userInfo, users }) => {
        setRoomState((s) => ({ ...s, users }));
      })
    );

    cleanups.push(
      on("user-left", ({ socketId, users }) => {
        setRoomState((s) => ({ ...s, users }));
        setCursors((prev) => {
          const next = { ...prev };
          delete next[socketId];
          return next;
        });
      })
    );

    cleanups.push(
      on("chat-message", (msg) => {
        setChatMessages((prev) => [...prev, msg]);
      })
    );

    cleanups.push(
      on("user-typing", ({ socketId, username }) => {
        setTypingUsers((prev) =>
          prev.find((u) => u.socketId === socketId) ? prev : [...prev, { socketId, username }]
        );
      })
    );

    cleanups.push(
      on("user-stopped-typing", ({ socketId }) => {
        setTypingUsers((prev) => prev.filter((u) => u.socketId !== socketId));
      })
    );

    cleanups.push(
      on("language-updated", ({ language }) => {
        setRoomState((s) => ({ ...s, language }));
      })
    );

    cleanups.push(
      on("editing-lock-changed", ({ locked }) => {
        setRoomState((s) => ({ ...s, editingLocked: locked }));
      })
    );

    cleanups.push(
      on("interview-mode-changed", ({ enabled, timerEnd }) => {
        setRoomState((s) => ({ ...s, interviewMode: enabled, timerEnd }));
      })
    );

    cleanups.push(
      on("problem-assigned", ({ problem }) => {
        setRoomState((s) => ({ ...s, problem }));
      })
    );

    cleanups.push(
      on("editing-denied", ({ message }) => {
        setError(message || "Editing is locked");
      })
    );

    cleanups.push(on("error", ({ message }) => setError(message)));

    return () => cleanups.forEach((cleanup) => cleanup && cleanup());
  }, [on, socket]);

  // Send code changes (with debounce for DB persistence)
  const sendCodeChange = useCallback(
    (delta, fullCode) => {
      codeRef.current = fullCode;
      setRoomState((state) => ({ ...state, code: fullCode }));
      emit("code-change", { roomId, delta, fullCode });
    },
    [roomId, emit]
  );

  const sendCursorMove = useCallback(
    (position) => emit("cursor-move", { roomId, position }),
    [roomId, emit]
  );

  const sendSelection = useCallback(
    (selection) => emit("selection-change", { roomId, selection }),
    [roomId, emit]
  );

  const sendChatMessage = useCallback(
    (message) => emit("chat-message", { roomId, message }),
    [roomId, emit]
  );

  const sendTypingStart = useCallback(
    () => emit("typing-start", { roomId }),
    [roomId, emit]
  );

  const sendTypingStop = useCallback(
    () => emit("typing-stop", { roomId }),
    [roomId, emit]
  );

  const changeLanguage = useCallback(
    (language) => {
      emit("language-change", { roomId, language });
      setRoomState((s) => ({ ...s, language }));
    },
    [roomId, emit]
  );

  const saveSnapshot = useCallback(
    () => emit("save-snapshot", { roomId }),
    [roomId, emit]
  );

  const toggleInterviewMode = useCallback(
    (enabled, timerMinutes) =>
      emit("toggle-interview-mode", { roomId, enabled, timerMinutes }),
    [roomId, emit]
  );

  const toggleEditingLock = useCallback(
    (locked) => emit("toggle-editing-lock", { roomId, locked }),
    [roomId, emit]
  );

  const assignProblem = useCallback(
    (problem) => emit("assign-problem", { roomId, problem }),
    [roomId, emit]
  );

  const executeCode = useCallback(async (stdin = "") => {
    setIsExecuting(true);
    try {
      const res = await authApi.post("/api/execute", {
        code: codeRef.current,
        language: roomState.language,
        stdin,
      });
      setLastExecution(res.data);
    } catch (err) {
      setLastExecution({
        provider: "Piston",
        status: "Service Error",
        stderr: err.response?.data?.message || "Execution failed",
        errorDetails: [],
        isError: true,
      });
    } finally {
      setIsExecuting(false);
    }
  }, [roomState.language]);

  return {
    roomState,
    cursors,
    selections,
    chatMessages,
    typingUsers,
    error,
    connected,
    lastExecution,
    isExecuting,
    sendCodeChange,
    sendCursorMove,
    sendSelection,
    sendChatMessage,
    sendTypingStart,
    sendTypingStop,
    changeLanguage,
    saveSnapshot,
    executeCode,
    toggleInterviewMode,
    toggleEditingLock,
    assignProblem,
  };
}

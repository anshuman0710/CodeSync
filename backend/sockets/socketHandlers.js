const Room = require("../models/Room");
const { verifyToken } = require("../utils/token");

// Assign a unique color to each user
const USER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7B7A3",
  "#B4D7FF", "#C8B6FF",
];

let colorIndex = 0;
const getNextColor = () => USER_COLORS[colorIndex++ % USER_COLORS.length];

// Track active rooms in memory for fast access
const activeRooms = new Map(); // roomId -> { users: Map<socketId, userInfo> }

function initSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ─── JOIN ROOM ──────────────────────────────────────────────────────────
    socket.on("join-room", async ({ roomId, username, token, requestedRole }) => {
      try {
        let room = await Room.findOne({ roomId });
        if (!room) {
          return socket.emit("error", { message: "Room not found" });
        }

        const authUser = verifyToken(token);
        const displayName = authUser?.name || username || "Guest";
        socket.join(roomId);

        // Determine role: first user is host
        const isFirstUser =
          !activeRooms.has(roomId) ||
          activeRooms.get(roomId).users.size === 0;
        const validRole = ["participant", "viewer"].includes(requestedRole)
          ? requestedRole
          : "participant";
        const role = isFirstUser ? "host" : validRole;
        const color = getNextColor();

        const userInfo = {
          userId: authUser?.sub,
          socketId: socket.id,
          username: displayName,
          color,
          role,
          cursorPosition: { lineNumber: 1, column: 1 },
        };

        // Update in-memory state
        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, { users: new Map() });
        }
        activeRooms.get(roomId).users.set(socket.id, userInfo);

        // Persist to DB
        room.activeUsers = Array.from(activeRooms.get(roomId).users.values());
        room.lastActivity = new Date();
        await room.save();

        // Send current room state to the joining user
        socket.emit("room-joined", {
          roomId,
          code: room.code,
          language: room.language,
          users: Array.from(activeRooms.get(roomId).users.values()),
          userInfo,
          interviewMode: room.interviewMode,
          editingLocked: room.editingLocked,
          timerEnd: room.timerEnd,
          problem: room.problem,
        });

        // Notify others
        socket.to(roomId).emit("user-joined", {
          userInfo,
          users: Array.from(activeRooms.get(roomId).users.values()),
        });

        console.log(`${displayName} joined room ${roomId} as ${role}`);
      } catch (err) {
        console.error("join-room error:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // ─── CODE CHANGE ─────────────────────────────────────────────────────────
    // Broadcasts only the change delta (not the full document)
    socket.on("code-change", async ({ roomId, delta, fullCode }) => {
      try {
        const roomData = activeRooms.get(roomId);
        const user = roomData?.users.get(socket.id);
        const room = await Room.findOne({ roomId });
        if (!user || !room) return;
        if (user.role === "viewer" || (room.editingLocked && user.role !== "host")) {
          return socket.emit("editing-denied", { message: "Editing is locked for your role." });
        }

        // Broadcast delta to all OTHER users in the room
        socket.to(roomId).emit("code-update", { delta, senderId: socket.id });

        const operation =
          delta?.text && delta?.range && delta.range.startLineNumber === delta.range.endLineNumber && delta.range.startColumn === delta.range.endColumn
            ? "insert"
            : delta?.text
              ? "replace"
              : "delete";

        // Persist full code to DB (debounce on client side before emitting)
        room.code = fullCode;
        room.lastActivity = new Date();
        room.changeEvents.push({
          userId: user.userId,
          username: user.username,
          operation,
          range: delta?.range,
          text: delta?.text,
        });
        if (room.changeEvents.length > 500) {
          room.changeEvents = room.changeEvents.slice(-500);
        }
        await room.save();
      } catch (err) {
        console.error("code-change error:", err);
      }
    });

    // ─── CURSOR MOVE ──────────────────────────────────────────────────────────
    socket.on("cursor-move", ({ roomId, position }) => {
      const roomData = activeRooms.get(roomId);
      if (!roomData) return;

      const user = roomData.users.get(socket.id);
      if (!user) return;

      user.cursorPosition = position;

      socket.to(roomId).emit("cursor-update", {
        socketId: socket.id,
        username: user.username,
        color: user.color,
        position,
      });
    });

    // ─── SELECTION CHANGE ─────────────────────────────────────────────────────
    socket.on("selection-change", ({ roomId, selection }) => {
      const roomData = activeRooms.get(roomId);
      if (!roomData) return;
      const user = roomData.users.get(socket.id);
      if (!user) return;

      socket.to(roomId).emit("selection-update", {
        socketId: socket.id,
        username: user.username,
        color: user.color,
        selection,
      });
    });

    // ─── CHAT MESSAGE ─────────────────────────────────────────────────────────
    socket.on("chat-message", ({ roomId, message }) => {
      const roomData = activeRooms.get(roomId);
      if (!roomData) return;
      const user = roomData.users.get(socket.id);
      if (!user) return;

      const payload = {
        id: Date.now() + Math.random().toString(36).slice(2),
        username: user.username,
        color: user.color,
        message,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to everyone in the room (including sender)
      io.to(roomId).emit("chat-message", payload);
    });

    // ─── TYPING INDICATOR ─────────────────────────────────────────────────────
    socket.on("typing-start", ({ roomId }) => {
      const roomData = activeRooms.get(roomId);
      const user = roomData?.users.get(socket.id);
      if (!user) return;
      socket.to(roomId).emit("user-typing", { socketId: socket.id, username: user.username });
    });

    socket.on("typing-stop", ({ roomId }) => {
      socket.to(roomId).emit("user-stopped-typing", { socketId: socket.id });
    });

    // ─── LANGUAGE CHANGE ──────────────────────────────────────────────────────
    socket.on("language-change", async ({ roomId, language }) => {
      try {
        await Room.updateOne({ roomId }, { language });
        io.to(roomId).emit("language-updated", { language });
      } catch (err) {
        console.error("language-change error:", err);
      }
    });

    // ─── SAVE SNAPSHOT ────────────────────────────────────────────────────────
    socket.on("save-snapshot", async ({ roomId }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (!room) return;
        const roomData = activeRooms.get(roomId);
        const user = roomData?.users.get(socket.id);

        room.snapshots.push({
          code: room.code,
          language: room.language,
          savedBy: user?.username || "unknown",
        });
        // Keep max 20 snapshots
        if (room.snapshots.length > 20) room.snapshots.shift();
        await room.save();

        io.to(roomId).emit("snapshot-saved", {
          snapshot: room.snapshots[room.snapshots.length - 1],
        });
      } catch (err) {
        console.error("save-snapshot error:", err);
      }
    });

    // ─── INTERVIEW MODE ───────────────────────────────────────────────────────
    socket.on("toggle-interview-mode", async ({ roomId, enabled, timerMinutes }) => {
      try {
        const roomData = activeRooms.get(roomId);
        const user = roomData?.users.get(socket.id);
        if (user?.role !== "host") return;

        const timerEnd = enabled && timerMinutes
          ? new Date(Date.now() + timerMinutes * 60000)
          : null;

        await Room.updateOne({ roomId }, { interviewMode: enabled, timerEnd });
        io.to(roomId).emit("interview-mode-changed", { enabled, timerEnd });
      } catch (err) {
        console.error("toggle-interview-mode error:", err);
      }
    });

    socket.on("toggle-editing-lock", async ({ roomId, locked }) => {
      try {
        const roomData = activeRooms.get(roomId);
        const user = roomData?.users.get(socket.id);
        if (user?.role !== "host") return;

        await Room.updateOne({ roomId }, { editingLocked: locked });
        io.to(roomId).emit("editing-lock-changed", { locked });
      } catch (err) {
        console.error("toggle-editing-lock error:", err);
      }
    });

    socket.on("assign-problem", async ({ roomId, problem }) => {
      try {
        const roomData = activeRooms.get(roomId);
        const user = roomData?.users.get(socket.id);
        if (user?.role !== "host") return;

        const nextProblem = {
          title: String(problem?.title || "").slice(0, 120),
          prompt: String(problem?.prompt || "").slice(0, 4000),
        };
        await Room.updateOne({ roomId }, { problem: nextProblem, lastActivity: new Date() });
        io.to(roomId).emit("problem-assigned", { problem: nextProblem });
      } catch (err) {
        console.error("assign-problem error:", err);
      }
    });

    // ─── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      try {
        for (const [roomId, roomData] of activeRooms.entries()) {
          if (roomData.users.has(socket.id)) {
            const user = roomData.users.get(socket.id);
            roomData.users.delete(socket.id);

            if (roomData.users.size === 0) {
              activeRooms.delete(roomId);
            } else {
              // If host left, assign new host
              if (user.role === "host") {
                const newHost = roomData.users.values().next().value;
                newHost.role = "host";
                io.to(roomId).emit("host-changed", { socketId: newHost.socketId });
              }
            }

            await Room.updateOne(
              { roomId },
              {
                activeUsers: Array.from(roomData.users?.values() || []),
                lastActivity: new Date(),
              }
            );

            io.to(roomId).emit("user-left", {
              socketId: socket.id,
              username: user.username,
              users: Array.from(roomData.users?.values() || []),
            });

            console.log(`${user.username} left room ${roomId}`);
            break;
          }
        }
      } catch (err) {
        console.error("disconnect error:", err);
      }
    });
  });
}

module.exports = initSocketHandlers;

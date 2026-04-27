const mongoose = require("mongoose");

const SnapshotSchema = new mongoose.Schema({
  code: String,
  language: String,
  savedAt: { type: Date, default: Date.now },
  savedBy: String,
});

const ChangeEventSchema = new mongoose.Schema(
  {
    userId: String,
    username: String,
    operation: { type: String, enum: ["insert", "delete", "replace"], default: "replace" },
    range: Object,
    text: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema({
  userId: String,
  socketId: String,
  username: String,
  color: String,
  role: { type: String, enum: ["host", "participant", "viewer"], default: "participant" },
  joinedAt: { type: Date, default: Date.now },
  cursorPosition: {
    lineNumber: { type: Number, default: 1 },
    column: { type: Number, default: 1 },
  },
});

const RoomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    name: { type: String, default: "Untitled Room" },
    createdBy: String,
    code: { type: String, default: "// Start coding here...\n" },
    language: {
      type: String,
      enum: ["javascript", "python", "cpp"],
      default: "javascript",
    },
    activeUsers: [UserSchema],
    snapshots: [SnapshotSchema],
    changeEvents: [ChangeEventSchema],
    problem: {
      title: { type: String, default: "" },
      prompt: { type: String, default: "" },
    },
    interviewMode: { type: Boolean, default: false },
    editingLocked: { type: Boolean, default: false },
    timerEnd: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Auto-cleanup rooms inactive for 24h
RoomSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model("Room", RoomSchema);

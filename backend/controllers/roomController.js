const Room = require("../models/Room");
const { nanoid } = require("nanoid");

// POST /api/rooms/create
const createRoom = async (req, res) => {
  try {
    const { name, language = "javascript" } = req.body;
    const roomId = nanoid(8); // e.g. "V1StGXR8"

    const room = await Room.create({
      roomId,
      name: name || `Room ${roomId}`,
      language,
      createdBy: req.user?.sub,
    });

    res.status(201).json({ roomId: room.roomId, name: room.name });
  } catch (err) {
    console.error("createRoom error:", err);
    res.status(500).json({ message: "Failed to create room" });
  }
};

// GET /api/rooms/:roomId
const getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId }).select(
      "-__v"
    );
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/rooms/:roomId/snapshots
const getSnapshots = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId }).select(
      "snapshots"
    );
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room.snapshots.reverse()); // newest first
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/rooms/:roomId/restore
const restoreSnapshot = async (req, res) => {
  try {
    const { snapshotId } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });

    const snapshot = room.snapshots.id(snapshotId);
    if (!snapshot) return res.status(404).json({ message: "Snapshot not found" });

    room.code = snapshot.code;
    room.language = snapshot.language;
    await room.save();

    res.json({ code: room.code, language: room.language });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createRoom, getRoom, getSnapshots, restoreSnapshot };

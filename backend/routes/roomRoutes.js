const express = require("express");
const router = express.Router();
const {
  createRoom,
  getRoom,
  getSnapshots,
  restoreSnapshot,
} = require("../controllers/roomController");
const { optionalAuth, requireAuth } = require("../middleware/auth");

router.post("/create", requireAuth, createRoom);
router.get("/:roomId", getRoom);
router.get("/:roomId/snapshots", getSnapshots);
router.post("/:roomId/restore", optionalAuth, restoreSnapshot);

module.exports = router;

const express = require("express");
const router = express.Router();
const { executeCode } = require("../controllers/executeController");
const { requireAuth } = require("../middleware/auth");

router.post("/", requireAuth, executeCode);

module.exports = router;

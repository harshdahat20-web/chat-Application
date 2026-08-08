const express = require("express");
const {
  sendMessage,
  getMessage,
} = require("../controllers/message.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, sendMessage);
router.get("/:conversationId", authMiddleware, getMessage);

module.exports = router;

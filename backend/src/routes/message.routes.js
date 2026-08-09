const express = require("express");
const {
  sendMessage,
  getMessage,
  deleteMessage,
} = require("../controllers/message.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, sendMessage);
router.get("/:conversationId", authMiddleware, getMessage);
router.delete("/:messageId", authMiddleware, deleteMessage);

module.exports = router;

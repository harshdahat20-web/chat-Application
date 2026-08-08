const express = require("express");
const {
  createConversation,
  getUserConversations,
} = require("../controllers/conversation.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, createConversation);
router.get("/", authMiddleware, getUserConversations);

module.exports = router;

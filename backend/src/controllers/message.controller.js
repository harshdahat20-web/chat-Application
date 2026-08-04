const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");

const sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    if (!conversationId || !text) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID and text are required",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }
    if (
      !conversation.participants.some(
        (participant) => participant.toString() === req.user.id,
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to send messages in this conversation",
      });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      text,
    });
    await message.populate("sender", "name profilePic");
    
    conversation.lastMessage = message._id;
    await conversation.save();

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { sendMessage };

const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");
const { getIO, getReceiverSocketId } = require("../socket/socket");

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

    const io = getIO();

    const receiverId = conversation.participants.find(
      (participant) => participant.toString() !== req.user.id,
    );

    const receiverSocketId = getReceiverSocketId(receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }
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

const getMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required",
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
        message: "You are not allowed to access this conversation",
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
    })
      .populate("sender", "name profilePic")
      .sort({
        createdAt: 1,
      });

    return res.status(200).json({
      success: true,
      message: "Messages fetched successfully",
      data: messages,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { sendMessage, getMessage };

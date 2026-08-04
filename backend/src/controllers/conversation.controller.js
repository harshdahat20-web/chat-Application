const Conversation = require("../models/conversation.model");
const User = require("../models/user.model");

const createConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver Id is required",
      });
    }
    if (receiverId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot create a conversation with yourself",
      });
    }
    let conversation = await Conversation.findOne({
      participants: {
        $all: [req.user.id, receiverId],
      },
      type: "direct",
    });
    if (conversation) {
      return res.status(200).json({
        success: true,
        message: "Conversation already exists",
        data: conversation,
      });
    }
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    conversation = await Conversation.create({
      participants: [req.user.id, receiverId],
    });
    return res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: conversation,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getUserConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate("participants", "name email profilePic isOnline")
      .populate("lastMessage")
      .sort({
        updatedAt: -1,
      });

    return res.status(200).json({
      success: true,
      message: "Conversations fetched successfully",
      data: conversations,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { createConversation, getUserConversations };

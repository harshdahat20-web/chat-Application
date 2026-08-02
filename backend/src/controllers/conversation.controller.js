const Conversation = require("../models/conversation.model");

const createConversation = async (req, res) => {
  try {
    const { receviedId } = req.body;

    if (!receviedId) {
      return res.status(400).json({
        success: false,
        message: "Recevied Id is required",
      });
    }
    let conversation = await Conversation.findOne({
      participants: {
        $all: [req.user.id, receviedId],
      },
      type: "direct",
    });
    if (conversation) {
      return res.status(200).json({
        success: true,
        message: "Conversation already exist",
        data: conversation,
      });
    }
    conversation = await Conversation.create({
      participants: [req.user.id, receviedId],
    });
    return res.status(201).json({
      success: true,
      message: "Conversation create",
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

module.exports = { createConversation };

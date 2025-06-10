import express from "express";
import Message from "../models/Message.js";
import {protectRoute} from "../middleware/auth.middleware.js";
import { translateText } from "../services/gemini.js";

const router = express.Router();

// GET /api/chat/:conversationId
router.get("/:conversationId", protectRoute, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/chat/message
router.post("/message", protectRoute, async (req, res) => {
  try {
    const { conversationId, text, receiverId } = req.body;
    const senderId = req.user._id;

    const newMessage = new Message({
      conversationId,
      senderId,
      text,
      receiverId, // 👈 add this in your schema and model too if not already
    });

    const savedMessage = await newMessage.save();

    res.status(201).json(savedMessage); // make sure this has all required fields
  } catch (err) {
    console.error("Error saving message:", err.message);
    res.status(500).json({ message: "Failed to send message" });
  }
});

router.post("/translate", protectRoute, async (req, res) => {
  try {
    const { text } = req.body;

    // Here you would integrate with your translation service
    // For example, using Google Translate API or any other service
    // This is a placeholder response
    // const translatedText = `Translated : ${text}`;
    const translatedText = await translateText(text, "English");
    // console.log("Translated text:", translatedText);
    res.json({ translatedText });
  } catch (err) {
    console.error("Error translating text:", err.message);
    res.status(500).json({ message: "Translation failed" });
  }
});

export default router;

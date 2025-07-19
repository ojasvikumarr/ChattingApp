import express from "express";
import Message from "../models/Message.js";
import {protectRoute} from "../middleware/auth.middleware.js";
import { translateText } from "../services/gemini.js";

const router = express.Router();


router.get("/:conversationId", protectRoute, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("error fetching messages:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/message", protectRoute, async (req, res) => {
  try {
    const { conversationId, text, receiverId } = req.body;
    const senderId = req.user._id;

    const newMessage = new Message({
      conversationId,
      senderId,
      text,
      receiverId, 
    });

    const savedMessage = await newMessage.save();

    res.status(201).json(savedMessage); 
  } catch (err) {
    console.error("error saving message:", err.message);
    res.status(500).json({ message: "failed to send message" });
  }
});

router.post("/translate", protectRoute, async (req, res) => {
  try {
    const { text } = req.body;
    const translatedText = await translateText(text, "English");

    res.json({ translatedText });
  } catch (err) {
    console.error("error translating text:", err.message);
    res.status(500).json({ message: "Translation failed" });
  }
});

export default router;

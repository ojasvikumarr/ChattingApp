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
    console.error("Error fetching messages:", err.message);
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
    console.error("Error saving message:", err.message);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// router.post("/translate", protectRoute, async (req, res) => {
//   try {
//     const { text } = req.body;
//     const translatedText = await translateText(text, "English");

//     res.json({ translatedText });
//   } catch (err) {
//     console.error("Error translating text:", err.message);
//     res.status(500).json({ message: "Translation failed" });
//   }
// });
// POST /api/chat/translate
router.post("/translate", async (req, res) => {
  try {
    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ message: "Text and target language are required." });
    }

    const translatedText = await translateText(text, targetLang);

    return res.status(200).json({ translatedText });
  } catch (error) {
    console.error("Translation error:", error.message);
    return res.status(500).json({ message: "Failed to translate text." });
  }
});


export default router;

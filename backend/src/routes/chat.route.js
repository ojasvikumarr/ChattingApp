import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getStreamToken,
  createOrGetConversation,
  getMessages,
  sendMessage,
} from "../controllers/chat.controller.js";

const router = express.Router();

// 🎥 Video call token
router.get("/token", protectRoute, getStreamToken);

// 💬 Chat routes
router.post("/conversation", protectRoute, createOrGetConversation);
router.get("/messages/:conversationId", protectRoute, getMessages);
router.post("/message", protectRoute, sendMessage);

export default router;


import express from "express";
import User from "../models/User.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/:id", protectRoute, async (req, res) => {
  try {
    const { id: friendId } = req.params;
    const friend = await User.findById(friendId)
      .select("fullName profilePic bio nativeLanguage learningLanguage location");

    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    res.json(friend);
  } catch (err) {
    console.error("error fetching friend profile:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;


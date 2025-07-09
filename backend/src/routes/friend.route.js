// // routes/friendRoutes.js
// import express from 'express';
// import asyncHandler from 'express-async-handler';
// import User from '../models/userModel.js';

// const router = express.Router();

// // GET /api/friends/:id — get friend's public profile
// router.get('/:id', asyncHandler(async (req, res) => {
//   const friend = await User.findById(req.params.id).select('fullName profilePic');
//   if (!friend) {
//     res.status(404);
//     throw new Error('Friend not found');
//   }
//   res.json(friend);
// }));

// export default router;

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
    console.error("Error fetching friend profile:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;


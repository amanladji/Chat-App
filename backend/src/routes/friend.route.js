import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  getPendingRequests,
  searchUsers,
  removeFriend,
} from "../controllers/friend.controller.js";

const router = express.Router();

// Send friend request
router.post("/request", protectRoute, sendFriendRequest);

// Accept friend request
router.put("/accept/:requestId", protectRoute, acceptFriendRequest);

// Decline friend request
router.put("/decline/:requestId", protectRoute, declineFriendRequest);

// Get friend list
router.get("/", protectRoute, getFriends);
router.get("/list", protectRoute, getFriends);

// Get pending friend requests
router.get("/pending", protectRoute, getPendingRequests);

// Search users to add as friends
router.get("/search", protectRoute, searchUsers);

// Remove friend
router.delete("/remove/:friendId", protectRoute, removeFriend);

export default router;

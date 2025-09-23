
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  getSentimentStats, // Import the new function
  deleteMessage, // Import the delete function
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);

// --- NEW ROUTE FOR STATS ---
router.get("/stats/:id", protectRoute, getSentimentStats);

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.delete("/:messageId", protectRoute, deleteMessage);

export default router;
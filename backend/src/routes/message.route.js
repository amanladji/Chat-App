import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  getSentimentStats, // Import the new function
  deleteMessage, // Import the delete function
  deleteMessages, // Import the bulk delete function
  getMentalHealthSettings, // Import mental health endpoints
  updateMentalHealthSettings,
  getMentalHealthStats,
  resetMentalHealthCooldown,
  testMentalHealthCompanion, // Import test companion endpoint
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);

// --- NEW ROUTE FOR STATS ---
router.get("/stats/:id", protectRoute, getSentimentStats);

// --- MENTAL HEALTH COMPANION ROUTES ---
router.get("/mental-health/settings", protectRoute, getMentalHealthSettings);
router.put("/mental-health/settings", protectRoute, updateMentalHealthSettings);
router.get("/mental-health/stats", protectRoute, getMentalHealthStats);
router.post(
  "/mental-health/reset-cooldown",
  protectRoute,
  resetMentalHealthCooldown
);
router.post(
  "/mental-health/test-companion",
  protectRoute,
  testMentalHealthCompanion
);

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.delete("/bulk", protectRoute, deleteMessages);
router.delete("/:messageId", protectRoute, deleteMessage);

export default router;

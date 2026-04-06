import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import fs from "fs";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import friendRoutes from "./routes/friend.route.js";

import { app, server } from "./lib/socket.js";

dotenv.config();

const __dirname = path.resolve();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : "http://localhost:5173",
    credentials: true,
  })
);

// --- START OF CHANGES ---
// Increase the limit to allow for larger image payloads (e.g., 10mb)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// --- END OF CHANGES ---

app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friends", friendRoutes);

if (process.env.NODE_ENV === "production") {
  // On Render, the backend is in a subdirectory, so we need to go up to find frontend
  const frontendPath = path.join(__dirname, "..", "frontend", "dist");

  // Check if the frontend build exists
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(frontendPath, "index.html"));
    });
  } else {
    console.warn("Frontend build not found at:", frontendPath);
    app.get("*", (req, res) => {
      res.status(404).json({ error: "Frontend build not found" });
    });
  }
}

const startServer = async () => {
  try {
    await connectDB();

    const port = process.env.PORT || 5001;
    server.listen(port, () => {
      console.log(`server is running on PORT:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

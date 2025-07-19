import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";

import { fileURLToPath } from "url";
import http from "http";
import { setupSocket } from "./lib/socket.js"; 

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";

import { connectDB } from "./lib/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app); 
const PORT = process.env.PORT || 8000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL, 
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);


if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend", "dist", "index.html"));
  });
}


server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  connectDB();
  setupSocket(server); 
});

// server/index.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let io; // keep socket.io reference

export function startServer() {
  const app = express();
  const server = http.createServer(app);
  io = new Server(server);

  // Serve static KOT page
  app.use("/kot", (req,res) =>{
    res.send("server running....")
  });

  io.on("connection", (socket) => {
    console.log("✅ Kitchen display connected");
  });

  server.listen(3000, () => {
    console.log("🚀 KOT server running at http://localhost:3000/kot");
  });
}

export function broadcastOrder(order) {
  if (io) {
    io.emit("new-order", order);
  }
}

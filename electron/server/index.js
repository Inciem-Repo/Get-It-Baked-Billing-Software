// server/index.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let io; // keep socket.io reference

// Helper to get local IP address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

export function startServer() {
  const app = express();
  const server = http.createServer(app);
  io = new Server(server, {
    cors: {
      origin: "*", // allow access from other devices
    },
  });

  // Serve static KOT page (simple response)
  app.use("/kot", (req, res) => {
    res.send("✅ KOT server running...");
  });

  io.on("connection", (socket) => {
    console.log("✅ Kitchen display connected");
  });

  const PORT = 3000;
  const HOST = "0.0.0.0"; 
  const localIp = getLocalIp();

  server.listen(PORT, HOST, () => {
    console.log(
      `🚀 KOT server running locally at: http://localhost:${PORT}/kot`
    );
    console.log(`🌐 Accessible on network at: http://${localIp}:${PORT}/kot`);
  });
}

export function broadcastOrder(order) {
  if (io) {
    io.emit("new-order", order);
  }
}

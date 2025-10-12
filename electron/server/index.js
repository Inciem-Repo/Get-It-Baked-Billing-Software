import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import db from "../db/dbSetup.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let io;

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "localhost";
}

// Example data fetch function
function getLastKots(limit = 10, branchId = 1) {
  const kotOrders = db
    .prepare(
      `SELECT * FROM kot_orders WHERE branchId = ? ORDER BY id DESC LIMIT ?`
    )
    .all(branchId, limit);
  return kotOrders;
}

export function startServer(branchId = 1) {
  const app = express();
  const server = http.createServer(app);
  io = new Server(server, { cors: { origin: "*" } });

  // Set EJS as view engine
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  // Serve static files (CSS, JS, images)
 app.use(express.static(path.join(__dirname, "../../public")));

  // Kitchen View
  app.get("/kot", (req, res) => {
    const kots = getLastKots(10, branchId);
    res.render("kot", { kots });
  });

  io.on("connection", (socket) => {
    console.log("✅ Kitchen display connected");
  });

  const PORT = 3000;
  const HOST = "0.0.0.0";
  const localIp = getLocalIp();

  server.listen(PORT, HOST, () => {
    console.log(`🚀 KOT View: http://localhost:${PORT}/kot`);
    console.log(`🌐 Network: http://${localIp}:${PORT}/kot`);
  });
}

export function broadcastOrder(order) {
  if (io) io.emit("new-order", order);
}

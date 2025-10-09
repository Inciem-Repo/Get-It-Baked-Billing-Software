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

// Fetch last N KOT orders
function getLastKots(limit = 10, branchId = 1) {
  const kotOrders = db
    .prepare(
      `SELECT ko.*, c.name AS customerName, c.mobile AS customerMobile
       FROM kot_orders ko
       LEFT JOIN customers c ON c.id = ko.customerId
       WHERE ko.branchId = ? AND ko.isDeleted = 0
       ORDER BY ko.id DESC
       LIMIT ?`
    )
    .all(branchId, limit);

  const kotItemsStmt = db.prepare(
    `SELECT ki.*, p.title AS productName
     FROM kot_items ki
     LEFT JOIN products p ON p.id = ki.productId
     WHERE ki.kotOrderId = ? AND ki.isDeleted = 0`
  );

  return kotOrders.map((kot) => ({
    ...kot,
    items: kotItemsStmt.all(kot.kotToken),
  }));
}

export function startServer(branchId = 1) {
  const app = express();
  const server = http.createServer(app);
  io = new Server(server, {
    cors: { origin: "*" },
  });

  // Serve static KOT page
  app.get("/kot", (req, res) => {
    const kots = getLastKots(10, branchId);

    let html = `
      <html>
        <head>
          <title>Kitchen Display</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .kot { border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; }
            .kot h3 { margin: 0; }
            .item { margin-left: 15px; }
          </style>
        </head>
        <body>
          <h1>Kitchen Orders</h1>
          ${kots
            .map(
              (kot) => `
            <div class="kot">
              <h3>KOT: ${kot.kotToken} - ${kot.customerName || "Walk-in"}</h3>
              <div>Status: ${kot.status}</div>
              <div>Items:</div>
              <ul>
                ${kot.items
                  .map(
                    (item) =>
                      `<li class="item">${item.productName} x ${item.quantity}</li>`
                  )
                  .join("")}
              </ul>
            </div>
          `
            )
            .join("")}
          <script src="/socket.io/socket.io.js"></script>
          <script>
            const socket = io();
            socket.on("new-order", (order) => {
              alert("New KOT: " + order.kotToken);
              location.reload(); // reload to show new order
            });
          </script>
        </body>
      </html>
    `;
    res.send(html);
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
  if (io) io.emit("new-order", order);
}

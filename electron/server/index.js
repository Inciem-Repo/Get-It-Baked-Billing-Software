import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import fs from "fs";
import {
  getKotConfig,
  getKotOrdersByBranch,
  insertKotConfig,
  updateKOTStatusService,
} from "../service/KOTService.js";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "localhost";
}

export function startServer() {
  const app = express();
  app.use(cors({ origin: "*" }));
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  app.use(express.json());

  let publicPath = path.join(__dirname, "../../public");
  if (!fs.existsSync(publicPath)) {
    publicPath = path.join(process.resourcesPath, "public");
  }

  app.use(express.static(publicPath));
  app.use("/css", express.static(path.join(publicPath, "css")));
  app.use("/js", express.static(path.join(publicPath, "js")));
  app.use("/audio", express.static(path.join(publicPath, "audio")));

  app.get("/", (req, res) => {
    res.send(`Server running. Public path: ${publicPath}`);
  });
  app.get("/kot", async (req, res) => {
    res.render("kot");
  });
  app.get("/api/kots", async (req, res) => {
    try {
      const kots = await getKotOrdersByBranch();
      res.json(kots);
    } catch (error) {
      console.log(error);
    }
  });
  app.put("/api/kots/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    await updateKOTStatusService(id, status);
    try {
      res.json({ success: true, message: "Status updated successfully" });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: "Failed to update status" });
    }
  });
  app.get("/api/kots/config", async (req, res) => {
    try {
      const result = await getKotConfig();
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  async function setupDefaultKotConfig(localIp, port) {
    const defaultData = {
      branch_id: 1,
      kot_monitor_url: `http://${localIp}:${port}/kot`,
      reminder_time_minutes: 30,
      sound_file: "alarm_1",
      enable_sound: 1,
    };

    try {
      await insertKotConfig(defaultData);
      console.log("KOT configuration setup completed.");
    } catch (err) {
      console.error("Error setting up default KOT config:", err);
    }
  }

  const PORT = 3000;
  const HOST = "0.0.0.0";
  const localIp = getLocalIp();

  app.listen(PORT, HOST, async () => {
    await setupDefaultKotConfig(localIp, PORT);
    console.log(`KOT View: http://localhost:${PORT}/kot`);
    console.log(`Network: http://${localIp}:${PORT}/kot`);
  });
}

import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import "./ipcHandlers.js";
import { syncTable } from "./service/syncService.js";
import { initAutoUpdater } from "./service/updateService.js";
import { startServer } from "./server/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
    },
    icon: path.join(
      app.isPackaged ? process.resourcesPath : __dirname,
      "public",
      "baked-logo.ico"
    ),
  });

  const startUrl =
    process.env.ELECTRON_START_URL ||
    `file://${path.join(__dirname, "../dist/index.html")}`;

  mainWindow.loadURL(startUrl);
  mainWindow.once("ready-to-show", () => {
    initAutoUpdater(mainWindow);
  });
}

app.whenReady().then(async () => {
  createWindow();
  try {
    await syncTable("category");
    await syncTable("products");
    await syncTable("customers");
    await syncTable("expensecategory");
    startServer();
  } catch (error) {
    console.log(error);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
ipcMain.handle("get_app_version", () => {
  return app.getVersion();
});

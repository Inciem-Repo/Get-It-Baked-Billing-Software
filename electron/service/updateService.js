// service/updateService.js
import pkg from "electron-updater";
const { autoUpdater } = pkg;
import { ipcMain } from "electron";

let mainWindow = null;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

export function initAutoUpdater(window) {
  mainWindow = window;
  autoUpdater.checkForUpdatesAndNotify();

  // --- manual trigger from renderer
  ipcMain.on("check_for_update", () => {
    autoUpdater.checkForUpdates();
  });

  // --- events
  autoUpdater.on("checking-for-update", () => {
    mainWindow?.webContents.send("update_checking");
  });

  autoUpdater.on("update-available", (info) => {
    mainWindow?.webContents.send("update_available", info);
  });

  autoUpdater.on("update-not-available", (info) => {
    mainWindow?.webContents.send("update_not_available", info);
  });

  autoUpdater.on("error", (err) => {
    mainWindow?.webContents.send("update_error", err.message || err);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    mainWindow?.webContents.send("download_progress", {
      percent: progressObj.percent.toFixed(1),
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    mainWindow?.webContents.send("update_downloaded", info);
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 3000);
  });

  ipcMain.on("restart_app", () => {
    autoUpdater.quitAndInstall();
  });
}

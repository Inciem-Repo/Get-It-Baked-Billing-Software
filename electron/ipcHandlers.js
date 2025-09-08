import { ipcMain, BrowserWindow } from "electron";
import { loginUser } from "./service/authService.js";
import {
  clearUser,
  getCustomers,
  getUser,
  searchCustomers,
} from "./service/userService.js";
import { getProductsDetails } from "./service/produtsService.js";
import { addBilling, getBillingDetails } from "./service/billingService.js";
import pkg from "electron-pos-printer";
import path from "path";
import { fileURLToPath } from "url";
import { generateBillHTML } from "./lib/printPreview.js";
import { promises as fs } from "fs";
import os from "os";

const { PosPrinter } = pkg;
let previewWindow;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ipcMain.handle("login-user", async (event, { username, password }) => {
  return await loginUser(username, password);
});
ipcMain.handle("get-user", async () => getUser());
ipcMain.handle("clear-user", async () => clearUser());
ipcMain.handle("get-products", async () => getProductsDetails());
ipcMain.handle("get-customers", async () => getCustomers());
ipcMain.handle("search-customers", async (event, searchTerm = "") => {
  return searchCustomers(searchTerm);
});
ipcMain.handle("get-billing-details", async (event, args = {}) => {
  const { page = 1, limit = 10, filters = {} } = args;
  return getBillingDetails(page, limit, filters);
});

ipcMain.handle("add-billing", async (event, billData) => {
  try {
    const billId = addBilling(billData);
    const savedBill = { ...billData, id: billId };
    return { success: true, bill: savedBill };
  } catch (err) {
    console.error("Error inserting billing:", err);
    return { success: false, error: err.message };
  }
});

// ipcMain.handle("open-print-preview", async (event, billData) => {
//   const previewWindow = new BrowserWindow({
//     width: 450,
//     height: 700,
//     modal: true,
//     parent: BrowserWindow.getFocusedWindow(),
//     webPreferences: {
//       contextIsolation: false,
//       nodeIntegration: true,
//     },
//   });

//   const html = generateBillHTML(billData);
//   previewWindow.loadURL(
//     "data:text/html;charset=utf-8," + encodeURIComponent(html)
//   );
// });

// let previewWindow;

ipcMain.handle("open-print-preview", async (event, billData) => {
  previewWindow = new BrowserWindow({
    width: 450,
    height: 700,
    modal: true,
    parent: BrowserWindow.getFocusedWindow(),
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  const html = generateBillHTML(billData);
  previewWindow.loadURL(
    "data:text/html;charset=utf-8," + encodeURIComponent(html)
  );
});

ipcMain.handle("print-bill", () => {
  if (previewWindow && !previewWindow.isDestroyed()) {
    previewWindow.webContents.print(
      { silent: false, printBackground: true },
      (success, failureReason) => {
        if (!success) console.error("Print failed:", failureReason);
        previewWindow.close();
        previewWindow = null;
      }
    );
  }
});

// ipcMain.handle("print-bill", async (event, billData) => {
//   const billHTML = generateBillHTML(billData);

//   const printWindow = new BrowserWindow({
//     width: 400,
//     height: 600,
//     show: true,
//   });

//   // Load HTML directly
//   printWindow.loadURL(
//     "data:text/html;charset=utf-8," + encodeURIComponent(billHTML)
//   );

//   printWindow.webContents.on("did-finish-load", () => {
//     printWindow.webContents.print(
//       { silent: false, printBackground: true },
//       (success, failureReason) => {
//         if (!success) console.error("Print failed:", failureReason);
//         printWindow.close();
//       }
//     );
//   });
// });

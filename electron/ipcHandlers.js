import { ipcMain, BrowserWindow } from "electron";
import { loginUser } from "./service/authService.js";
import {
  addCustomer,
  clearUser,
  getCustomers,
  getUser,
  searchCustomers,
} from "./service/userService.js";
import { getProductsDetails } from "./service/produtsService.js";
import {
  addBilling,
  generateInvoiceNo,
  getAllBillHistory,
  getBillingById,
  getBillingDetails,
} from "./service/billingService.js";
import pkg from "electron-pos-printer";
import path from "path";
import { fileURLToPath } from "url";
import { generateBillHTML } from "./lib/printPreview.js";
import { promises as fs } from "fs";
import os from "os";
import { mapBillForPrint, openPrintPreview } from "./lib/helper.js";
import { runSync } from "./service/syncService.js";

const { PosPrinter } = pkg;

let previewWindow;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ipcMain.handle("login-user", async (event, { username, password }) => {
  return await loginUser(username, password);
});
ipcMain.handle("get-user", async () => getUser());
ipcMain.handle("clear-user", async () => clearUser());
ipcMain.handle("generate-invoice-no", async (event, branchId) => {
  try {
    const invoiceNo = generateInvoiceNo(branchId);
    return { success: true, invoiceNo };
  } catch (error) {
    console.error("Invoice generation failed:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("get-products", async () => getProductsDetails());
ipcMain.handle("get-customers", async () => getCustomers());
ipcMain.handle("add-customer", async (event, customer) => {
  return addCustomer(customer);
});
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

ipcMain.handle("open-print-preview", async (event, billData) => {
  if (previewWindow && !previewWindow.isDestroyed()) {
    previewWindow.close();
  }

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

  previewWindow.on("closed", () => {
    previewWindow = null;
  });

  return true;
});

ipcMain.handle("print-bill", async () => {
  console.log("print bill invoke");

  if (previewWindow && !previewWindow.isDestroyed()) {
    const printers = await previewWindow.webContents.getPrintersAsync();
    console.log("Available printers:", printers);
    // Pick first printer OR match by name
    const defaultPrinter = printers.find((p) => p.isDefault) || printers[0];
    console.log("Using printer:", defaultPrinter?.name);

    return new Promise((resolve, reject) => {
      previewWindow.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: defaultPrinter?.name,
        },
        (success, failureReason) => {
          if (!success) {
            reject(new Error(failureReason));
          } else {
            resolve(true);
          }
        }
      );
    });
  } else {
    console.error("Preview window not available");
    return false;
  }
});

ipcMain.handle("print-invoice-by-id", async (event, { billId, branchInfo }) => {
  const bill = getBillingById(billId);
  const billData = mapBillForPrint(bill, branchInfo);
  if (!bill) {
    console.error("No bill found for ID:", billId);
    return;
  }
  if (previewWindow && !previewWindow.isDestroyed()) {
    previewWindow.close();
  }

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

  previewWindow.on("closed", () => {
    previewWindow = null;
  });

  return true;
});

ipcMain.handle("get-all-bill-history", (event, conditions) => {
  return getAllBillHistory(conditions);
});

ipcMain.handle("run-sync", async (event) => {
  try {
    event.sender.send("sync-status", {
      status: "loading",
      message: "Syncing...",
    });

    const syncedRows = await runSync();

    event.sender.send("sync-status", {
      status: "success",
      message: `Synced rows`,
    });
    return { syncedRows };
  } catch (err) {
    event.sender.send("sync-status", {
      status: "error",
      message: err.message || "Sync failed",
    });
    throw err;
  }
});

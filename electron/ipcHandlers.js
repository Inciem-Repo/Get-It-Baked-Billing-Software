import { ipcMain, BrowserWindow } from "electron";
import { loginUser } from "./service/authService.js";
import { clearUser, getCustomers, getUser, searchCustomers } from "./service/userService.js";
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
    return { success: true, billId };
  } catch (err) {
    console.error("Error inserting billing:", err);
    return { success: false, error: err.message };
  }
});

const dummyBill = {
  shopName: "BAKED",
  address:
    "Changampuzha park Metro station, Devankulangara, Mamangalam, Edappally, Eranakulam, Kerala, Pin:682024",
  date: "03 Sep, 2025 10:58 AM",
  invoice: "INVC14-01838",
  customer: "Walking Customer",
  gstNo: "32CQWPP4392J1Z2",
  items: [
    { name: "Candle @ 10", qty: 8, price: 8.48, taxPercent: 18 },
    { name: "Chocolate Cake", qty: 1, price: 250.0, taxPercent: 12 },
  ],
  totals: {
    taxableValue: 267.8,
    totalCGST: 15.0,
    totalSGST: 15.0,
    grandTotal: 297.8,
    netTotal: 297.8,
  },
};

ipcMain.handle("open-print-preview", async (event, billData) => {
  const previewWindow = new BrowserWindow({
    width: 450,
    height: 700,
    modal: true,
    parent: BrowserWindow.getFocusedWindow(),
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  const html = generateBillHTML(dummyBill);
  previewWindow.loadURL(
    "data:text/html;charset=utf-8," + encodeURIComponent(html)
  );
});

ipcMain.handle("print-bill", async (event, billData) => {
  let tempFilePath;
  try {
    const billHTML = generateBillHTML(dummyBill);
    tempFilePath = path.join(os.tmpdir(), `bill-${Date.now()}.html`);
    await fs.writeFile(tempFilePath, billHTML, "utf8");
    await PosPrinter.print(billData, {
      preview: false,
      width: "80mm",
      printerName: "",
      silent: true,
      pathTemplate: tempFilePath,
    });

    return true;
  } catch (err) {
    console.error("❌ Print error:", err);
    throw err;
  } finally {
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupErr) {
        console.error("Failed to clean up temp file:", cleanupErr);
      }
    }
  }
});

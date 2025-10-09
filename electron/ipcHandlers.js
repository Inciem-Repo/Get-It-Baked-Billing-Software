import { ipcMain, BrowserWindow } from "electron";
import { loginUser } from "./service/authService.js";
import {
  addCustomer,
  clearUser,
  getCustomerById,
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
  getBillingSummary,
  getPerformanceSummary,
} from "./service/billingService.js";
import pkg from "electron-pos-printer";
import path from "path";
import { fileURLToPath } from "url";
import { generateBillHTML } from "./lib/printPreview.js";
import { mapBillForPrint } from "./lib/helper.js";
import { runSync } from "./service/syncService.js";
import store from "electron-store";
import {
  addExpense,
  getExpenseCategories,
  getExpenseDetails,
  getExpenseSummary,
} from "./service/reportService.js";
import {
  addKot,
  generateKotToken,
  getKotByToken,
  getKotOrdersByBranch,
  getLastKotsByBranch,
  updateKotInvoiceByToken,
  updateKOTStatusService,
} from "./service/KOTService.js";

const settings = new store();

let previewWindow;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ipcMain.handle("login-user", async (event, { username, password }) => {
  return await loginUser(username, password);
});
ipcMain.handle("get-user", async () => getUser());

ipcMain.handle("clear-user", async () => clearUser());

ipcMain.handle("generate-invoice-no", async (event, branchId, paymentType) => {
  try {
    const invoiceNo = generateInvoiceNo(branchId, paymentType);
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

ipcMain.handle("get-customer-by-id", async (event, id) => {
  const customer = getCustomerById(id);
  if (customer) {
    return { success: true, customer };
  }
  return { success: false, error: "Customer not found" };
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
    const billId = await addBilling(billData);
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
    width: 350,
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

ipcMain.handle("get-printers", async (event) => {
  const printers = await event.sender.getPrintersAsync();
  return printers;
});

ipcMain.handle("get-saved-printer", () => {
  return settings.get("printer") || null;
});

ipcMain.handle("save-printer", (event, printerName) => {
  console.log("Saving printer:", printerName);
  settings.set("printer", printerName);
  return true;
});

ipcMain.handle("print-bill", async () => {
  if (!previewWindow || previewWindow.isDestroyed()) {
    console.error("Preview window not available");
    return false;
  }

  const printers = await previewWindow.webContents.getPrintersAsync();
  const savedPrinter = settings.get("printer");
  const printerToUse =
    printers.find((p) => p.name === savedPrinter) ||
    printers.find((p) => p.isDefault) ||
    printers[0];
  console.log("Using printer:", printerToUse?.name);

  return new Promise((resolve, reject) => {
    previewWindow.webContents.print(
      {
        silent: true,
        printBackground: true,
        deviceName: printerToUse?.name,
        margins: { marginType: "none" },
        scaleFactor: 100,
      },
      (success, failureReason) => {
        if (!success) {
          console.error("Print failed:", failureReason);
          reject(new Error(failureReason));
        } else {
          console.log("Thermal print success");
          resolve(true);
        }
      }
    );
  });
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
    width: 350,
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
ipcMain.handle("billing-getSummary", async (event) => {
  try {
    const result = await getBillingSummary();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});
ipcMain.handle(
  "get-performance-summary",
  async (event, { fromDate, toDate }) => {
    try {
      const summary = await getPerformanceSummary(fromDate, toDate);
      return summary;
    } catch (error) {
      console.error("IPC get-performance-summary error:", error);
      return [];
    }
  }
);

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

ipcMain.handle("expense-add", async (event, expenseData) => {
  try {
    const newExpense = addExpense(expenseData);
    return { success: true, data: newExpense };
  } catch (err) {
    console.error("Failed to add expense:", err);
    return { success: false, message: "Failed to add expense" };
  }
});

ipcMain.handle("expense-get-all", (event, conditions) => {
  const { page = 1, limit = 10, ...filters } = conditions;
  return getExpenseDetails(page, limit, filters);
});

ipcMain.handle("get-expense-categories", async () => {
  try {
    return getExpenseCategories();
  } catch (err) {
    console.error("Error fetching categories:", err);
    return [];
  }
});
ipcMain.handle("expense-getSummary", async () => {
  try {
    const result = await getExpenseSummary();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

//KOT
ipcMain.handle("kot-add", async (event, kotData) => {
  try {
    const result = addKot(kotData);
    return { success: true, data: result };
  } catch (err) {
    console.error("Failed to add KOT:", err);
    return { success: false, message: err.message };
  }
});
ipcMain.handle("kot-generate-token", async (event) => {
  try {
    const token = generateKotToken();
    return token;
  } catch (err) {
    console.error("Failed to generate KOT token:", err);
    return null;
  }
});
ipcMain.handle("kot-getBy-Branch", async (event) => {
  return await getKotOrdersByBranch();
});
ipcMain.handle("update-kot-status", async (event, { kotId, status }) => {
  try {
    const result = await updateKOTStatusService(kotId, status);
    return { success: true, result };
  } catch (error) {
    console.error("Error updating KOT status:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("get-kot-by-token", async (event, kotToken) => {
  try {
    const kotData = await getKotByToken(kotToken);
    return { success: true, data: kotData };
  } catch (error) {
    console.error("IPC get-kot-by-token error:", error);
    return { success: false, message: error.message };
  }
});
ipcMain.handle("updateKOTInvoiceByToken", async (event, data) => {
  try {
    const result = await updateKotInvoiceByToken(data.kotToken, data.invoiceId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});
ipcMain.handle("get-last-kot", async (event) => {
  try {
    const lastKot = await getLastKotsByBranch();
    return lastKot;
  } catch (error) {
    console.error("IPC get-last-kot error:", error);
    return null;
  }
});

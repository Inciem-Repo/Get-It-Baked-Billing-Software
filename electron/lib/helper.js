import crypto from "crypto";
import { BrowserWindow } from "electron";
import { generateBillHTML } from "./printPreview.js";

export function md5(value) {
  return crypto.createHash("md5").update(value).digest("hex");
}

export function mapBillForPrint(billData, branchInfo) {
  return {
    shopName: branchInfo.branch_name || "Shop",
    address: branchInfo.branchaddress || "",
    mobile: branchInfo.bnumber,
    email: branchInfo.Email,
    date:
      new Date(billData.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " " +
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    invoice: billData.invoiceNo,
    customer: billData.customer || "Walking Customer",
    gstNo: branchInfo.gst_no || "",
    items: billData.items.map((item) => ({
      name: item.productName || item.item,
      qty: item.quantity,
      price: Number(item.unitPrice.toFixed(2)),
      taxPercent: item.igstRate + item.cgstRate || 0,
      taxableValue: Number(item.taxableValue.toFixed(2)),
    })),
    totals: {
      taxableValue: billData.items
        .reduce((sum, i) => sum + i.taxableValue, 0)
        .toFixed(2),
      totalCGST: billData.items
        .reduce((sum, i) => sum + i.cgstAmount, 0)
        .toFixed(2),
      totalSGST: billData.items
        .reduce((sum, i) => sum + i.cgstAmount, 0)
        .toFixed(2),
      grandTotal: billData.amount.toFixed(2),
      discountPercent: billData.discount || 0,
      netTotal: (
        (billData.amount || 0) -
        (billData.amount * (billData.discount || 0)) / 100
      ).toFixed(2),
    },
    paymentType: billData.paymentType,
    advanceAmount: billData.advanceAmount.toFixed(2),
    balanceToCustomer: billData.balanceToCustomer.toFixed(2),
    balanceAmount: billData.balanceAmount.toFixed(2),
  };
}

export function openPrintPreview(billData, parentWin) {
  const previewWindow = new BrowserWindow({
    width: 450,
    height: 700,
    modal: true,
    parent: parentWin,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  const html = generateBillHTML(billData);
  previewWindow.loadURL(
    "data:text/html;charset=utf-8," + encodeURIComponent(html)
  );
  return previewWindow;
}

export function getCurrentMySQLDateTime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    now.getFullYear() +
    "-" +
    pad(now.getMonth() + 1) +
    "-" +
    pad(now.getDate()) +
    " " +
    pad(now.getHours()) +
    ":" +
    pad(now.getMinutes()) +
    ":" +
    pad(now.getSeconds())
  );
}

export function sanitizeRow(row) {
  const cleanRow = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      cleanRow[key] = value.toISOString();
    } else if (value === undefined) {
      cleanRow[key] = null;
    } else {
      cleanRow[key] = value;
    }
  }
  return cleanRow;
}

export function formatDateToYMD(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getDayName(date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

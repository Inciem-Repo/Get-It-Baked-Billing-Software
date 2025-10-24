import crypto from "crypto";
import { BrowserWindow } from "electron";
import { generateBillHTML } from "./printPreview.js";

export function md5(value) {
  return crypto.createHash("md5").update(value).digest("hex");
}

export function mapBillForPrint(bill, branchInfo, type) {
  return {
    shopName: branchInfo.branch_name || "Shop",
    address: branchInfo.branchaddress || "",
    mobile: branchInfo.bnumber,
    email: branchInfo.Email,
    date: formatToIST(bill.created_at),
    invoice: bill.invid,
    customer: bill.customerName || "Walking Customer",
    gstNo: branchInfo.gst_no || "",
    items: bill.items.map((item) => ({
      name: item.productName || `Item ${item.item_id}`,
      qty: item.qty,
      price: item.unit_price,
      taxPercent: item.productTax ? item.productTax : item.tax,
      taxableValue: item.taxable_value,
    })),
    totals: {
      taxableValue: bill.items
        .reduce((sum, i) => sum + (i.taxable_value || 0), 0)
        .toFixed(2),
      totalCGST: bill.items
        .reduce((sum, i) => sum + (i.cgst_value || 0), 0)
        .toFixed(2),
      totalSGST: bill.items
        .reduce((sum, i) => sum + (i.igst_value || 0), 0)
        .toFixed(2),
      grandTotal: Number(bill.advanceamount || 0).toFixed(2),
      discountPercent: type == "branch" ? bill.discountPercentf : 0,
      netTotal:
        type == "branch"
          ? bill.grandTotalf.toFixed(2)
          : Number(bill.advanceamount || 0).toFixed(2),
    },
    paymentType: bill.paymenttype,
    advanceAmount: Number(bill.advanceamount || 0).toFixed(2),
    balanceToCustomer: Number(
      bill.balanceAmount < 0 ? Math.abs(bill.balanceAmount) : 0
    ).toFixed(2),
    balanceAmount: Number(bill.balanceAmount || 0).toFixed(2),
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

export function formatToIST(dateString) {
  if (!dateString) return "";

  try {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj)) throw new Error("Invalid date");
    const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
    const istDate = new Date(dateObj.getTime() + istOffsetMs);

    const options = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    return new Intl.DateTimeFormat("en-IN", options).format(istDate);
  } catch (err) {
    console.error("Invalid date passed to formatToIST:", dateString, err);
    return dateString;
  }
}

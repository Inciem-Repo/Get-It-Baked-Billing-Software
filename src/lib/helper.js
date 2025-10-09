import * as XLSX from "xlsx";
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

export async function exportToExcel(data, fileName) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  const sheetName = fileName.replace(/\.[^/.]+$/, "");
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];

  const ext = fileName.split(".").pop();
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  const finalFileName = `${baseName}_${formattedDate}.${ext}`;

  XLSX.writeFile(workbook, finalFileName);
}

export function getDeliveryStatusMessage(deliveryDate, deliveryTime, status) {
  if (!deliveryDate || !deliveryTime) return "N/A";
  if (status == "cancelled") return "Cancelled";

  // Parse as local date/time (avoids UTC offset issues)
  const [year, month, day] = deliveryDate.split("-").map(Number);
  const [hour, minute] = deliveryTime.split(":").map(Number);
  const deliveryDateTime = new Date(year, month - 1, day, hour, minute);

  const now = new Date();
  const diffMs = deliveryDateTime - now;

  // --- CASE 1: Delivery time already passed ---
  if (diffMs <= 0) {
    const validStatuses = ["pending", "baking", "ready", "cancelled"];

    // Served orders
    if (status === "ready" || status === "served") {
      return "Served";
    }

    // Invalid or missing status
    if (!validStatuses.includes(status?.toLowerCase())) {
      return "Not Served";
    }

    // If valid status but still pending or baking after time passed
    return "Not Served";
  }

  // --- CASE 2: Time remaining ---
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(diffMinutes / (60 * 24));
  const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
  const minutes = diffMinutes % 60;

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "1m";
}

export function convertTo12Hour(time24) {
  if (!time24) return "";

  let [hour, minute] = time24.split(":");
  hour = parseInt(hour, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
}

export function formatDateTimeTo12Hour(datetime) {
  if (!datetime) return "";

  const [datePart, timePart] = datetime.split(" ");
  if (!timePart) return datetime;

  let [hour, minute] = timePart.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  return `${datePart} ${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

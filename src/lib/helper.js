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

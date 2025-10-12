import * as XLSX from "xlsx";
export function mapBillForPrint(billData, branchInfo) {
  console.log(billData);
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
      price: item.unitPrice,
      taxPercent: item.igstRate + item.cgstRate || item.tax,
      taxableValue: item.taxableValue,
    })),
    totals: {
      taxableValue: billData.items.reduce((sum, i) => sum + i.taxableValue, 0),
      totalCGST: billData.items.reduce((sum, i) => sum + i.cgstAmount, 0),
      totalSGST: billData.items.reduce((sum, i) => sum + i.cgstAmount, 0),
      grandTotal: billData.amount,
      discountPercent: billData.discount || 0,
      netTotal:
        (billData.amount || 0) -
        (billData.amount * (billData.discount || 0)) / 100,
    },
    paymentType: billData.paymentType,
    advanceAmount: billData.advanceAmount,
    balanceToCustomer: billData.balanceToCustomer,
    balanceAmount: billData.balanceAmount,
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

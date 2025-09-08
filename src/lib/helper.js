export function mapBillForPrint(billData, branchInfo) {
  return {
    shopName: branchInfo.branch_name || "Shop",
    address: branchInfo.branchaddress || "",
    contact: `Mobile: ${branchInfo.bnumber} | Email: ${branchInfo.Email}`,
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
      taxPercent: item.igstRate || item.cgstRate || 0,
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
        .toFixed(2), // SGST mirrors CGST
      grandTotal: billData.amount.toFixed(2),
      netTotal: billData.amountReceived.toFixed(2),
    },
    paymentType: billData.paymentType,
    advanceAmount: billData.advanceAmount.toFixed(2),
    balanceToCustomer: billData.balanceToCustomer.toFixed(2),
    balanceAmount: billData.balanceAmount.toFixed(2),
  };
}

export function generateInvoiceNo(branchId) {
  const randomNum = Math.floor(1000 + Math.random() * 9000); 
  return `INVC-${branchId}-${randomNum}`;
}

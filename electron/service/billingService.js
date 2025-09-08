import db from "../db/dbSetup.js";
import {
  buildBillHistorySelectQuery,
  buildCountQuery,
  buildInsertOrIgnoreQuery,
} from "../lib/db/buildQueries.js";

export async function getBillingDetails(page = 1, limit = 10, filters = {}) {
  const offset = (page - 1) * limit;

  const query = buildBillHistorySelectQuery(filters, {
    orderBy: "b.created_at",
    orderDir: "DESC",
    limit,
    offset,
  });

  const rows = db.prepare(query).all();
  const countQuery = buildCountQuery("billing", filters);
  const totalRow = db.prepare(countQuery).get();

  return { rows, total: totalRow.count, page, limit, filters };
}

export function addBilling(billData) {
  const billingData = {
    invid: billData.invoiceNo,
    totalTaxableValuef: billData.totalTaxableValuef || 0,
    totalCgstf: billData.totalCgstf || 0,
    totalIgstf: billData.totalIgstf || 0,
    discountPercentf: billData.discount || 0,
    grandTotalf: billData.amount || 0,
    customer_id: billData.customerId,
    bill_type: "sale",
    paymenttype: billData.paymentType || "",
    billdate: billData.date,
    branch_id: "1",
    pdflink: null,
    customernote: billData.customerNote,
    advanceamount: billData.advanceAmount || 0,
    balanceAmount: billData.balanceToCustomer || 0,
  };
  console.log(billData);
  const { query: billingQuery, values: billingValues } =
    buildInsertOrIgnoreQuery("billing", billingData);

  const result = db.prepare(billingQuery).run(billingValues);
  const billId = result.lastInsertRowid;
  if (!billId) {
    throw new Error("Failed Create the bill.");
  }
  for (const item of billData.items) {
    const itemData = {
      bill_id: billId,
      item_id: item.productId,
      qty: item.quantity,
      unit_price: item.unitPrice,
      taxable_value: item.taxableValue,
      cgst_value: item.cgstAmount,
      igst_value: item.igstAmount,
      total_price: item.total,
    };

    const { query: itemQuery, values: itemValues } = buildInsertOrIgnoreQuery(
      "billing_items",
      itemData
    );

    db.prepare(itemQuery).run(itemValues);
  }

  return billId;
}

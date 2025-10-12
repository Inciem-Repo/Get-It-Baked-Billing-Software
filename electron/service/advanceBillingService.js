import db from "../db/dbSetup.js";
import { getMySqlConnection } from "../db/mysqlClient.js";
import {
  buildAdvanceBillHistorySelectQuery,
  buildAdvanceCountQuery,
  buildAdvanceGrandTotalQuery,
  buildInsertQuery,
} from "../lib/buildQueries.js";
import { generateInvoiceNo } from "./billingService.js";
import { getUser } from "./userService.js";
import isOnline from "is-online";

const branch = getUser();

export async function addAdvanceBilling(billData) {
  try {
    const createdIds = [];
    const advanceBillingData = {
      totalTaxableValuef: billData.totalTaxableValue || 0,
      totalCgstf: billData.totalCGST || 0,
      totalIgstf: billData.totalIGST || 0,
      discountPercentf: billData.discount || 0,
      grandTotalf: billData.amount || 0,
      customer_id: String(billData.customerId),
      bill_type: "advance",
      paymenttype: billData.paymentType || "",
      billdate: billData.date,
      branch_id: String(branch.id),
      customernote: billData.customerNote || "",
      advanceamount: billData.advanceAmount || 0,
      balanceAmount: billData.balanceAmount || 0,
      synced: 0,
    };

    // Insert into local advance_billing
    const advanceFields = Object.keys(advanceBillingData);
    const advanceValues = Object.values(advanceBillingData);

    const advanceQuery = buildInsertQuery("advance_billing", advanceFields);
    const result = db.prepare(advanceQuery).run(advanceValues);
    const advanceBillingId = result.lastInsertRowid;

    if (!advanceBillingId)
      throw new Error("Failed to insert advance billing record.");

    // Insert items into local advance_billing_items
    for (const item of billData.items) {
      const itemData = {
        advance_billing_id: advanceBillingId,
        item_id: item.productId,
        qty: item.quantity,
        unit_price: item.unitPrice,
        taxable_value: item.taxableValue,
        cgst_value: item.cgstAmount,
        igst_value: item.igstAmount,
        total_price: item.total,
      };

      const itemFields = Object.keys(itemData);
      const itemValues = Object.values(itemData);
      const itemQuery = buildInsertQuery("advance_billing_items", itemFields);

      db.prepare(itemQuery).run(itemValues);
    }

    // --- Try syncing to online DB ---
    const online = await isOnline();
    if (online) {
      try {
        const mysqlConn = await getMySqlConnection();
        const liveData = { ...advanceBillingData };
        delete liveData.synced;

        const liveFields = Object.keys(liveData);
        const liveValues = Object.values(liveData);
        const placeholders = liveFields.map(() => "?").join(",");

        const liveBillQuery = `INSERT INTO advance_billing (${liveFields.join(
          ","
        )}) VALUES (${placeholders})`;

        const [liveResult] = await mysqlConn.execute(liveBillQuery, liveValues);
        const liveAdvanceId = liveResult.insertId;

        // Insert items into live DB
        for (const item of billData.items) {
          const itemData = {
            advance_billing_id: liveAdvanceId,
            item_id: item.productId,
            qty: item.quantity,
            unit_price: item.unitPrice,
            taxable_value: item.taxableValue,
            cgst_value: item.cgstAmount,
            igst_value: item.igstAmount,
            total_price: item.total,
          };
          const itemFields = Object.keys(itemData);
          const itemValues = Object.values(itemData);
          const placeholders = itemFields.map(() => "?").join(",");

          const liveItemQuery = `INSERT INTO advance_billing_items (${itemFields.join(
            ","
          )}) VALUES (${placeholders})`;

          await mysqlConn.execute(liveItemQuery, itemValues);
        }

        // Mark local record as synced
        db.prepare("UPDATE advance_billing SET synced = 1 WHERE id = ?").run(
          advanceBillingId
        );
      } catch (err) {
        console.error("Failed to sync advance billing:", err.message);
      }
    }

    createdIds.push(advanceBillingId);
    return createdIds;
  } catch (err) {
    console.error("Error adding advance billing:", err.message);
    throw err;
  }
}

export async function getAdvanceBillingDetails(
  page = 1,
  limit = 10,
  filters = {}
) {
  const branchId = branch?.id;
  if (!branchId) {
    throw new Error(
      "Branch ID not available when fetching advance billing details."
    );
  }

  const offset = (page - 1) * limit;

  const query = buildAdvanceBillHistorySelectQuery(
    { ...filters, branch_id: branchId },
    {
      orderBy: "b.created_at",
      orderDir: "DESC",
      limit: limit > 0 ? limit : null,
      offset: limit > 0 ? offset : null,
    }
  );

  const rows = db.prepare(query).all();

  const countQuery = buildAdvanceCountQuery({
    ...filters,
    branch_id: branchId,
  });
  const totalRow = db.prepare(countQuery).get();

  const grandTotalQuery = buildAdvanceGrandTotalQuery({
    ...filters,
    branch_id: branchId,
  });
  const totalAmountRow = db.prepare(grandTotalQuery).get();

  return {
    rows,
    total: totalRow.count,
    grandTotal: totalAmountRow?.totalAmount || 0,
    page,
    limit,
    filters,
  };
}
export async function getAdvanceBillingById(id) {
  try {
    if (!id) throw new Error("Advance billing ID is required");

    //Fetch main bill with customer info
    const billQuery = `
      SELECT 
        b.*,
        c.name AS customer_name,
        c.mobile AS customer_mobile
      FROM advance_billing AS b
      LEFT JOIN customers AS c ON b.customer_id = c.id
      WHERE b.id = ?
    `;

    const bill = db.prepare(billQuery).get(id);
    if (!bill) {
      throw new Error(`No advance billing found with id: ${id}`);
    }

    //  Fetch items with product info
    const itemsQuery = `
      SELECT 
        i.id,
        i.item_id,
        p.title AS product_name,
        p.hsn,
        p.tax,
        p.price AS product_price,
        i.qty,
        i.unit_price,
        i.taxable_value,
        i.cgst_value,
        i.igst_value,
        i.total_price
      FROM advance_billing_items AS i
      LEFT JOIN products AS p ON i.item_id = p.id
      WHERE i.advance_billing_id = ?
    `;
    const items = db.prepare(itemsQuery).all(id);
    const invoiceId = generateInvoiceNo(bill.branch_id, bill.paymenttype);
    return {
      success: true,
      bill: {
        ...bill,
        invoiceId,
        items,
      },
    };
  } catch (err) {
    console.error("Error fetching advance billing:", err.message);
    return {
      success: false,
      message: err.message,
    };
  }
}

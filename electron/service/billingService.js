import db from "../db/dbSetup.js";
import { getMySqlConnection } from "../db/mysqlClient.js";
import {
  buildBillHistorySelectQuery,
  buildCountQuery,
  buildGrandTotalQuery,
  buildInsertQuery,
  buildSelectQuery,
} from "../lib/buildQueries.js";
import { getUser } from "./userService.js";
import isOnline from "is-online";

export async function getBillingDetails(page = 1, limit = 10, filters = {}) {
  const offset = (page - 1) * limit;

  const query = buildBillHistorySelectQuery(filters, {
    orderBy: "b.created_at",
    orderDir: "DESC",
    limit: limit > 0 ? limit : null,
    offset: limit > 0 ? offset : null,
  });

  const rows = db.prepare(query).all();

  const countQuery = buildCountQuery("billing", filters);
  const totalRow = db.prepare(countQuery).get();

  const grandTotalQuery = buildGrandTotalQuery(filters);
  const totalAmountRow = db.prepare(grandTotalQuery).get();
  const grandTotal = totalAmountRow?.totalAmount || 0;

  return {
    rows,
    total: totalRow.count,
    grandTotal,
    page,
    limit,
    filters,
  };
}
export function getBillingById(billId) {
  const billQuery = buildSelectQuery("billing", { id: billId });
  const billRow = db.prepare(billQuery).get();

  if (!billRow) return null;
  const itemQuery = `
  SELECT 
    bi.*, 
    p.title AS productName,
    p.tax AS tax,
    p.hsn AS hsn,
    p.unit AS unit
  FROM billing_items bi
  LEFT JOIN products p ON bi.item_id = p.id
  WHERE bi.bill_id = ?
`;
  const itemRows = db.prepare(itemQuery).all(billId);

  let customer = null;
  if (billRow.customer_id) {
    const customerQuery = `SELECT name FROM customers WHERE id = ?`;
    const customerRow = db.prepare(customerQuery).get(billRow.customer_id);
    if (customerRow) {
      customer = customerRow.name;
    }
  }

  return {
    ...billRow,
    customerName: customer || "Walking Customer",
    items: itemRows,
  };
}
export function getAllBillHistory(conditions = {}) {
  const query = buildBillHistorySelectQuery(conditions, {
    orderBy: "b.id",
    orderDir: "DESC",
  });
  return db.prepare(query).all();
}
export function generateInvoiceNo(branchId, paymentType) {
  let prefix;

  switch (paymentType.toLowerCase()) {
    case "splitcash":
      prefix = `INVSCL${branchId}`;
      break;
    case "cash":
      prefix = `INVCL${branchId}`;
      break;
    case "split":
      prefix = `INVSL${branchId}`;
      break;
    default:
      prefix = `INVL${branchId}`;
      break;
  }

  const row = db
    .prepare(
      `
      SELECT invid 
      FROM billing 
      WHERE invid LIKE ? 
      ORDER BY invid DESC 
      LIMIT 1
    `
    )
    .get(`${prefix}%`);

  let newNumber;

  if (row) {
    const lastNumber = parseInt(row.invid.split("-").pop(), 10);
    newNumber = String(lastNumber + 1).padStart(5, "0");
  } else {
    newNumber = "00001";
  }

  return `${prefix}-${newNumber}`;
}
export async function addBilling(billData) {
  try {
    const branch = getUser();
    const billsToInsert = [];

    if (billData.paymentType === "Split") {
      const onlineAmount = Number(billData.onlineAmount || 0);
      const cashAmount = Number(billData.cashAmount || 0);
      if (onlineAmount > 0) {
        billsToInsert.push({
          ...billData,
          invoiceNo: billData.invoiceNo,
          amount: onlineAmount,
          paymentType: "split",
        });
      }
      if (cashAmount > 0) {
        const cashInvoice = generateInvoiceNo(branch.id, "splitCash");
        billsToInsert.push({
          ...billData,
          invoiceNo: cashInvoice,
          amount: cashAmount,
          paymentType: "cash",
        });
      }
    } else {
      billsToInsert.push(billData);
    }

    const createdIds = [];

    for (const bill of billsToInsert) {
      const billingData = {
        invid: bill.invoiceNo,
        totalTaxableValuef: bill.totalTaxableValue || 0,
        totalCgstf: bill.totalCGST || 0,
        totalIgstf: bill.totalIGST || 0,
        discountPercentf: bill.discount || 0,
        grandTotalf: bill.amount || 0,
        customer_id: bill.customerId,
        bill_type: "sale",
        paymenttype: bill.paymentType || "",
        billdate: bill.date,
        branch_id: String(branch.id),
        pdflink: "",
        customernote: bill.customerNote,
        advanceamount: bill.advanceAmount || 0,
        balanceAmount: bill.balanceToCustomer || 0,
        synced: 0,
      };

      const billingFields = Object.keys(billingData);
      const billingValues = Object.values(billingData);
      // Insert into local DB
      const billingQuery = buildInsertQuery("billing", billingFields);
      const result = db.prepare(billingQuery).run(billingValues);
      const billId = result.lastInsertRowid;

      if (!billId)
        throw new Error("Bill insert failed — invoice may already exist.");
      for (const item of bill.items) {
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
        const itemFields = Object.keys(itemData);
        const itemValues = Object.values(itemData);
        const itemQuery = buildInsertQuery("billing_items", itemFields);

        db.prepare(itemQuery).run(itemValues);
      }

      // --- Try syncing online if available ---
      const online = await isOnline();
      if (online) {
        try {
          const mysqlConn = await getMySqlConnection();

          const liveBillingData = { ...billingData };
          delete liveBillingData.synced;

          const liveFields = Object.keys(liveBillingData);
          const liveValues = Object.values(liveBillingData);
          const placeholders = liveFields.map(() => "?").join(",");

          const liveBillQuery = `INSERT INTO billing (${liveFields.join(
            ","
          )}) VALUES (${placeholders})`;

          const [liveResult] = await mysqlConn.execute(
            liveBillQuery,
            liveValues
          );

          const liveBillId = liveResult.insertId;

          // Insert items into live DB
          for (const item of bill.items) {
            const itemData = {
              bill_id: liveBillId,
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
            const liveItemQuery = `INSERT INTO table_details (${itemFields.join(
              ","
            )}) VALUES (${placeholders})`;

            await mysqlConn.execute(liveItemQuery, itemValues);
          }

          db.prepare("UPDATE billing SET synced = 1 WHERE id = ?").run(billId);
        } catch (err) {
          console.error("Failed to sync bill to live DB:", err.message);
        }
      }

      createdIds.push(billId);
    }

    return createdIds;
  } catch (err) {
    console.error("Error adding bill:", err.message);
    throw err;
  }
}
export async function updateBilling(billData) {
  const branch = getUser();
  const mysqlConn = (await isOnline()) ? await getMySqlConnection() : null;

  try {
    const existingBill = db
      .prepare("SELECT * FROM billing WHERE invid = ? AND branch_id = ?")
      .get(billData.oldInvoiceNumber, branch.id);

    if (!existingBill) {
      throw new Error(`Invoice ${billData.oldInvoiceNumber} not found.`);
    }
    if (mysqlConn) await mysqlConn.beginTransaction();
    db.prepare(
      `UPDATE billing 
       SET invid = ?, paymenttype = ?, synced = 0 
       WHERE id = ?`
    ).run(billData.newInvoiceNumber, billData.paymentMethod, existingBill.id);
    if (mysqlConn) {
      await mysqlConn.execute(
        `UPDATE billing 
         SET invid = ?, paymenttype = ? 
         WHERE invid = ? AND branch_id = ?`,
        [
          billData.newInvoiceNumber,
          billData.paymentMethod,
          billData.oldInvoiceNumber,
          branch.id,
        ]
      );

      await mysqlConn.commit();
    }

    db.prepare("UPDATE billing SET synced = 1 WHERE invid = ?").run(
      billData.newInvoiceNumber
    );

    console.log(
      `Invoice updated: ${billData.oldInvoiceNumber} → ${billData.newInvoiceNumber} (${billData.paymentMethod})`
    );

    return {
      success: true,
      message: "Invoice and payment type updated successfully",
    };
  } catch (err) {
    console.error("Error updating billing:", err.message);
    if (mysqlConn) await mysqlConn.rollback();
    throw err;
  } finally {
    if (mysqlConn) await mysqlConn.end();
  }
}

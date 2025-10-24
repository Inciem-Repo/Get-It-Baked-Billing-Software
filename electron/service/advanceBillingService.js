import db from "../db/dbSetup.js";
import { getMySqlConnection } from "../db/mysqlClient.js";
import {
  buildAdvanceBillHistorySelectQuery,
  buildAdvanceCountQuery,
  buildAdvanceGrandTotalQuery,
  buildInsertQuery,
} from "../lib/buildQueries.js";
import {
  addBilling,
  generateInvoiceNo,
  getBillingById,
} from "./billingService.js";
import { getUser } from "./userService.js";
import isOnline from "is-online";

export async function addAdvanceBilling(billData) {
  const branch = getUser();
  try {
    const createdIds = [];
    const advanceBillingData = {
      id: generateAdvanceBillId(),
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
  const branch = getUser();
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
export async function convertAdvanceToBilling({
  id,
  invoiceId,
  paymenttype,
  receivedAmount,
}) {
  try {
    if (!id) throw new Error("Advance billing ID is required");

    const advanceResult = await getAdvanceBillingById(id);
    if (!advanceResult.success || !advanceResult.bill) {
      throw new Error(
        advanceResult.message || "Failed to fetch advance billing"
      );
    }

    const bill = advanceResult.bill;
    const advancePaid = Number(bill.advanceamount || 0);
    const balanceAmount = Number(bill.balanceAmount || 0);
    const received = Number(receivedAmount || 0);

    // 2. Calculate new totals
    const newAdvanceAmount = advancePaid + received;
    const newBalanceAmount = Math.max(balanceAmount - received, 0);

    // 3. Prepare final billing data
    const billData = {
      invoiceNo: invoiceId || bill.invoiceId,
      totalTaxableValue: bill.totalTaxableValuef || 0,
      totalCGST: bill.totalCgstf || 0,
      totalIGST: bill.totalIgstf || 0,
      discount: bill.discountPercentf || 0,
      amount: bill.grandTotalf || 0,
      customerId: bill.customer_id,
      bill_type: "sale",
      paymentType: paymenttype || bill.paymenttype,
      date: bill.billdate,
      branch_id: bill.branch_id,
      customerNote: bill.customernote || "",
      advanceAmount: newAdvanceAmount,
      balanceAmount: newBalanceAmount,
      items: bill.items.map((item) => ({
        productId: item.item_id,
        productName: item.product_name,
        quantity: item.qty,
        unitPrice: item.unit_price,
        taxableValue: item.taxable_value,
        cgstAmount: item.cgst_value,
        igstAmount: item.igst_value,
        total: item.total_price,
      })),
    };
    const createdIds = await addBilling(billData);
    db.prepare(
      `UPDATE advance_billing 
       SET bill_type = 'cleared',
           advanceamount = ?,
           balanceAmount = ?,
           synced = 2 
       WHERE id = ?`
    ).run(newAdvanceAmount, newBalanceAmount, id);
    const online = await isOnline();
    if (online) {
      try {
        const mysqlConn = await getMySqlConnection();
        await mysqlConn.execute(
          `
          UPDATE advance_billing 
          SET bill_type = 'cleared',
              advanceamount = ?,
              balanceAmount = ?
          WHERE id = ?
        `,
          [newAdvanceAmount, newBalanceAmount, id]
        );

        db.prepare(`UPDATE advance_billing SET synced = 1 WHERE id = ?`).run(
          id
        );
      } catch (err) {
        console.error("Failed to sync cleared advance billing:", err.message);
      }
    }

    return {
      success: true,
      message: "Advance order converted and cleared successfully",
      billingIds: createdIds,
      updatedAdvance: {
        advanceAmount: newAdvanceAmount,
        balanceAmount: newBalanceAmount,
      },
    };
  } catch (err) {
    console.error("Error converting advance to billing:", err.message);
    return {
      success: false,
      message: err.message,
    };
  }
}
export async function updateAdvanceBillTypeController(
  id,
  billType = "cleared"
) {
  try {
    if (!id) throw new Error("Advance billing ID is required");
    const localUpdate = db
      .prepare(
        "UPDATE advance_billing SET bill_type = ?, synced = 2 WHERE id = ?"
      )
      .run(billType, id);

    if (localUpdate.changes === 0)
      throw new Error("No local record found with the given ID.");
    const online = await isOnline();
    if (online) {
      try {
        const mysqlConn = await getMySqlConnection();
        const [rows] = await mysqlConn.execute(
          "SELECT id FROM advance_billing WHERE id = ?",
          [id]
        );

        if (rows.length > 0) {
          await mysqlConn.execute(
            "UPDATE advance_billing SET bill_type = ? WHERE id = ?",
            [billType, id]
          );
        } else {
          const localData = db
            .prepare("SELECT * FROM advance_billing WHERE id = ?")
            .get(id);

          if (localData) {
            const fields = Object.keys(localData);
            const placeholders = fields.map(() => "?").join(",");
            await mysqlConn.execute(
              `INSERT INTO advance_billing (${fields.join(
                ","
              )}) VALUES (${placeholders})`,
              Object.values(localData)
            );
          }
        }
        db.prepare("UPDATE advance_billing SET synced = 1 WHERE id = ?").run(
          id
        );
      } catch (err) {
        console.error("Live DB update failed:", err.message);
      }
    }

    return { success: true, message: "Bill type updated successfully" };
  } catch (err) {
    console.error("updateAdvanceBillTypeController error:", err.message);
    return { success: false, message: err.message };
  }
}
function generateAdvanceBillId() {
  const branch = getUser();
  const branchId = branch.id;
  const RANGE = 10000000;
  const base = branchId * RANGE;

  const row = db
    .prepare(
      `SELECT MAX(id) AS maxId 
       FROM advance_billing 
       WHERE id BETWEEN ? AND ?`
    )
    .get(base, base + RANGE - 1);

  let sequence = 0;

  if (row && row.maxId) {
    sequence = row.maxId - base;
  }

  return base + (sequence + 1);
}

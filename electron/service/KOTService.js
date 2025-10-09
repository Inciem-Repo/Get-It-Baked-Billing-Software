import db from "../db/dbSetup.js";
import { buildInsertQuery } from "../lib/buildQueries.js";
import { getUser } from "./userService.js";

let branch = getUser();

export function generateKotToken() {
  const prefix = `KOT${branch.id}`;

  const row = db
    .prepare(
      `
      SELECT kotToken
      FROM kot_orders
      WHERE kotToken LIKE ?
      ORDER BY kotToken DESC
      LIMIT 1
    `
    )
    .get(`${prefix}%`);

  let newNumber;

  if (row) {
    const lastNumber = parseInt(row.kotToken.split("-").pop(), 10);
    newNumber = String(lastNumber + 1).padStart(5, "0");
  } else {
    newNumber = "00001";
  }

  return `${prefix}-${newNumber}`;
}
export function addKot(kotData) {
  const {
    kotToken,
    customer,
    priority,
    deliveryDate,
    deliveryTime,
    items,
    totalAmount,
  } = kotData;
  const insertKotTransaction = db.transaction(() => {
    const kotOrder = {
      kotToken,
      invoiceId: null,
      branchId: branch.id,
      customerId: customer?.id || null,
      priority,
      deliveryDate,
      createdBy: branch.id,
      deliveryTime,
      status: "pending",
      totalAmount,
      isDeleted: 0,
    };

    const kotQuery = buildInsertQuery("kot_orders", Object.keys(kotOrder));
    const kotStmt = db.prepare(kotQuery);
    const kotResult = kotStmt.run(Object.values(kotOrder));
    const itemFields = [
      "kotOrderId",
      "productId",
      "quantity",
      "total",
      "notes",
      "unitPrice",
      "isDeleted",
    ];
    const itemQuery = buildInsertQuery("kot_items", itemFields);
    const itemStmt = db.prepare(itemQuery);
    const insertedItems = items.map((item) => {
      const values = [
        kotToken,
        item.productId,
        item.quantity,
        item.total,
        item.notes || "",
        item.unitPrice,
        0,
      ];
      const result = itemStmt.run(values);
      return { id: result.lastInsertRowid, ...item };
    });
    return {
      ...kotOrder,
      items: insertedItems,
    };
  });
  try {
    const result = insertKotTransaction();
    return result;
  } catch (error) {
    console.error("❌ Error inserting KOT:", error.message);
    throw new Error("Failed to create KOT. Please try again.");
  }
}
export async function getKotOrdersByBranch() {
  const branchId = branch.id;
  try {
    const kotOrders = db
      .prepare(
        `
        SELECT 
          ko.*,
          c.name AS customerName,
          c.mobile AS customerMobile,
          c.email AS customerEmail
        FROM kot_orders ko
        LEFT JOIN customers c ON c.id = ko.customerId
        WHERE ko.branchId = ? AND ko.isDeleted = 0
        ORDER BY ko.id DESC
        `
      )
      .all(branchId);

    const kotItemsStmt = db.prepare(`
      SELECT 
        ki.*, 
        p.title AS productName
      FROM kot_items ki
      LEFT JOIN products p ON p.id = ki.productId
      WHERE ki.kotOrderId = ? AND ki.isDeleted = 0
    `);

    const kotData = kotOrders.map((kot) => ({
      ...kot,
      items: kotItemsStmt.all(kot.kotToken),
    }));

    return kotData;
  } catch (error) {
    console.error("Error fetching KOT orders:", error);
    throw new Error("Failed to fetch KOT orders");
  }
}
export async function updateKOTStatusService(kotId, status) {
  try {
    const stmt = db.prepare(`
      UPDATE kot_orders
      SET status = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(status, kotId);

    if (result.changes === 0) {
      throw new Error("No order found with given ID");
    }

    return { id: kotId, status };
  } catch (error) {
    console.error("DB update error:", error);
    throw error;
  }
}
export async function getKotByToken(kotToken) {
  try {
    const kotOrder = db
      .prepare(
        `
        SELECT 
          ko.*,
          c.name AS customerName,
          c.mobile AS customerMobile,
          c.email AS customerEmail
        FROM kot_orders ko
        LEFT JOIN customers c ON c.id = ko.customerId
        WHERE ko.kotToken = ? AND ko.isDeleted = 0
        LIMIT 1
        `
      )
      .get(kotToken);

    if (!kotOrder) {
      return null;
    }
    const kotItems = db
      .prepare(
        `
        SELECT 
          ki.*, 
          p.title AS productName
        FROM kot_items ki
        LEFT JOIN products p ON p.id = ki.productId
        WHERE ki.kotOrderId = ? AND ki.isDeleted = 0
        `
      )
      .all(kotOrder.kotToken);
    return {
      ...kotOrder,
      items: kotItems,
    };
  } catch (error) {
    console.error("Error fetching KOT by token:", error);
    throw new Error("Failed to fetch KOT details");
  }
}

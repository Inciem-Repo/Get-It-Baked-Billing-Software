import React, { forwardRef } from "react";

const BillPrint = ({ bill, contentRef }) => {
  if (!bill) return null;

  const { items = [] } = bill;

  const totalTaxableValue = items.reduce((sum, i) => sum + i.taxableValue, 0);
  const totalCGST = items.reduce((sum, i) => sum + i.cgstAmount, 0);
  const totalSGST = items.reduce((sum, i) => sum + i.cgstAmount, 0); 
  const grandTotal = items.reduce((sum, i) => sum + i.total, 0);

  return (
    <div
      ref={contentRef}
      style={{ width: "300px", fontFamily: "Arial, sans-serif" }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h2 style={{ margin: 0 }}>BAKED</h2>
        <p style={{ margin: "4px 0", fontSize: "14px" }}>Cakes & Pastries</p>
        <p style={{ fontSize: "12px", margin: "2px 0" }}>
          Changampuzha park Metro station, <br />
          Devankulangara, Mamangalam, <br />
          Edappally, Ernakulam, Kerala, Pin:682024
        </p>
        <p style={{ fontSize: "12px", margin: "2px 0" }}>
          Mobile: 7736321555 | Web: https://getitbaked.in
        </p>
        <hr />
      </div>

      {/* Invoice Info */}
      <div style={{ fontSize: "12px", marginBottom: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Date: {new Date(bill.date).toLocaleString()}</span>
          <span>Invoice NO: {bill.invoiceNo}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>GST NO: 32CQWP4392J1Z2</span>
          <span>Customer: {bill.customer || "Walking Customer"}</span>
        </div>
      </div>
      <hr />

      {/* Items Table */}
      <table
        style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid #000" }}>
            <th style={{ textAlign: "left" }}>Sl.</th>
            <th style={{ textAlign: "left" }}>Name</th>
            <th style={{ textAlign: "center" }}>MRP</th>
            <th style={{ textAlign: "center" }}>Qty</th>
            <th style={{ textAlign: "center" }}>Tax %</th>
            <th style={{ textAlign: "center" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={it.id}>
              <td>{idx + 1}</td>
              <td>{it.productName || it.item}</td>
              <td style={{ textAlign: "center" }}>{it.unitPrice.toFixed(2)}</td>
              <td style={{ textAlign: "center" }}>{it.quantity}</td>
              <td style={{ textAlign: "center" }}>
                {(it.igstRate || 0).toFixed(0)}
              </td>
              <td style={{ textAlign: "center" }}>{it.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      {/* Totals */}
      <div style={{ fontSize: "12px", marginTop: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Taxable Value:</span>
          <span>{totalTaxableValue.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Total CGST:</span>
          <span>{totalCGST.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Total SGST:</span>
          <span>{totalSGST.toFixed(2)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
          }}
        >
          <span>Grand Total:</span>
          <span>{grandTotal.toFixed(2)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
          }}
        >
          <span>Net Total:</span>
          <span>{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <hr />

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "12px", marginTop: "10px" }}>
        <p>Thank you for choosing us!</p>
        <p>For any Complaints & Suggestions,</p>
        <hr />
        <p>Contact us on +91 9539938305</p>
      </div>
    </div>
  );
};

export default BillPrint;

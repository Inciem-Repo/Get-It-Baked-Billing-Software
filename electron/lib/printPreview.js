export function generateBillHTML(bill) {
  return `
  <html>
    <head>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px; 
          font-size: 12px; 
          line-height: 1.2;
          max-width: 300px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
        }
        .shop-name {
          font-size: 18px;
          font-weight: bolder;
          margin: 0;
        }
        .tagline {
          font-size: 14px;
          font-weight: bold;
          margin: 2px 0 8px 0;
        }
        .address {
          font-size: 10px;
          line-height: 1.3;
          margin-bottom: 8px;
          font-weight: bold;
        }
        .contact {
          font-size: 10px;
          margin-bottom: 15px;
          font-weight: bold;
        }
        .separator {
          border-top: 1px solid #000;
          margin: 8px 0;
        }
        .bill-info {
          font-size: 12px;
          margin-bottom: 8px;
        }
        .bill-info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin: 8px 0;
        }
        .items-header {
          border-bottom: 1px solid #000;
          padding: 3px 0;
        }
        .items-header th {
          text-align: left;
          font-weight: bold;
          padding: 2px;
        }
        .items-header .right {
          text-align: right;
        }
        .item-row td {
          padding: 2px;
          border-bottom: none;
        }
        .item-row .right {
          text-align: right;
        }
        .totals {
          margin-top: 15px;
          font-size: 12px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .total-row.final {
          font-weight: bold;
        }
        .footer {
          text-align: center;
          font-style: italic;
          font-size: 14px;
          margin-top: 15px;
          line-height: 1.3;
        }
        .buttons {
          text-align: center;
          margin-top: 20px;
        }
        button { 
          margin: 0 5px; 
          padding: 8px 16px; 
          cursor: pointer; 
          font-size: 12px;
        }
        #errorBox { 
          color: red; 
          margin-top: 15px; 
          font-weight: bold; 
          text-align: center;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="shop-name">BAKED</h1>
        <h2 class="tagline">Cakes & Pastries</h2>
        <div class="address">
          Changampuzha park Metro station,<br>
          Devankulangara,Mamangalam,<br>
          Edappally,Eranakulam,<br>
          Kerala,Pin:682024
        </div>
        <div class="contact">
          Mobile:7736321555 |<br>
          Web:https://getitbaked.in
        </div>
      </div>
      
      <div class="separator"></div>
      
      <div class="bill-info">
        <div class="bill-info-row">
          <span class="label">Date :</span>
          <span class="value">${
            bill.date || new Date().toLocaleDateString("en-IN")
          } ${new Date().toLocaleTimeString("en-IN", { hour12: true })}</span>
        </div>
        <div class="bill-info-row">
          <span class="label">Invoice NO :</span>
          <span class="value">${bill.invoice || "INVC14-01840"}</span>
        </div>
        <div class="bill-info-row">
          <span class="label">GST NO :</span>
          <span class="value">${bill.gstNo || "32CQWPP4392J1Z2"}</span>
        </div>
        <div class="bill-info-row">
          <span class="label">Customer :</span>
          <span class="value">${bill.customer || "Walking Customer"}</span>
        </div>
      </div>
      
      <div class="separator"></div>
      
      <table class="items-table">
        <thead class="items-header">
          <tr>
            <th>Sl.</th>
            <th>Name</th>
            <th class="right">MRP</th>
            <th class="right">Qty</th>
            <th class="right">Tax %</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${
            bill.items
              ?.map(
                (item, i) => `
            <tr class="item-row">
              <td>${i + 1}</td>
              <td>${item.name}</td>
              <td class="right">${item.price?.toFixed(2) || "0.00"}</td>
              <td class="right">${item.qty || 1}</td>
              <td class="right">${item.taxPercent || 18}</td>
              <td class="right">${((item.qty || 1) * (item.price || 0)).toFixed(
                2
              )}</td>
            </tr>
          `
              )
              .join("") ||
            `
            <tr class="item-row">
              <td>1</td>
              <td>Candle @ 10</td>
              <td class="right">8.47</td>
              <td class="right">1</td>
              <td class="right">18</td>
              <td class="right">10.00</td>
            </tr>
          `
          }
        </tbody>
      </table>
      
      <div class="separator"></div>
      
      <div class="totals">
        <div class="total-row">
          <span>Taxable Value:</span>
          <span>${bill.totals?.taxableValue?.toFixed(2) || "8.47"}</span>
        </div>
        <div class="total-row">
          <span>Total CGST:</span>
          <span>${bill.totals?.totalCGST?.toFixed(2) || "0.76"}</span>
        </div>
        <div class="total-row">
          <span>Total SGST:</span>
          <span>${bill.totals?.totalSGST?.toFixed(2) || "0.76"}</span>
        </div>
        <div class="total-row">
          <span>Grand Total:</span>
          <span>${bill.totals?.grandTotal?.toFixed(2) || "10.00"}</span>
        </div>
        <div class="total-row final">
          <span>Net Total:</span>
          <span>${bill.totals?.netTotal?.toFixed(2) || "10.00"}</span>
        </div>
      </div>
      
      <div class="footer">
        <em>Thank you for choosing us!<br>
        For any Complaints& Suggestions,</em>
      </div>
      
      <div class="buttons">
        <button id="printBtn">Print (Enter)</button>
        <button id="cancelBtn">Cancel (Esc)</button>
      </div>
      
      <div id="errorBox"></div>
      
      <script>
        const { ipcRenderer } = require('electron');
        
        function doPrint() {
          ipcRenderer.invoke('print-bill', ${JSON.stringify(bill)})
            .then(() => window.close())
            .catch(err => {
              document.getElementById('errorBox').innerText = "Print Error: " + err.message;
            });
        }
        
        document.getElementById('printBtn').onclick = doPrint;
        document.getElementById('cancelBtn').onclick = () => window.close();
       
        document.addEventListener('keydown', (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            doPrint();
          } else if (e.key === "Escape") {
            e.preventDefault();
            window.close();
          }
        });
      </script>
    </body>
  </html>
  `;
}

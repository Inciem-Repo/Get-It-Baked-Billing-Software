// export function generateBillHTML(bill) {
//   const perItemHeightPx = 20;
//   const baseHeightPx = 200;
//   const totalHeightPx =
//     baseHeightPx + (bill.items?.length || 1) * perItemHeightPx;

//   return `
//   <html>
//     <head>
//       <style>
//         body {
//           font-family: Arial, sans-serif;
//           width: 230px; /* 80mm thermal roll */
//           font-size: 12px;
//           line-height: 1.3;
//           margin:0px 25px;
//           padding: 10px;
//           height: ${totalHeightPx}px; /* Dynamic height */
//         }
//         .header { text-align: center; margin-bottom: 15px; }
//         .shop-name { font-size: 18px; font-weight: bolder; margin: 0; }
//         .tagline { font-size: 14px; font-weight: bold; margin: 2px 0 8px 0; }
//         .address, .contact { font-size: 10px; margin-bottom: 8px; font-weight: bold; }
//         .separator { border-top: 1px solid #000; margin: 8px 0; }
//         .bill-info { font-size: 12px; margin-bottom: 8px; }
//         .bill-info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
//         .items-table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0; }
//         .items-header th { text-align: left; font-weight: bold; padding: 2px; }
//         .item-row td { padding: 2px; }
//         .right { text-align: right; }
//         .totals { margin-top: 15px; font-size: 12px; }
//         .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
//         .total-row.final { font-weight: bold; }
//         .footer { text-align: center; font-style: italic; font-size: 12px; margin-top: 10px; line-height: 1.2; }
//         @media print { .buttons { display: none !important; } }
//       </style>
//     </head>
//     <body>
//       <div class="header">
//         <h1 class="shop-name">BAKED</h1>
//         <h2 class="tagline">Cakes & Pastries</h2>
//         <div class="address">Changampuzha park Metro station,<br>Devankulangara,Mamangalam,<br>Edappally,Eranakulam,<br>Kerala,Pin:682024</div>
//         <div class="contact">Mobile:7736321555 | Web:https://getitbaked.in</div>
//       </div>

//       <div class="separator"></div>

//       <div class="bill-info">
//         <div class="bill-info-row"><span>Date :</span><span>${
//           bill.date || new Date().toLocaleDateString("en-IN")
//         }</span></div>
//         <div class="bill-info-row"><span>Invoice NO :</span><span>${
//           bill.invoice || "INVC14-01840"
//         }</span></div>
//         <div class="bill-info-row"><span>GST NO :</span><span>${
//           bill.gstNo || "32CQWPP4392J1Z2"
//         }</span></div>
//         <div class="bill-info-row"><span>Customer :</span><span>${
//           bill.customer || "Walking Customer"
//         }</span></div>
//       </div>

//       <div class="separator"></div>

//       <table class="items-table">
//         <thead class="items-header">
//           <tr>
//             <th>Sl.</th>
//             <th>Name</th>
//             <th class="right">MRP</th>
//             <th class="right">Qty</th>
//             <th class="right">Tax %</th>
//             <th class="right">Total</th>
//           </tr>
//         </thead>
//         <tbody>
//           ${
//             bill.items
//               ?.map(
//                 (item, i) => `
//             <tr class="item-row">
//               <td>${i + 1}</td>
//               <td>${item.name}</td>
//               <td class="right">${item.price || "0.00"}</td>
//               <td class="right">${item.qty || 1}</td>
//               <td class="right">${item.taxPercent || 18}</td>
//               <td class="right">${((item.qty || 1) * (item.price || 0)).toFixed(
//                 2
//               )}</td>
//             </tr>
//           `
//               )
//               .join("") ||
//             `
//             <tr class="item-row">
//               <td>1</td>
//               <td>Candle @ 10</td>
//               <td class="right">8.47</td>
//               <td class="right">1</td>
//               <td class="right">18</td>
//               <td class="right">10.00</td>
//             </tr>`
//           }
//         </tbody>
//       </table>

//       <div class="separator"></div>

//       <div class="totals">
//         <div class="total-row"><span>Taxable Value:</span><span>${
//           bill.totals?.taxableValue || "8.47"
//         }</span></div>
//         <div class="total-row"><span>Total CGST:</span><span>${
//           bill.totals?.totalCGST || "0.76"
//         }</span></div>
//         <div class="total-row"><span>Total SGST:</span><span>${
//           bill.totals?.totalSGST || "0.76"
//         }</span></div>
//         <div class="total-row"><span>Grand Total:</span><span>${
//           bill.totals?.grandTotal || "10.00"
//         }</span></div>
//         <div class="total-row final"><span>Net Total:</span><span>${
//           bill.totals?.netTotal || "10.00"
//         }</span></div>
//       </div>

//       <div class="footer"><em>Thank you for choosing us!<br>For any Complaints & Suggestions,</em></div>

//       <div class="buttons">
//         <button id="printBtn">Print (Enter)</button>
//         <button id="cancelBtn">Cancel (Esc)</button>
//       </div>

//       <script>
//         const { ipcRenderer } = require('electron');
//         function doPrint() {
//           ipcRenderer.invoke('print-bill', ${JSON.stringify(bill)})
//             .then(() => window.close())
//             .catch(err => { alert("Print Error: " + err.message); });
//         }
//         document.getElementById('printBtn').onclick = doPrint;
//         document.getElementById('cancelBtn').onclick = () => window.close();
//         document.addEventListener('keydown', e => {
//           if (e.key === "Enter") { e.preventDefault(); doPrint(); }
//           else if (e.key === "Escape") { e.preventDefault(); window.close(); }
//         });
//       </script>
//     </body>
//   </html>
//   `;
// }

export function generateBillHTML(bill) {
  const perItemHeightPx = 20;
  const baseHeightPx = 200;
  const totalHeightPx =
    baseHeightPx + (bill.items?.length || 1) * perItemHeightPx;
  const formatAddress = (addr) => {
    const parts = addr.split(",");
    let formatted = "";

    parts.forEach((part, i) => {
      formatted += part.trim();
      if (i === 0 || i === 2 || i === 4) {
        formatted += ",<br>";
      } else if (i < parts.length - 1) {
        formatted += ","; // normal comma
      }
    });

    return formatted;
  };

  return `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          width: 250px; /* 80mm thermal roll */
          font-size: 12px;
          line-height: 1.3;
          margin:0px 20px;
          padding: 10px;
          height: ${totalHeightPx}px; /* Dynamic height */
        }
        .header { text-align: center; margin-bottom: 15px; }
        .shop-name { font-size: 18px; font-weight: bolder; margin: 0; }
        .tagline { font-size: 14px; font-weight: bold; margin: 2px 0 8px 0; }
        .address, .contact { font-size: 10px; margin-bottom: 8px; font-weight: bold; }
        .separator { border-top: 1px solid #000; margin: 8px 0; }
        .bill-info { font-size: 12px; margin-bottom: 8px; }
        .bill-info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .items-table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0; }
        .items-header th { text-align: left; font-weight: bold; padding: 2px; }
        .item-row td { padding: 2px; }
        .right { text-align: center; }
        .totals { margin-top: 15px; font-size: 12px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .total-row.final { font-weight: bold; }
        .footer { text-align: center; font-style: italic; font-size: 12px; margin-top: 10px; line-height: 1.2; }
        .buttons{margin-top: 20px;width: 100%; display: flex;justify-content: center;
    gap: 10px;}
        @media print { .buttons { display: none !important; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="shop-name">BAKED Cakes & Pastries</h1>
        <div class="address">${formatAddress(bill.address)}</div>
        <div class="contact">
         Ph: ${bill.mobile || ""}<br>
          ${bill.email || ""}<br>
          https://getitbaked.in
       </div>

      </div>

      <div class="separator"></div>

      <div class="bill-info">
        <div class="bill-info-row"><span>Date :</span><span>${
          bill.date || new Date().toLocaleDateString("en-IN")
        }</span></div>
        <div class="bill-info-row"><span>Invoice NO :</span><span>${
          bill.invoice || "INVC14-01840"
        }</span></div>
        <div class="bill-info-row"><span>GST NO :</span><span>${
          bill.gstNo || "32CQWPP4392J1Z2"
        }</span></div>
        <div class="bill-info-row"><span>Customer :</span><span>${
          bill.customer || "Walking Customer"
        }</span></div>
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
              <td class="right">${item.taxableValue || "0.00"}</td>
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
            </tr>`
          }
        </tbody>
      </table>

      <div class="separator"></div>

      <div class="totals">
        <div class="total-row"><span>Taxable Value:</span><span>${
          bill.totals?.taxableValue
        }</span></div>
        <div class="total-row"><span>Total CGST:</span><span>${
          bill.totals?.totalCGST
        }</span></div>
        <div class="total-row"><span>Total SGST:</span><span>${
          bill.totals?.totalSGST
        }</span></div>
        <div class="total-row"><span>Grand Total:</span><span>${
          bill.totals?.grandTotal
        }</span></div>
        <div class="total-row"><span>Discount(%):</span><span>${
          bill.totals?.discountPercent
        }</span></div>
        <div class="total-row final"><span>Net Total:</span><span>${
          bill.totals?.netTotal
        }</span></div>
      </div>

      <div class="footer"><em>Thank you for choosing us!<br>For any Complaints & Suggestions,<br>Contact us on +91 9539938305</em></div>

      <div class="buttons">
        <button id="printBtn">Print (Enter)</button>
        <button id="cancelBtn">Cancel (Esc)</button>
      </div>

      <script>
        const { ipcRenderer } = require('electron');
        function doPrint() {
          ipcRenderer.invoke('print-bill', ${JSON.stringify(bill)})
            .then(() => window.close())
            .catch(err => { alert("Print Error: " + err.message); });
        }
        document.getElementById('printBtn').onclick = doPrint;
        document.getElementById('cancelBtn').onclick = () => window.close();
        document.addEventListener('keydown', e => {
          if (e.key === "Enter") { e.preventDefault(); doPrint(); }
          else if (e.key === "Escape") { e.preventDefault(); window.close(); }
        });
      </script>
    </body>
  </html>
  `;
}

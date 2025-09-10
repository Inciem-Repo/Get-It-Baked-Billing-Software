import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  loginUser: (username, password) =>
    ipcRenderer.invoke("login-user", { username, password }),
  getUser: () => ipcRenderer.invoke("get-user"),
  clearUser: () => ipcRenderer.invoke("clear-user"),
  getProducts: () => ipcRenderer.invoke("get-products"),
  getCustomers: () => ipcRenderer.invoke("get-customers"),
  addCustomer: (customer) => ipcRenderer.invoke("add-customer", customer),
  getBillingDetails: (args) => ipcRenderer.invoke("get-billing-details", args),
  openPrintPreview: (bill) => ipcRenderer.invoke("open-print-preview", bill),
  generateInvoiceNo: (branchId) =>
    ipcRenderer.invoke("generate-invoice-no", branchId),
  confirmPrint: (data) => ipcRenderer.invoke("confirm-print", data),
  addBilling: (billData) => ipcRenderer.invoke("add-billing", billData),
  searchCustomers: (searchTerm) =>
    ipcRenderer.invoke("search-customers", searchTerm),
  printInvoice: (billId, branchInfo) =>
    ipcRenderer.invoke("print-invoice-by-id", { billId, branchInfo }),
  getAllBillHistory: (conditions) =>
    ipcRenderer.invoke("get-all-bill-history", conditions),
  runSync: () => ipcRenderer.invoke("run-sync"),
  onSyncStatus: (callback) =>
    ipcRenderer.on("sync-status", (_, data) => callback(data)),
});

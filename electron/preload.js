import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  loginUser: (username, password) =>
    ipcRenderer.invoke("login-user", { username, password }),
  getUser: () => ipcRenderer.invoke("get-user"),
  clearUser: () => ipcRenderer.invoke("clear-user"),
  getProducts: () => ipcRenderer.invoke("get-products"),
  getCustomers: () => ipcRenderer.invoke("get-customers"),
  getCustomerById: (id) => ipcRenderer.invoke("get-customer-by-id", id),
  addCustomer: (customer) => ipcRenderer.invoke("add-customer", customer),
  updateBilling: (billData) => ipcRenderer.invoke("update-billing", billData),

  getBillingDetails: (args) => ipcRenderer.invoke("get-billing-details", args),
  openPrintPreview: (bill) => ipcRenderer.invoke("open-print-preview", bill),
  generateInvoiceNo: (branchId, paymentType) =>
    ipcRenderer.invoke("generate-invoice-no", branchId, paymentType),
  confirmPrint: (data) => ipcRenderer.invoke("confirm-print", data),
  addBilling: (billData) => ipcRenderer.invoke("add-billing", billData),
  getSummary: () => ipcRenderer.invoke("billing-getSummary"),
  getPerformanceSummary: (fromDate, toDate) =>
    ipcRenderer.invoke("get-performance-summary", {
      fromDate,
      toDate,
    }),

  searchCustomers: (searchTerm) =>
    ipcRenderer.invoke("search-customers", searchTerm),
  printInvoice: (billId, branchInfo) =>
    ipcRenderer.invoke("print-invoice-by-id", { billId, branchInfo }),
  getBillDetails: (billId) => ipcRenderer.invoke("get-bill-by-id", billId),

  getAllBillHistory: (conditions) =>
    ipcRenderer.invoke("get-all-bill-history", conditions),
  runSync: () => ipcRenderer.invoke("run-sync"),
  onSyncStatus: (callback) =>
    ipcRenderer.on("sync-status", (_, data) => callback(data)),
  getPrinters: () => ipcRenderer.invoke("get-printers"),
  getSavedPrinter: () => ipcRenderer.invoke("get-saved-printer"),
  savePrinter: (printer) => ipcRenderer.invoke("save-printer", printer),
  expenseGetAll: (conditions) =>
    ipcRenderer.invoke("expense-get-all", conditions),
  getExpenseSummary: () => ipcRenderer.invoke("expense-getSummary"),
  getExpenseCategories: () => ipcRenderer.invoke("get-expense-categories"),
  addExpense: (expenseData) => ipcRenderer.invoke("expense-add", expenseData),

  getAppVersion: () => ipcRenderer.invoke("get_app_version"),
  checkForUpdate: () => ipcRenderer.send("check_for_update"),
  restartApp: () => ipcRenderer.send("restart_app"),

  onUpdateChecking: (cb) => ipcRenderer.on("update_checking", cb),
  onUpdateAvailable: (cb) => ipcRenderer.on("update_available", cb),
  onUpdateNotAvailable: (cb) => ipcRenderer.on("update_not_available", cb),
  onUpdateDownloaded: (cb) => ipcRenderer.on("update_downloaded", cb),
  onDownloadProgress: (cb) =>
    ipcRenderer.on("download_progress", (e, data) => cb(data)),
  onUpdateError: (cb) => ipcRenderer.on("update_error", (e, err) => cb(err)),

  addKot: (kotData) => ipcRenderer.invoke("kot-add", kotData),
  generateKOTToken: () => ipcRenderer.invoke("kot-generate-token"),
  getKOTByBranch: () => ipcRenderer.invoke("kot-getBy-Branch"),
  updateKOTStatus: (kotId, status) =>
    ipcRenderer.invoke("update-kot-status", { kotId, status }),
  getKOTDetailsById: (kotToken) =>
    ipcRenderer.invoke("get-kot-by-token", kotToken),
  updateKOTInvoiceByToken: (kotToken, invoiceId) =>
    ipcRenderer.invoke("updateKOTInvoiceByToken", { kotToken, invoiceId }),
  getLastKot: () => ipcRenderer.invoke("get-last-kot"),
  
  
  //advance billing
  addAdvanceBilling: (billData) =>
    ipcRenderer.invoke("add-advance-billing", billData),
  getAdvanceBillingDetails: (args) =>
    ipcRenderer.invoke("get-advance-billing-details", args),
  getAdvanceBillingById: (id) =>
    ipcRenderer.invoke("get-advance-billing-by-id", id),
});

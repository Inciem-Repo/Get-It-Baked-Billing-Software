import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  loginUser: (username, password) =>
    ipcRenderer.invoke("login-user", { username, password }),
  getUser: () => ipcRenderer.invoke("get-user"),
  clearUser: () => ipcRenderer.invoke("clear-user"),
  getProducts: () => ipcRenderer.invoke("get-products"),
  getCustomers: () => ipcRenderer.invoke("get-customers"),
  getBillingDetails: (args) => ipcRenderer.invoke("get-billing-details", args),
  openPreview: () => ipcRenderer.invoke("open-print-preview"),
  confirmPrint: (data) => ipcRenderer.invoke("confirm-print", data),
  addBilling: (billData) => ipcRenderer.invoke("add-billing", billData),
  searchCustomers: (searchTerm) =>
    ipcRenderer.invoke("search-customers", searchTerm),
});

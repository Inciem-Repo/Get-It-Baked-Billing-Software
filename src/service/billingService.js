export const getBillingInfo = async (page = 1, limit = 10, filters = {}) => {
  try {
    return await window.api.getBillingDetails({ page, limit, filters });
  } catch (error) {
    console.error("Billing fetch error:", error);
    return { success: false, message: "Something went wrong." };
  }
};

export const saveBillingInfo = async (billData) => {
  try {
    const result = await window.api.addBilling(billData);
    if (result.success) {
      return result;
    } else {
      console.error("Failed to save bill:", result.error);
      return { success: false, message: result.error };
    }
  } catch (error) {
    console.error("Billing save error:", error);
    return { success: false, message: "Something went wrong while saving." };
  }
};

export const getBillingInvoice = async (billId, branchInfo) => {
  try {
    return await window.api.printInvoice(billId, branchInfo);
  } catch (error) {
    console.error("Billing fetch error:", error);
    return { success: false, message: "Something went wrong." };
  }
};

export const getAllBillHistory = async () => {
  try {
    return await window.api.getAllBillHistory({});
  } catch (error) {
    console.error("Billing fetch error:", error);
    return { success: false, message: "Something went wrong." };
  }
};

export const syncDetails = async () => {
  try {
    return await window.api.runSync();
  } catch (error) {
    console.error("Billing fetch error:", error);
    return { success: false, message: "Something went wrong." };
  }
};

export const handleGenerateInvoice = async (branchId, paymentType) => {
  try {
    const result = await window.api.generateInvoiceNo(branchId, paymentType);
    return result.invoiceNo;
  } catch (error) {
    console.error("Failed:", error);
  }
};

export const getBillDetailsById = async (billId) => {
  try {
    return await window.api.getBillDetails(billId);
  } catch (error) {
    console.error("Failed:", error);
  }
};

export const updateBillDetails = async (billData) => {
  try {
    return await window.api.updateBilling(billData);
  } catch (error) {
    console.error("Failed:", error);
  }
};

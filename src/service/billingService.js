export const getBillingInfo = async (page = 1, limit = 10, filters = {}) => {
  try {
    console.log(page, limit, filters);
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
      console.log("Bill saved successfully, ID:", result.billId);
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

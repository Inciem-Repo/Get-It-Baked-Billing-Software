export const saveAdvanceBillingInfo = async (billData) => {
  try {
    const result = await window.api.addAdvanceBilling(billData);
    if (result.success) {
      return result;
    } else {
      return { success: false, message: result.error };
    }
  } catch (error) {
    console.error("Advance billing save error:", error);
    return { success: false, message: "Something went wrong while saving." };
  }
};
export const getAdvanceBillingInfo = async (page, limit, filters) => {
  try {
    const result = await window.api.getAdvanceBillingDetails({
      page,
      limit,
      filters,
    });
    return result;
  } catch (error) {
    console.error("Advance billing save error:", error);
    return { success: false, message: "Something went wrong while saving." };
  }
};
export const getAdvanceBillingInfoById = async (id) => {
  try {
    const result = await window.api.getAdvanceBillingById(id);
    return result;
  } catch (error) {
    console.error("Advance billing save error:", error);
    return { success: false, message: "Something went wrong while saving." };
  }
};
export const saveAdvanceToBilling = async (billInfo) => {
  try {
    return await window.api.convertAdvanceToBilling(billInfo);
  } catch (error) {
    console.error("Advance billing save error:", error);
    return { success: false, message: "Something went wrong while saving." };
  }
};
export const updateAdvanceBillType = async (id, billType = "cleared") => {
  try {
    const result = await window.api.updateAdvanceBillType(id, billType);
    return result;
  } catch (error) {
    console.error("Failed to update advance bill type:", error);
    return { success: false, message: "Failed to update advance bill type" };
  }
};

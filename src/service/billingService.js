export const getBillingInfo = async (page = 1, limit = 10, filters = {}) => {
  try {
    console.log(page, limit, filters);
    return await window.api.getBillingDetails({ page, limit, filters });
  } catch (error) {
    console.error("Billing fetch error:", error);
    return { success: false, message: "Something went wrong." };
  }
};

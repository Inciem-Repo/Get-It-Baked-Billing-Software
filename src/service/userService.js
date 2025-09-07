export const getCustomersInfo = async (searchTerm) => {
  try {
    const result = await window.api.searchCustomers(searchTerm);
    return result;
  } catch (error) {
    console.error("Auth service error:", error);
    return { success: false, message: "Something went wrong." };
  }
};

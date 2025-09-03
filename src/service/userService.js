export const getCustomersInfo = async () => {
  try {
    const result = await window.api.getCustomers();
    return result;
  } catch (error) {
    console.error("Auth service error:", error);
    return { success: false, message: "Something went wrong." };
  }
};

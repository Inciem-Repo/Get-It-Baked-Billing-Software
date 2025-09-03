


export const getProductsInfo = async () => {
  try {
    const result = await window.api.getProducts();
    return result;
  } catch (error) {
    console.error("Auth service error:", error);
    return { success: false, message: "Something went wrong." };
  }
};

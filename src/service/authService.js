export const authBranches = async (authCred) => {
  try {
    const result = await window.api.loginUser(
      authCred.username,
      authCred.password
    );
    return result;
  } catch (error) {
    console.error("Auth service error:", error);
    return { success: false, message: "Something went wrong." };
  }
};

export const getUserInfo = async () => {
  try {
    const result = await window.api.getUser();
    return result;
  } catch (error) {
    console.error("Auth service error:", error);
    return { success: false, message: "Something went wrong." };
  }
};

export const clearUserInfo = async () => {
  try {
    const result = await window.api.clearUser();
    return result;
  } catch (error) {
    console.error("Auth service error:", error);
    return { success: false, message: "Something went wrong." };
  }
};

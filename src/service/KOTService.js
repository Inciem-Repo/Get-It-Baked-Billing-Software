export async function createKot(kotData) {
  try {
    const response = await window.api.addKot(kotData);

    if (!response) {
      throw new Error("No response from main process");
    }

    if (!response.success) {
      throw new Error(response.message || "Failed to create KOT");
    }

    return response.data;
  } catch (error) {
    console.error("KOT Service Error:", error);
    throw error;
  }
}

export async function getKotToken(branchId) {
  try {
    const token = await window.api.generateKOTToken(branchId);
    return token;
  } catch (error) {
    console.error("KOT Service Error:", error);
    throw error;
  }
}

export async function getKotOrders() {
  try {
    return await window.api.getKOTByBranch();
  } catch (error) {
    console.error("KOT Service Error:", error);
    throw error;
  }
}

export const updateKOTStatusService = async (kotId, newStatus) => {
  try {
    const result = await window.api.updateKOTStatus(kotId, newStatus);
    return result;
  } catch (err) {
    console.error("IPC Error:", err);
  }
};
export async function getKOTDetails(token) {
  try {
    const response = await window.api.getKOTDetailsById(token);
    return response;
  } catch (error) {
    console.error("Failed to get KOT details:", error);
    return null;
  }
}

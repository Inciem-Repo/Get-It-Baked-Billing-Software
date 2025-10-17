
export async function createKot(kotData) {
  try {
    const response = await window.api.addKot(kotData);

    if (!response) throw new Error("No response from main process");

    if (!response.success) {
      console.error("🚨 KOT Main Process Error:", response.message);
      console.error("Stack Trace:", response.stack);
      throw new Error(response.message || "Failed to create KOT");
    }

    return response.data;
  } catch (error) {
    console.error("KOT Service Error (Renderer):", error);
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
export async function updateKOTInvoiceID(kotToken, invoiceId) {
  try {
    const response = await window.api.updateKOTInvoiceByToken(
      kotToken,
      invoiceId
    );
    return response;
  } catch (error) {
    console.error("Failed to get KOT details:", error);
    return null;
  }
}

export async function getNewKOTS(kotToken, invoiceId) {
  try {
    const response = await window.api.getLastKot();
    return response;
  } catch (error) {
    console.error("Failed to get KOT details:", error);
    return null;
  }
}

export async function getKotConfig() {
  try {
    const response = await window.api.getKotConfig();
    return response;
  } catch (error) {
    console.error("Failed to fetch KOT configuration:", error);
    return { success: false, message: error.message };
  }
}

export async function insertKotConfig(data) {
  try {
    const response = await window.api.insertKotConfig(data);
    return response;
  } catch (error) {
    console.error("Failed to insert KOT configuration:", error);
    return { success: false, message: error.message };
  }
}

export async function updateKotConfig(data) {
  try {
    const response = await window.api.updateKotConfig(data);
    return response;
  } catch (error) {
    console.error("Failed to update KOT configuration:", error);
    return { success: false, message: error.message };
  }
}

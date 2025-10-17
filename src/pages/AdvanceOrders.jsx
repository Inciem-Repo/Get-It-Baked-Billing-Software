import React, { useState } from "react";
import Report from "../components/Report";
import Header from "../components/layout/Header";
import {
  getAdvanceBillingInfo,
  getAdvanceBillingInfoById,
  saveAdvanceBillingInfo,
  saveAdvanceToBilling,
} from "../service/advanceBillingService";
import { Edit } from "lucide-react";
import ClearAdvanceBillModal from "../components/ClearAdvanceBillModal";
import {
  getBillingInvoice,
  saveBillingInfo,
  updateBillDetails,
} from "../service/billingService";
import { mapBillForPrint } from "../lib/helper";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function AdvanceOrders() {
  const { branchInfo } = useAuth();
  const [selectedBill, setSelectedBill] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const handleViewInvoice = async (billId) => {
    try {
      await getBillingInvoice(billId, branchInfo);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSavePayment = async (type, billInfo) => {
    try {
      const result = await saveAdvanceToBilling(billInfo);
      if (!result.success) {
        toast.success("Something went wrong!");
      }
      setRefreshKey((prev) => prev + 1);
      toast.success("Bill saved successfully");
      switch (type) {
        case "save":
          break;
        case "saveAndPrint": {
          await handleViewInvoice(result.billingIds[0]);
          break;
        }
        default:
          console.warn("Unknown save type:", type);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(" Something went wrong while saving the bill.");
    } finally {
    }
  };

  const handleFetchBillInfo = async (rowId) => {
    // try {
    //   const result = await getAdvanceBillingInfoById(rowId);
    //   setSelectedBill(result.bill);
    //   setIsModalOpen(true);
    //   console.log(result);
    // } catch (error) {
    //   console.log(error);
    // }
    navigate(`/pos?token=${encodeURIComponent(rowId)}&type=advanceOrder`);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen w-full bg-gray-50">
        <Header title={"Advance Orders"} />
        <Report
          title="Advance Billing History"
          enableExport={false}
          refreshKey={refreshKey}
          fetchData={async (page, limit, filters) => {
            const appliedFilters = { ...filters };
            const result = await getAdvanceBillingInfo(
              page,
              limit,
              appliedFilters
            );
            return result;
          }}
          filterOptions={[
            { key: "fromDate", type: "date", label: "From Date" },
            { key: "toDate", type: "date", label: "To Date" },
          ]}
          columns={[
            {
              key: "order_date",
              label: "Order Date",
              render: (row) => row.billdate,
            },
            {
              key: "customer_name",
              label: "Customer Name",
              render: (row) =>
                row.customer_id ? row.customer_name : "Walking Customer",
            },
            {
              key: "customer_mobile",
              label: "Customer Mobile",
              render: (row) => row.customer_mobile || "Not Provided",
            },
            {
              key: "customernote",
              label: "Customer Message",
              render: (row) => row.customernote || "No Message",
            },
            {
              key: "grandTotalf",
              label: "Bill Amount",
              render: (row) => `₹${row.grandTotalf}`,
            },
            {
              key: "advanceamount",
              label: "Advance Amount",
              render: (row) => `₹${row.advanceamount}`,
            },
            {
              key: "balanceAmount",
              label: "Balance Amount",
              render: (row) => `₹${row.balanceAmount}`,
            },
            {
              key: "paymenttype",
              label: "Payment Type",
              render: (row) => `${row.paymenttype}`,
            },
            {
              key: "action",
              label: "Action",
              render: (row) => (
                <button
                  className="text-blue-500 underline"
                  onClick={() => handleFetchBillInfo(row.id)}
                >
                  <Edit />
                </button>
              ),
            },
          ]}
        />
      </div>
      <ClearAdvanceBillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        billData={selectedBill}
        onSave={handleSavePayment}
      />
    </>
  );
}

export default AdvanceOrders;

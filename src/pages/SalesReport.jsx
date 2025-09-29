import React from "react";
import Report from "../components/Report";
import { useAuth } from "../context/AuthContext";
import { getBillingInfo, getBillingInvoice } from "../service/billingService";
import Header from "../components/layout/header";

function SalesReport() {
  const { branchInfo } = useAuth();

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <Header title={"Sales Report"} />
      <Report
        title="Billing History"
        fetchData={async (page, limit, filters) => {
          let appliedFilters = { ...filters };
          if (appliedFilters.paymenttype === "All") {
            delete appliedFilters.paymenttype;
          }

          const response = await getBillingInfo(
            page,
            limit,
            appliedFilters,
            branchInfo
          );
          return response;
        }}
        filterOptions={[
          { key: "fromDate", type: "date", label: "From Date" },
          { key: "toDate", type: "date", label: "To Date" },
          {
            key: "paymenttype",
            type: "dropdown",
            label: "Payment Type",
            options: [
              { value: "All", label: "All" },
              { value: "Cash", label: "Cash" },
              { value: "Online", label: "Online" },
            ],
          },
        ]}
        columns={[
          { key: "invid", label: "Invoice ID" },
          {
            key: "customer_name",
            label: "Customer",
            render: (row) =>
              row.customer_id != 0 ? row.customer_name : "Walking Customer",
          },
          {
            key: "customernote",
            label: "Note",
            render: (row) => row.customernote || "No Note",
          },
          {
            key: "grandTotalf",
            label: "Amount",
            render: (row) => `₹${Number(row.grandTotalf).toFixed(2)}`,
          },
          { key: "billdate", label: "Bill Date" },
        ]}
      />
    </div>
  );
}

export default SalesReport;

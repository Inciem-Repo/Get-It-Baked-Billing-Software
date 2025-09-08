import React, { useEffect, useState } from "react";
import { Calendar, Eye } from "lucide-react";
import Header from "../components/layout/header";
import { getBillingInfo } from "../service/billingService";

const BillingHistory = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeTab, setActiveTab] = useState("online");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [bills, setBills] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    async function fetchBilling() {
      const filters = {
        paymenttype: activeTab === "online" ? "Online" : "Cash",
      };

      if (fromDate) filters.fromDate = fromDate;
      if (toDate) filters.toDate = toDate;

      const response = await getBillingInfo(currentPage, itemsPerPage, {
        paymenttype: activeTab === "online" ? "Online" : "Cash",
        fromDate,
        toDate,
      });
      console.log(response);
      if (response && response.rows) {
        setBills(response.rows);
        setTotalRecords(response.total);
      }
    }
    fetchBilling();
  }, [currentPage, activeTab, fromDate, toDate]);

  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBills = bills;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setShowTypeDropdown(false);
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <Header title={"Billing History"} />
      <div className=" px-6 py-3">
        <div className="flex items-end justify-between">
          <div className="flex items-end space-x-6">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  From Date:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    placeholder="dd-mm-yyyy"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  To Date:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    placeholder="dd-mm-yyyy"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-w-24"
              >
                <span className="capitalize">{activeTab}</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showTypeDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-full">
                  <button
                    onClick={() => {
                      handleTabChange("cash");
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 border-b ${
                      activeTab === "cash"
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    onClick={() => {
                      handleTabChange("online");
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${
                      activeTab === "online"
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    Online
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
                setCurrentPage(1);
              }}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors font-medium"
            >
              Reset
            </button>
          </div>
          <button className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors font-medium">
            Export Report
          </button>
        </div>
      </div>

      <div className="bg-white mx-6 my-4 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-r">
                  No
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-r">
                  Invoice ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-r">
                  Customer Details
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-r">
                  Customer Mobile
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-r">
                  Customer Message
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-r">
                  Bill Amount
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-r">
                  Bill Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentBills.map((bill, index) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-900 border-r">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 border-r font-medium">
                    {bill.invid}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 border-r">
                    {bill.customer_id != 0
                      ? bill.customer_name
                      : "Walking Customer"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 border-r">
                    {bill?.customer_mobile ? bill.customer_mobile : "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 border-r">
                    {bill.customernote || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 border-r font-medium">
                    {Number(bill.grandTotalf).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 border-r">
                    {bill.billdate}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors">
                      View Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {currentBills.length === 0 && bills.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No {activeTab} billing records found.
            </p>
          </div>
        )}

        {/* Pagination */}
        {bills.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, totalRecords)} of{" "}
              {totalRecords} results
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1;

                    if (!showPage && page === 2 && currentPage > 4) {
                      return (
                        <span key={page} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }

                    if (
                      !showPage &&
                      page === totalPages - 1 &&
                      currentPage < totalPages - 3
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }

                    if (!showPage) return null;

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingHistory;

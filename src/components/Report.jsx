import React, { useEffect, useState } from "react";
import Header from "../components/layout/header";
import toast from "react-hot-toast";
import { exportToExcel } from "../lib/helper";

const Report = ({
  fetchData,
  columns = [],
  filterOptions = [],
  enableExport = true,
}) => {
  const [filters, setFilters] = useState({});
  const [showDropdown, setShowDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentPage, filters]);

  async function loadData() {
    const res = await fetchData(currentPage, itemsPerPage, filters);
    if (res) {
      setData(res.rows || []);
      setTotalRecords(res.total || 0);
      setGrandTotal(res.grandTotal || 0);
    }
  }

  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  async function handleExport() {
    try {
      setLoading(true);
      const exportFilters = { ...filters };
      const allData = await fetchData(1, 0, exportFilters);

      const formatted = (allData.rows || []).map((row) => ({
        "Invoice No": row.invid,
        Customer: row.customer_name || "Walking Customer",
        "Phone No": row.customer_mobile || "Not Provided",
        Date: row.billdate,
        "Total Taxable": row.totalTaxableValuef || 0,
        "Total SGST": row.totalIgstf || 0,
        "Total CGST": row.totalCgstf || 0,
        "Total Amount": row.grandTotalf,
        "Payment Type": row.paymenttype,
      }));

      if (formatted.length === 0) {
        toast.error("No bill data to export");
        return;
      }

      await exportToExcel(
        formatted,
        `Bill_Report_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.success("Exported successfully!");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 py-3 flex justify-between items-end">
        <div className="flex space-x-6 items-end">
          {" "}
          {/* Aligns all children to the bottom */}
          {filterOptions.map((f) => (
            <div key={f.key} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                {f.label}
              </label>

              {f.type === "date" && (
                <input
                  type="date"
                  value={filters[f.key] || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, [f.key]: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:ring-2 focus:ring-blue-500"
                />
              )}

              {f.type === "text" && (
                <input
                  type="text"
                  value={filters[f.key] || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, [f.key]: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40 focus:ring-2 focus:ring-blue-500"
                />
              )}

              {f.type === "dropdown" && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setShowDropdown(showDropdown === f.key ? null : f.key)
                    }
                    className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 w-36"
                  >
                    <span>{filters[f.key] || f.label}</span>
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
                  {showDropdown === f.key && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                      {f.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setFilters({ ...filters, [f.key]: opt.value });
                            setShowDropdown(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-50"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <button
            onClick={() => {
              setFilters({});
              setCurrentPage(1);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 self-end"
          >
            Reset
          </button>
        </div>

        {enableExport && (
          <button
            onClick={handleExport}
            disabled={loading}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {loading ? "Exporting..." : "Export Report"}
          </button>
        )}
      </div>
      <div className="bg-white mx-6 my-4 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-r">
                  No
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-r"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={row.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm border-r">
                    {startIndex + index + 1}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-4 text-sm text-gray-900 border-r"
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-100 border-t-2 border-gray-300 px-4 py-4 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">
            Total Records: {totalRecords}
          </span>
          <span className="text-lg font-bold text-green-700">
            ₹{Number(grandTotal || 0).toFixed(2)}
          </span>
        </div>
        {data.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, totalRecords)} of{" "}
              {totalRecords} results
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

              {/* Next button */}
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default Report;

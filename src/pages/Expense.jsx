import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AddExpenseModal from "../components/AddExpenseModal";
import Header from "../components/layout/Header";
import { getAllExpenses } from "../service/expenseService";
import { exportToExcel } from "../lib/helper";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const Expense = () => {
  const { branchInfo } = useAuth();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [expenses, setExpenses] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalToday, setTotalToday] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchExpenses() {
      try {
        setLoading(true);
        const res = await getAllExpenses({
          page: currentPage,
          limit: itemsPerPage,
          fromDate,
          toDate,
          expense_payment: paymentTypeFilter,
        });
        if (cancelled) return;
        const rows = res.rows || [];
        const total = Number(res.total || 0);

        setExpenses(rows);
        setTotalRecords(total);
        setTotalPages(total > 0 ? Math.ceil(total / itemsPerPage) : 1);
        setGrandTotal(Number(res.grandTotal || 0));
        setTotalToday(Number(res.totalToday || 0));

        const pageTotal = rows.reduce(
          (sum, e) => sum + Number(e.amount || 0),
          0
        );
        setTotalAmount(pageTotal);
      } catch (err) {
        console.error("Failed to fetch expenses", err);
        setExpenses([]);
        setTotalRecords(0);
        setTotalPages(1);
        setTotalAmount(0);
        setGrandTotal(0);
      } finally {
        setLoading(false);
      }
    }

    fetchExpenses();
    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    fromDate,
    toDate,
    paymentTypeFilter,
    itemsPerPage,
    showAddExpenseModal,
  ]);

  const handlePaymentTypeChange = (type) => {
    setPaymentTypeFilter(type);
    setCurrentPage(1);
    setShowPaymentDropdown(false);
  };

  const handleAddExpense = async (expenseData) => {
    try {
      const payload = {
        branch_id: branchInfo.id,
        amount: expenseData.amount,
        expense_payment: expenseData.paymentType,
        category_id: expenseData.category,
        remarks: expenseData.remarks,
        date: new Date().toISOString().split("T")[0],
      };

      const result = await window.api.addExpense(payload);
      if (result.success) {
        toast.success("Expense added successfully");
        setExpenses((prev) => [result.data, ...prev]);
      } else {
        toast.error(result.message || "Failed to add expense");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while adding expense ");
    }
  };

  const onFromDateChange = (v) => {
    setFromDate(v);
    setCurrentPage(1);
  };
  const onToDateChange = (v) => {
    setToDate(v);
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + expenses.length, totalRecords);

  async function handleExport() {
    try {
      setLoading(true);

      const allExpenses = await getAllExpenses({
        page: 1,
        limit: 0,
        fromDate,
        toDate,
        expense_payment: paymentTypeFilter,
      });
      const formatted = (allExpenses.rows || []).map((row) => ({
        Date: row.date,
        Category: row.category_name || "",
        Amount: row.amount,
        "Payment Type": row.expense_payment,
        Remarks: row.remarks || "",
      }));

      if (formatted.length === 0) {
        toast.error("No expense data to export");
        return;
      }
      await exportToExcel(
        formatted,
        `Expense_Report_${paymentTypeFilter}.xlsx`
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
    <div className="flex flex-col w-full bg-gray-50">
      <Header title={"Expense Management"} />
      <div className="overflow-auto">
        <div className="px-6 py-3">
          <div className="flex items-end justify-between">
            <div className="flex items-end space-x-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  From Date:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => onFromDateChange(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  To Date:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => onToDateChange(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowPaymentDropdown((s) => !s)}
                  className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-w-24 capitalize"
                >
                  <span>{paymentTypeFilter}</span>
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

                {showPaymentDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-full">
                    {["all", "Cash", "Online"].map((type) => (
                      <button
                        key={type}
                        onClick={() => handlePaymentTypeChange(type)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 border-b ${
                          paymentTypeFilter === type
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setCurrentPage(1);
                  setPaymentTypeFilter("all");
                }}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors font-medium"
              >
                Reset
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors font-medium"
                onClick={() => {
                  handleExport();
                }}
              >
                Export Report
              </button>

              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Expense</span>
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white mx-6 my-4 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-r w-16">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-r min-w-48">
                    Expense Category
                  </th>
                  <th className="px-4 py-3  text-sm font-medium text-gray-600 border-r w-32 text-right">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-r w-32">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-r w-32">
                    Payment Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Remarks
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      Loading...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No expense records found.
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense, index) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900 border-r text-center">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 border-r font-medium">
                        {expense.category_name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 border-r font-medium text-right">
                        ₹{Number(expense.amount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 border-r">
                        {expense.date
                          ? new Date(expense.date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-4 text-sm border-r capitalize">
                        {expense.expense_payment}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {expense.remarks}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-100 border-t-2 border-gray-300">
            <div className="px-4 py-4 flex justify-end items-center">
              <div className="">
                <span className="ml-6 text-sm font-medium text-gray-700 mr-2">
                  Today Expense Total:
                </span>
                <span className="text-lg font-bold text-green-700">
                  ₹{Number(totalToday || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 border-t-2 border-gray-300">
            <div className="px-4 py-4 flex justify-end items-center">
              <div className="">
                <span className="ml-6 text-sm font-medium text-gray-700 mr-2">
                  Grand Total:
                </span>
                <span className="text-lg font-bold text-green-700">
                  ₹{Number(grandTotal || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {totalRecords > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {totalRecords === 0 ? 0 : startIndex + 1} to {endIndex}{" "}
                of {totalRecords} results
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
                          <span
                            key={`dots1-${page}`}
                            className="px-2 text-gray-400"
                          >
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
                          <span
                            key={`dots2-${page}`}
                            className="px-2 text-gray-400"
                          >
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

      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onAddExpense={handleAddExpense}
      />
    </div>
  );
};

export default Expense;

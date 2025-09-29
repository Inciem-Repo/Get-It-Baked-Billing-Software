import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const AddExpenseModal = ({ isOpen, onClose, onAddExpense }) => {
  const [formData, setFormData] = useState({
    category: "",
    paymentType: "cash",
    amount: 0,
    remarks: "",
  });

  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);

  const paymentTypes = [
    { value: "cash", label: "Cash" },
    { value: "online", label: "Online" },
  ];

  useEffect(() => {
    if (isOpen) {
      window.api.getExpenseCategories().then((data) => {
        setCategories(data);
      });
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFormData({
      category: "",
      paymentType: "cash",
      amount: 0,
      remarks: "",
    });
  };

  const handleAdd = () => {
    if (formData.category && formData.amount > 0) {
      onAddExpense(formData);
      handleReset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Add Expense</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {/* Expense Category Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expense Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white"
                >
                  {formData.category
                    ? categories.find((cat) => cat.id === formData.category)
                        ?.name
                    : "Select expense category"}
                </button>

                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            handleInputChange("category", cat.id);
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
                        >
                          {cat.name}
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-gray-500">
                        No categories available
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white capitalize"
                >
                  {formData.paymentType}
                </button>
                {showPaymentDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-lg shadow-lg z-10">
                    {paymentTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          handleInputChange("paymentType", type.value);
                          setShowPaymentDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.amount === null ? "" : formData.amount}
                onFocus={(e) => {
                  if (formData.amount === 0) {
                    handleInputChange("amount", null);
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === "" || isNaN(e.target.value)) {
                    handleInputChange("amount", 0);
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange(
                    "amount",
                    value === "" ? null : parseFloat(value)
                  );
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Enter amount"
                min="0"
                step="0.01"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 resize-none"
                placeholder="Enter remarks (optional)"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Reset
            </button>
            <button
              onClick={handleAdd}
              disabled={!formData.category || formData.amount <= 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;

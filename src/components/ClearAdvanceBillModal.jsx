import React, { useState, useEffect } from "react";
import { X, Edit, Printer, Save, Calculator } from "lucide-react";
import { handleGenerateInvoice } from "../service/billingService";
import { useAuth } from "../context/AuthContext";

const ClearAdvanceBillModal = ({ isOpen, onClose, billData, onSave }) => {
  const { branchInfo } = useAuth();
  const [formData, setFormData] = useState({
    receivedAmount: "",
    paymentType: "Online",
    invoiceNumber: "",
    billDate: "",
  });
  useEffect(() => {
    if (billData) {
      setFormData({
        receivedAmount: billData.balanceAmount || "",
        paymentType: billData.paymenttype || "Online",
        invoiceNumber: billData.invoiceId || "",
        billDate: billData.billdate || new Date().toISOString().split("T")[0],
      });
    }
  }, [billData]);

  useEffect(() => {
    const updateInvoiceNumber = async () => {
      if (isOpen && billData && formData.invoiceNumber === billData.invoiceId) {
        const newInvoiceNumber = await handleGenerateInvoice(
          branchInfo.id,
          formData.paymentType
        );
        setFormData((prev) => ({
          ...prev,
          invoiceNumber: newInvoiceNumber,
        }));
      }
    };

    updateInvoiceNumber();
  }, [
    formData.paymentType,
    isOpen,
    billData,
    formData.invoiceNumber,
    branchInfo.id,
    handleGenerateInvoice,
  ]);
  if (!isOpen || !billData) return null;

  const handleReceivedAmountChange = (e) => {
    const received = parseFloat(e.target.value) || 0;
    const advance = parseFloat(billData.advanceamount) || 0;
    const grandTotal = parseFloat(billData.grandTotalf) || 0;
    const totalPaid = advance + received;
    const change = totalPaid > grandTotal ? totalPaid - grandTotal : 0;

    setFormData({
      ...formData,
      receivedAmount: e.target.value,
      changeAmount: change,
    });
  };

  const handlePaymentTypeChange = async (type) => {
    setFormData({
      ...formData,
      paymentType: type,
      invoiceNumber: await handleGenerateInvoice(branchInfo.id, type),
    });
  };

  const handleInvoiceNumberChange = (e) => {
    setFormData({
      ...formData,
      invoiceNumber: e.target.value,
    });
  };

  const handleDateChange = (e) => {
    setFormData({
      ...formData,
      billDate: e.target.value,
    });
  };

  const handleSave = (type) => {
    const billInfo = {
      id: billData.id,
      invoiceId: formData.invoiceNumber,
      paymenttype: formData.paymentType,
      receivedAmount: parseFloat(formData.receivedAmount) || 0,
    };

    onSave(type, billInfo);
    onClose();
  };

  const totalPaid =
    (parseFloat(billData.advanceamount) || 0) +
    (parseFloat(formData.receivedAmount) || 0);

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center px-6 py-3">
          <h2 className="text-xl font-semibold text-gray-800">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="px-6 py-4">
            <div className="flex gap-4">
              <div className="mb-3 flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.billDate}
                  onChange={handleDateChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="mb-3 flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={handleInvoiceNumberChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter invoice number"
                />
              </div>

              <div className="mb-3 flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={billData.customer_name || "Walking Customer"}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="mb-3 flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Mobile
                </label>
                <input
                  type="text"
                  value={billData.customer_mobile || "Not Provided"}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-6">
            <h3 className="font-semibold text-gray-700 mb-4">Bill Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-700">
                      Item Name
                    </th>
                    <th className="text-center p-3 font-medium text-gray-700">
                      Qty
                    </th>
                    <th className="text-right p-3 font-medium text-gray-700">
                      Unit Price
                    </th>
                    <th className="text-right p-3 font-medium text-gray-700">
                      Total Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {billData.items.map((item, index) => {
                    return (
                      <tr
                        key={item.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="p-3 text-gray-600">
                          {item.product_name}
                        </td>
                        <td className="p-3 text-center text-gray-600">
                          {item.qty}
                        </td>
                        <td className="p-3 text-right text-gray-600">
                          ₹{parseFloat(item.unit_price).toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-gray-600">
                          ₹{parseFloat(item.total_price).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">
                  Payment Details
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-700">
                      Grand Total:
                    </span>
                    <span className="font-bold text-lg text-blue-700">
                      ₹{billData.grandTotalf}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Advance Amount
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`₹${parseFloat(billData.advanceamount || 0)}`}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Received Amount *
                    </label>
                    <input
                      type="number"
                      value={formData.receivedAmount}
                      onChange={handleReceivedAmountChange}
                      placeholder="0.00"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Balance Amount
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={billData.balanceAmount}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">
                  Payment Method
                </h3>

                <div className="flex">
                  {["Online", "Cash", "Split"].map((method) => (
                    <label
                      key={method}
                      className={`flex items-center p-4  cursor-pointer`}
                    >
                      <input
                        type="radio"
                        name="paymentType"
                        value={method}
                        checked={formData.paymentType === method}
                        onChange={() => handlePaymentTypeChange(method)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {method}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Payment Summary */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">
                    Payment Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grand Total:</span>
                      <span className="font-medium">
                        ₹{billData.grandTotalf}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Advance Paid:</span>
                      <span className="font-medium">
                        ₹{billData.advanceamount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Balance Due:</span>
                      <span className="font-medium text-orange-600">
                        ₹{billData.balanceAmount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Now Receiving:</span>
                      <span className="font-medium">
                        ₹{formData.receivedAmount}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-700 font-semibold">
                        Total Paid:
                      </span>
                      <span className="font-semibold text-blue-700">
                        ₹{totalPaid}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => handleSave("saveAndPrint")}
              className="flex items-center gap-2 px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Printer size={18} />
              Print Bill
            </button>

            <button
              onClick={() => handleSave("save")}
              disabled={
                !formData.receivedAmount ||
                parseFloat(formData.receivedAmount) < 0 ||
                !formData.invoiceNumber ||
                !formData.billDate
              }
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} />
              Save Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClearAdvanceBillModal;

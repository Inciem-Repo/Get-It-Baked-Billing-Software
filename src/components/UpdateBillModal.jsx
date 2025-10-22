import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { handleGenerateInvoice } from "../service/billingService";

const UpdateBillModal = ({ isOpen, onClose, invoiceData, onSave }) => {
  const { branchInfo } = useAuth();
  const [formData, setFormData] = useState({
    date: "",
    invoiceNumber: "",
    newInvoiceNumber: "",
    items: [],
    grandTotal: 0,
    paymentMethod: "Cash",
  });

  useEffect(() => {
    if (invoiceData) {
      setFormData({
        date: invoiceData.date || "",
        invoiceNumber: invoiceData.invoiceNumber || "",
        newInvoiceNumber: "",
        items: invoiceData.items || [],
        grandTotal: invoiceData.grandTotal || 0,
        paymentMethod: invoiceData.paymentMethod || "Cash",
      });
    }
  }, [invoiceData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    if (!branchInfo?.id || !formData?.paymentMethod) return;

    const fetchInvoice = async () => {
      try {
        const isSamePayment =
          invoiceData && invoiceData.paymentMethod === formData.paymentMethod;

        if (isSamePayment) {
          setFormData((prev) => ({
            ...prev,
            newInvoiceNumber: "",
          }));
          return;
        }
        const newInvoice = await handleGenerateInvoice(
          branchInfo.id,
          formData.paymentMethod
        );

        setFormData((prev) => ({
          ...prev,
          newInvoiceNumber: newInvoice,
        }));
      } catch (err) {
        console.error("Error generating invoice:", err);
      }
    };

    fetchInvoice();
  }, [formData.paymentMethod, branchInfo?.id]);

  const handleSave = () => {
    const saveData = {
      id: invoiceData?.id,
      paymentMethod: formData.paymentMethod,
      oldInvoiceNumber: formData.invoiceNumber,
      newInvoiceNumber: formData.newInvoiceNumber,
      hasInvoiceChanged: !!formData.newInvoiceNumber,
    };
    onSave(saveData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 rounded-t-lg">
          <h2 className="text-xl font-semibold">Update Payment Method</h2>
        </div>
        <div className="px-6 py-3">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                readOnly
                value={formData.date}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                readOnly
                value={formData.newInvoiceNumber || formData.invoiceNumber}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      Item Name
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      Quantity
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      Amount
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="text"
                          readOnly
                          value={item.name}
                          className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-100"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="number"
                          readOnly
                          value={item.quantity}
                          className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-100"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="number"
                          readOnly
                          value={item.amount}
                          className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-100"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        ₹{(item.total || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grand Total
                </label>
                <input
                  type="number"
                  name="grandTotal"
                  value={formData.grandTotal}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Method
              </label>

              <div className="mb-4 flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Cash"
                    checked={formData.paymentMethod === "Cash"}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Cash
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Online"
                    checked={formData.paymentMethod === "Online"}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Online
                </label>
              </div>
            </div>
          </div>
          {formData.newInvoiceNumber && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Invoice number updated due to payment
                method change From: <strong>{formData.invoiceNumber}</strong> →
                To: <strong>{formData.newInvoiceNumber}</strong>
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Update Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateBillModal;

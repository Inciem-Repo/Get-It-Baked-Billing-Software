import React, { useState, useEffect, useRef } from "react";
import Header from "../components/layout/header";
import { getUserInfo } from "../service/authService";
import { getProductsInfo } from "../service/productsService";
import SearchableDropdown from "../components/common/SearchableDropdown";
import { useReactToPrint } from "react-to-print";
import BillPrint from "./BillPrint";
import { getCustomersInfo } from "../service/userService";
const POS = () => {
  const [items, setItems] = useState([
    {
      id: 1,
      item: "",
      unitPrice: 0,
      quantity: 1,
      unit: "",
      taxableValue: 0,
      cgstRate: 0,
      cgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      total: 0,
    },
  ]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    invoiceNo: "INV-" + Math.floor(Math.random() * 10000),
    customer: "Walking Customer",
    customerNote: "",
    amount: "",
    amountReceived: "",
    balanceToCustomer: "",
    discount: 0,
    advanceAmount: 0,
    paymentType: "",
  });

  useEffect(() => {
    const updatedItems = items.map((item) => {
      const taxableValue = item.unitPrice * item.quantity;
      const cgstAmount = taxableValue * (item.cgstRate / 100);
      const igstAmount = taxableValue * (item.igstRate / 100);
      const total = taxableValue + cgstAmount + igstAmount;

      return {
        ...item,
        taxableValue,
        cgstAmount,
        igstAmount,
        total,
      };
    });

    setItems(updatedItems);
  }, [
    items
      .map(
        (item) =>
          `${item.unitPrice}-${item.quantity}-${item.cgstRate}-${item.igstRate}`
      )
      .join(),
  ]);

  const addNewRow = () => {
    const newItem = {
      id: Date.now(),
      item: "",
      unitPrice: 0,
      quantity: 1,
      unit: "",
      taxableValue: 0,
      cgstRate: 0,
      cgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const removeRow = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const calculateTotals = () => {
    const totalTaxableValue = items.reduce(
      (sum, item) => sum + item.taxableValue,
      0
    );
    const totalCGST = items.reduce((sum, item) => sum + item.cgstAmount, 0);
    const totalIGST = items.reduce((sum, item) => sum + item.igstAmount, 0);
    const grandTotal =
      totalTaxableValue + totalCGST + totalIGST - formData.discount;
    const balanceAmount = grandTotal - formData.advanceAmount;

    return {
      totalTaxableValue,
      totalCGST,
      totalIGST,
      grandTotal,
      balanceAmount,
    };
  };

  const totals = calculateTotals();
  useEffect(() => {
    const getProducts = async () => {
      const result = await getProductsInfo();
      const customers = await getCustomersInfo();
      setProducts(result);
      setCustomers(customers);
    };
    getProducts();
  }, []);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleProductSelect = (id, product) => {
    setItems((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              productId: product.id,
              productName: product.title,
              unitPrice: product.price || 0,
              quantity: row.quantity || 1,
              cgstRate: parseFloat(product.tax) / 2 || 0,
              cgstAmount:
                ((parseFloat(product.tax) / 2) * (product.price || 0)) / 100,
              igstRate: parseFloat(product.tax) || 0,
              igstAmount:
                ((parseFloat(product.tax) || 0) * (product.price || 0)) / 100,
              taxableValue: product.price || 0,
              total: (product.price || 0) * (row.quantity || 1),
              unit: product.unit || "",
            }
          : row
      )
    );
  };

  const [bill, setBill] = useState(null);

  const handlePrint = async (bill) => {
    const success = await window.api.printBill(bill);
    console.log(success);
    if (success) {
      console.log("Bill printed successfully!");
    } else {
      console.error("Failed to print bill.");
    }
  };

  // const handleSave = () => {
  //   const updatedFormData = {
  //     ...formData,
  //     customer: selectedCustomer?.name || formData.customer,
  //     customerId: selectedCustomer?.id || null,
  //     amount: items.reduce((sum, i) => sum + i.total, 0),
  //   };

  //   const newBill = {
  //     ...updatedFormData,
  //     items,
  //   };
  //   console.log(newBill);
  //   setFormData(updatedFormData);
  //   setBill(newBill);
  // };

  // ...

  const handleSave = () => {
    const updatedFormData = {
      ...formData,
      customer: selectedCustomer?.name || formData.customer,
      customerId: selectedCustomer?.id || null,
      amount: items.reduce((sum, i) => sum + i.total, 0),
    };

    const newBill = {
      ...updatedFormData,
      items,
    };
    setFormData(updatedFormData);
    setBill(newBill);
    window.api.openPreview();
  };

  const handleSaveAndPrint = () => {
    const updatedFormData = {
      ...formData,
      customer: selectedCustomer?.name || formData.customer,
      customerId: selectedCustomer?.id || null,
      amount: items.reduce((sum, i) => sum + i.total, 0),
    };

    const newBill = {
      ...updatedFormData,
      items,
    };

    setFormData(updatedFormData);
    setBill(newBill);
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      <div className="bg-white">
        <Header title={"Point of Sales"} />
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 mb-4 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DATE
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              INVOICE NO.
            </label>
            <input
              type="text"
              value={formData.invoiceNo}
              readOnly
              onChange={(e) =>
                setFormData({ ...formData, invoiceNo: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <SearchableDropdown
              items={customers}
              placeholder="Search and select customer..."
              label="Customer"
              shortcut={{ key: "Enter", shift: true }}
              onSelect={handleCustomerSelect}
              value={selectedCustomer}
              labelKey="name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Note
            </label>
            <textarea
              value={formData.customerNote}
              onChange={(e) => {
                setFormData({ ...formData, customerNote: e.target.value });
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden"
              rows={1}
            />
          </div>
        </div>

        <div className="bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sl No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Taxable Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CGST Rate (%)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CGST Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    IGST Rate (%)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    IGST Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-center">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 relative">
                      <div className="relative">
                        <SearchableDropdown
                          items={products}
                          placeholder="Search and select product..."
                          shortcut={{ key: "F1" }}
                          onSelect={(product) =>
                            handleProductSelect(item.id, product)
                          }
                          value={selectedProduct}
                          maxHeight="150px"
                          labelKey="title"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "quantity",
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-center">{item?.unit}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      {item.taxableValue.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.cgstRate.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {item.cgstAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.igstRate.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {item.igstAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-medium">
                      {item.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-1">
                        <button
                          onClick={addNewRow}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          + F2
                        </button>
                        {items.length > 1 && (
                          <button
                            onClick={() => removeRow(item.id)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                          >
                            -
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Received
                  </label>
                  <input
                    type="number"
                    value={formData.amountReceived}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amountReceived: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Balance to Customer
                  </label>
                  <input
                    type="number"
                    value={formData.balanceToCustomer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        balanceToCustomer: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div></div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Total Taxable Value
                  </span>
                  <span className="font-medium">
                    {totals.totalTaxableValue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total CGST</span>
                  <span className="font-medium">
                    {totals.totalCGST.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total IGST</span>
                  <span className="font-medium">
                    {totals.totalIGST.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Discount (%)</span>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                  />
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-3">
                  <span>Grand Total</span>
                  <span>{totals.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Advance Amount</span>
                  <input
                    type="number"
                    value={formData.advanceAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        advanceAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                  />
                </div>
                <div className="flex justify-between font-medium">
                  <span>Balance Amount</span>
                  <span>{totals.balanceAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white border-t border-gray-200 px-6 p-4 sticky bottom-0 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">
              Payment Type * [F4+Enter]
            </span>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 bg-blue-600 text-white"
              value={formData.paymentType}
              onChange={(e) =>
                setFormData({ ...formData, paymentType: e.target.value })
              }
            >
              <option>— Select payment Type —</option>
              <option>Cash</option>
              <option>Card</option>
              <option>UPI</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              onClick={handleSave}
            >
              Save Details
            </button>
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              onClick={handleSaveAndPrint}
            >
              Save & Print
            </button>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Save & List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;

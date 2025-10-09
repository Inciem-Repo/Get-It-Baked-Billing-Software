import React, { useState, useEffect, useRef } from "react";
import Header from "../components/layout/Header";
import { getUserInfo } from "../service/authService";
import { getProductsInfo } from "../service/productsService";
import SearchableDropdown from "../components/common/SearchableDropdown";
import { useReactToPrint } from "react-to-print";
import BillPrint from "./BillPrint";
import { getCustomersInfo } from "../service/userService";
import {
  handleGenerateInvoice,
  saveBillingInfo,
} from "../service/billingService";
import NumberInput from "../components/common/NumberInput";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { mapBillForPrint } from "../lib/helper";
import { useLocation, useNavigate } from "react-router-dom";
import AddCustomerModal from "../components/AddCustomerModal";
import { getKOTDetails } from "../service/KOTService";

const POS = () => {
  const { branchInfo } = useAuth();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const token = params.get("token");
  const navigate = useNavigate();
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
  const [selectedCustomer, setSelectedCustomer] = useState({
    id: 0,
    name: "Walking Customer",
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const paymentSelectRef = useRef(null);
  const [bill, setBill] = useState(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const noteRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    invoiceNo: "",
    customer: "Walking Customer",
    customerNote: "",
    amount: 0,
    amountReceived: 0,
    balanceToCustomer: 0,
    balanceAmount: 0,
    discount: 0,
    advanceAmount: 0,
    paymentType: "",
  });
  const resetBillingForm = async () => {
    setItems([
      {
        id: null,
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
    setFormData({
      date: new Date().toISOString().split("T")[0],
      invoiceNo: await handleGenerateInvoice(
        branchInfo.id,
        formData.paymentType
      ),
      customer: "Walking Customer",
      customerId: 0,
      customerNote: "",
      amount: 0,
      amountReceived: 0,
      balanceToCustomer: 0,
      balanceAmount: 0,
      discount: 0,
      advanceAmount: 0,
      paymentType: "",
      cashAmount: 0,
      onlineAmount: 0,
    });
    setBill(null);
    setSelectedCustomer(null);
    setSelectedCustomer({
      id: 0,
      name: "Walking Customer",
    });
    if (noteRef.current) {
      noteRef.current.style.height = "auto";
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        addNewRow();
      }
      if (e.key === "F3") {
        e.preventDefault();
        handleF3Click();
      }

      // Step 1: F4 focuses the select
      if (e.key === "F4") {
        e.preventDefault();
        if (paymentSelectRef.current) {
          paymentSelectRef.current.focus();
        }
      }
      if (
        e.key === "Enter" &&
        document.activeElement === paymentSelectRef.current
      ) {
        e.preventDefault();
        paymentSelectRef.current.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [items]);
  useEffect(() => {
    const fetchKOTDetails = async () => {
      if (!token) return;

      const res = await getKOTDetails(token);
      if (!res.success) {
        toast.error("Invalid KOT token");
        return;
      }
      const kotDetails = res.data;
      const { customerId, deliveryDate, items = [] } = kotDetails;

      let customer = { id: 0, name: "Walking Customer" };
      if (customerId && customerId !== 0) {
        const res = await window.api.getCustomerById(customerId);
        if (res.success && res.customer) {
          customer = res.customer;
        }
      }

      const mappedItems = items.map((i) => ({
        id: Date.now() + Math.random(),
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unit: i.unit || "",
        unitPrice: i.unitPrice || 0,
        taxableValue: i.taxableValue || 0,
        cgstRate: i.cgstRate || 0,
        cgstAmount: i.cgstAmount || 0,
        igstRate: i.igstRate || 0,
        igstAmount: i.igstAmount || 0,
        total: i.total || 0,
      }));

      setSelectedCustomer(customer);
      setItems(mappedItems);
      setFormData((prev) => ({
        ...prev,
        date: deliveryDate || new Date().toISOString().split("T")[0],
        customer: customer.name,
        customerId: customer.id,
        customerNote: kotDetails.notes || "",
      }));

      toast.success(`Loaded KOT ${kotDetails.kotToken}`);
    };

    fetchKOTDetails();
  }, [token]);

  useEffect(() => {
    const fetchInvoice = async () => {
      const invoice = await handleGenerateInvoice(
        branchInfo.id,
        formData.paymentType
      );
      setFormData((prev) => ({ ...prev, invoiceNo: invoice }));
    };
    fetchInvoice();
  }, [branchInfo.id, formData.paymentType]);
  useEffect(() => {
    const initTotals = calculateTotals();
    setFormData((prev) => ({
      ...prev,
      amount: initTotals.grandTotal,
      advanceAmount: initTotals.grandTotal,
      amountReceived: initTotals.grandTotal,
      balanceToCustomer: 0,
    }));
  }, [items]);
  useEffect(() => {
    const getProducts = async () => {
      const result = await getProductsInfo();
      setProducts(result);
    };
    getProducts();
  }, []);

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
      prev.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = { ...item, [field]: value };

        // Recalculate totals based on quantity change
        const totalTax = updatedItem.cgstRate + updatedItem.igstRate;
        const taxableValue =
          (updatedItem.unitPrice / (1 + totalTax / 100)) * updatedItem.quantity;
        const cgstAmount = (taxableValue * updatedItem.cgstRate) / 100;
        const igstAmount = (taxableValue * updatedItem.igstRate) / 100;
        const total = taxableValue + cgstAmount + igstAmount;

        return { ...updatedItem, taxableValue, cgstAmount, igstAmount, total };
      })
    );
  };
  const handleF3Click = () => {
    setShowAddCustomerModal(true);
  };
  const handleAddCustomer = async (customer) => {
    const payload = {
      ...customer,
      branch_id: branchInfo.id,
    };

    const result = await window.api.addCustomer(payload);
    const res = await window.api.getCustomerById(result.id);

    if (res.success && res.customer) {
      setSelectedCustomer(res.customer);
    }
    if (result.success) {
      toast.success("Customer added ");
    } else {
      toast.error("Failed to add:");
    }
  };

  const calculateTotals = () => {
    const totalTaxableValue = items.reduce(
      (sum, item) => sum + item.taxableValue,
      0
    );
    const totalCGST = items.reduce((sum, item) => sum + item.cgstAmount, 0);
    const totalIGST = items.reduce((sum, item) => sum + item.igstAmount, 0);

    const grossTotal = totalTaxableValue + totalCGST + totalIGST;

    // --- percentage discount ---
    const discountPercent = formData.discount || 0;
    const discountAmount = (grossTotal * discountPercent) / 100;

    const grandTotal = grossTotal;
    const netTotal = grossTotal - discountAmount;

    const advance = formData.advanceAmount || 0;

    let balanceAmount = 0;
    let balanceToCustomer = 0;

    if (advance < grandTotal) {
      balanceAmount = Number((grandTotal - advance).toFixed(2));
    } else if (advance > grandTotal) {
      balanceToCustomer = Number((advance - grandTotal).toFixed(2));
    }

    return {
      totalTaxableValue: Number(totalTaxableValue.toFixed(2)),
      totalCGST: Number(totalCGST.toFixed(2)),
      totalIGST: Number(totalIGST.toFixed(2)),
      grossTotal: Number(grossTotal.toFixed(2)),
      netTotal: Number(netTotal.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      balanceAmount,
      balanceToCustomer,
    };
  };

  const totals = calculateTotals();

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleProductSelect = (id, product) => {
    const totalTax = parseFloat(product.tax) || 0;
    const cgstRate = totalTax / 2;
    const igstRate = totalTax / 2;

    const unitPrice = product.price || 0;
    const taxableValue = unitPrice / (1 + totalTax / 100);

    const cgstAmount = (taxableValue * cgstRate) / 100;
    const igstAmount = (taxableValue * igstRate) / 100;

    const total = taxableValue + cgstAmount + igstAmount;

    setItems((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              productId: product.id,
              productName: product.title,
              unitPrice,
              quantity: row.quantity || 1,
              cgstRate,
              cgstAmount,
              igstRate,
              igstAmount,
              taxableValue,
              total,
              unit: product.unit || "",
            }
          : row
      )
    );
  };

  const handleSave = async (type) => {
    if (!items || items.length === 0 || !items.some((i) => i.productId)) {
      toast.error("⚠️ Please add at least one item before saving.");
      return;
    }
    if (!formData.paymentType) {
      toast.error("⚠️ Please select the payment type.");
      return;
    }
    setSaving(true);

    const updatedFormData = {
      ...formData,
      customer: selectedCustomer?.name || formData.customer,
      customerId: selectedCustomer?.id,
      amount: Number(totals.grandTotal.toFixed(2)),
      advanceAmount: Number(formData.advanceAmount.toFixed(2)),
      amountReceived: Number(formData.amountReceived.toFixed(2)),
      balanceToCustomer: Number(totals.balanceToCustomer.toFixed(2)),
      balanceAmount: Number(totals.balanceAmount.toFixed(2)),
      totalIGST: Number(totals.totalIGST.toFixed(2)),
      totalCGST: Number(totals.totalCGST.toFixed(2)),
      totalTaxableValue: Number(totals.totalTaxableValue.toFixed(2)),
    };

    const newBill = { ...updatedFormData, items };
    setFormData(updatedFormData);
    setBill(newBill);
    try {
      const result = await saveBillingInfo(newBill);
      if (!result.success) {
        toast.error("Error: " + result.error);
        return;
      }

      const savedBill = result.bill;

      switch (type) {
        case "save":
          toast.success("Bill saved successfully");
          resetBillingForm();
          break;

        case "saveAndPrint": {
          const printableBill = mapBillForPrint(savedBill, branchInfo);
          await window.api.openPrintPreview(printableBill);
          resetBillingForm();
          break;
        }

        case "saveAndList":
          toast.success("Bill saved successfully");
          resetBillingForm();
          navigate("/billing-history");
          break;

        default:
          console.warn("Unknown save type:", type);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(" Something went wrong while saving the bill.");
      setSaving(false);
    } finally {
      setSaving(false);
    }
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
            <div className="flex gap-2">
              <SearchableDropdown
                placeholder="Search and select customer..."
                label="Customer"
                shortcut={{ key: "Enter", shift: true }}
                onSelect={handleCustomerSelect}
                value={selectedCustomer}
                labelKey="name"
                searchKeys={["mobile"]}
                fetchItems={async (searchTerm) => {
                  const customers = await getCustomersInfo(searchTerm);
                  console.log(customers);
                  return [{ id: 0, name: "Walking Customer" }, ...customers];
                }}
              />
              <div className="">
                <label className="block p-[10px] text-sm font-medium text-gray-700 mb-1" />
                <button
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:cursor-pointer"
                  onClick={() => handleF3Click()}
                >
                  F3
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Note
            </label>
            <textarea
              value={formData.customerNote}
              ref={noteRef}
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
                          value={
                            item.productName
                              ? { title: item.productName }
                              : null
                          }
                          maxHeight="150px"
                          labelKey="title"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.productName?.toLowerCase() === "customized cake" ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                          value={item.unitPrice || ""}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(
                              /^0+(?=\d)/,
                              ""
                            );
                            updateItem(
                              item.id,
                              "unitPrice",
                              rawValue === "" ? 0 : Number(rawValue)
                            );
                          }}
                        />
                      ) : (
                        item.unitPrice.toFixed(2)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "quantity",
                            Math.max(0, parseInt(e.target.value) || 0)
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
                  <NumberInput
                    value={formData.amount}
                    onChange={(val) =>
                      setFormData({ ...formData, amount: val })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                {formData.paymentType === "Split" && (
                  <div className=" flex gap-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cash Amount
                      </label>
                      <NumberInput
                        value={formData.cashAmount}
                        onChange={(val) => {
                          const cash = Number(val) || 0;
                          const online = Number(formData.onlineAmount) || 0;

                          setFormData({
                            ...formData,
                            cashAmount: cash,
                            amountReceived: cash + online,
                            advanceAmount: cash + online,
                          });
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Online Amount
                      </label>
                      <NumberInput
                        value={formData.onlineAmount}
                        onChange={(val) => {
                          const cash = Number(formData.cashAmount) || 0;
                          const online = Number(val) || 0;

                          setFormData({
                            ...formData,
                            onlineAmount: online,
                            amountReceived: cash + online,
                            advanceAmount: cash + online,
                          });
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Received
                  </label>
                  <NumberInput
                    value={formData.amountReceived}
                    onChange={(val) =>
                      setFormData({ ...formData, amountReceived: val })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Balance to Customer
                  </label>
                  <NumberInput
                    value={totals.balanceToCustomer}
                    onChange={(val) =>
                      setFormData({ ...formData, balanceToCustomer: val })
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
                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total</span>
                  <span>{totals.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Discount (%)</span>
                  <NumberInput
                    value={formData.discount}
                    onChange={(val) =>
                      setFormData({ ...formData, discount: val })
                    }
                    className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                  />
                </div>
                <div className="flex justify-between  border-t font-bold text-lg pt-3">
                  <span>Net Total</span>
                  <span>{totals.netTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Advance Amount</span>
                  <NumberInput
                    value={formData.advanceAmount}
                    onChange={(advance) => {
                      setFormData({
                        ...formData,
                        advanceAmount: advance,
                        amountReceived: advance,
                      });
                    }}
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
              ref={paymentSelectRef}
              onChange={(e) =>
                setFormData({ ...formData, paymentType: e.target.value })
              }
            >
              <option>— Select payment Type —</option>
              <option>Cash</option>
              <option>Online</option>
              {/* <option>Split</option> */}
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              onClick={() => handleSave("save")}
              disabled={saving}
            >
              Save Details
            </button>
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              onClick={() => handleSave("saveAndPrint")}
              disabled={saving}
            >
              Save & Print
            </button>
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              onClick={() => handleSave("saveAndList")}
              disabled={saving}
            >
              Save & List
            </button>
          </div>
        </div>
      </div>
      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onAddCustomer={handleAddCustomer}
      />
    </div>
  );
};

export default POS;

import { useEffect, useState } from "react";
import { Plus, X, Save, ShoppingCart } from "lucide-react";
import Header from "../components/layout/Header";
import SearchableDropdown from "../components/common/SearchableDropdown";
import { getCustomersInfo } from "../service/userService";
import { getProductsInfo } from "../service/productsService";
import { createKot, getKotToken } from "../service/KOTService";
import toast from "react-hot-toast";
import AddCustomerModal from "../components/AddCustomerModal";
import { useAuth } from "../context/AuthContext";

export default function CreateKOT() {
  const [priority, setPriority] = useState("medium");
  const [items, setItems] = useState([]);
  const { branchInfo } = useAuth();
  const [products, setProducts] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [kotToken, setKotToken] = useState("");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState({
    id: 0,
    name: "Walking Customer",
  });
  const today = new Date().toISOString().split("T")[0];
  const [errors, setErrors] = useState({
    deliveryDate: "",
    deliveryTime: "",
    items: "",
  });

  useEffect(() => {
    const getProducts = async () => {
      const result = await getProductsInfo();
      setProducts(result);
      await fetchToken();
    };
    getProducts();
  }, []);
  const fetchToken = async () => {
    const token = await getKotToken();
    setKotToken(token);
  };

  const removeItem = (id) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleProductSelect = (product) => {
    if (!product) return;

    setItems((prevItems) => [
      ...prevItems,
      {
        id: new Date(),
        productId: product.id,
        productName: product.title,
        unitPrice: product.price || 0,
        quantity: 1,
        total: product.price || 0,
      },
    ]);

    setShowSearch(false);
  };

  const updateItemQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity, total: item.unitPrice * quantity }
          : item
      )
    );
  };
  const handleAddCustomer = async (customer) => {
    const payload = {
      ...customer,
      branch_id: branchInfo.id,
    };
    // need a change [return the added customer details no need of getCustomerById]
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
  const updateItemNotes = (id, newNote) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, notes: newNote } : item
      )
    );
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
  };

  const totalAmount = items.reduce((sum, i) => sum + i.total, 0);
  const resetForm = async () => {
    setPriority("medium");
    setItems([]);
    setDeliveryDate("");
    setDeliveryTime("");
    setSelectedCustomer({ id: 0, name: "Walking Customer" });
    setErrors({ deliveryDate: "", deliveryTime: "", items: "" });
  };

  const handleSubmit = async () => {
    let hasError = false;
    const newErrors = { deliveryDate: "", deliveryTime: "", items: "" };

    if (!deliveryDate) {
      newErrors.deliveryDate = "Please select a delivery date.";
      hasError = true;
    }

    if (!deliveryTime) {
      newErrors.deliveryTime = "Please select a delivery time.";
      hasError = true;
    }

    if (items.length === 0) {
      newErrors.items = "Please add at least one order item.";
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) return;

    const kotData = {
      kotToken,
      customer: selectedCustomer,
      priority,
      deliveryDate,
      deliveryTime,
      items,
      totalAmount,
    };
    try {
      await createKot(kotData);
      toast.success("KOT created successfully!");
      resetForm();
      await fetchToken();
    } catch (error) {
      toast.error(error.message || "Failed to create KOT");
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen w-full bg-gray-50">
        <div className="bg-white">
          <Header title={"Create New Kitchen Order"} />
        </div>
        <div className="w-full mx-auto px-4 py-6 overflow-auto">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg shadow-blue-100/50 border border-blue-100/50 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                Order Information
              </h2>

              <div className="grid grid-cols-[minmax(250px,auto)_minmax(250px,auto)_minmax(250px,auto)_minmax(200px,1fr)_minmax(200px,auto)] gap-4 ">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    KOT Token
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={kotToken}
                    onChange={(e) => setKotToken(e.target.value)}
                    placeholder="Enter token number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={today}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 ${
                      errors.deliveryDate
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                  />
                  {errors.deliveryDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.deliveryDate}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    Delivery Time
                  </label>
                  <input
                    type="time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 ${
                      errors.deliveryTime
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                  />
                  {errors.deliveryTime && (
                    <p className="text-red-500 text-sm">
                      {errors.deliveryTime}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 w-full">
                  <SearchableDropdown
                    placeholder="Search and select customer..."
                    label="Customer"
                    shortcut={{ key: "Enter", shift: true }}
                    onSelect={handleCustomerSelect}
                    value={selectedCustomer}
                    labelKey="name"
                    fetchItems={async (searchTerm) => {
                      const customers = await getCustomersInfo(searchTerm);
                      return [
                        { id: 0, name: "Walking Customer" },
                        ...customers,
                      ];
                    }}
                  />
                  <div className="">
                    <label className="block p-[10px] text-sm font-medium text-gray-700 mb-1" />
                    <button
                      className="px-4 py-2 rounded-md bg-blue-600 text-white hover:cursor-pointer"
                      onClick={() => setShowAddCustomerModal(true)}
                    >
                      F3
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100/50 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                  Order Items
                  {items.length > 0 && (
                    <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {items.length}
                    </span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowSearch(!showSearch)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <Plus size={18} />
                  Add Item
                </button>
              </div>

              {showSearch && (
                <SearchableDropdown
                  items={products}
                  placeholder="Search and select product..."
                  shortcut={{ key: "F1" }}
                  onSelect={handleProductSelect}
                  value={null}
                  maxHeight="150px"
                  labelKey="title"
                />
              )}

              <div className="space-y-4 pt-2">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-5 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all group"
                  >
                    <div className="flex items-start gap-4 mb-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.productName || "Select a product"} - ₹
                          {item.unitPrice?.toFixed(2) || "0.00"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                        <button
                          type="button"
                          onClick={() =>
                            updateItemQuantity(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-bold transition-all flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateItemQuantity(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 font-bold transition-all flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={item.notes || ""}
                      onChange={(e) => updateItemNotes(item.id, e.target.value)}
                      placeholder="Add special instructions or notes..."
                      className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm  transition-all"
                    />
                  </div>
                ))}
              </div>

              {items.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    No items added yet
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Click "Add Item" to start your order
                  </p>
                </div>
              )}

              {items.length > 0 && (
                <div className="mt-6 pt-6 border-t-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-700">
                      Order Total - ₹{totalAmount.toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={items.length === 0}
                      className=" py-4 bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg  text-sm px-4 text-white"
                    >
                      <Save size={20} />
                      Create KOT Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="w-full flex justify-end"></div>
        </div>
      </div>
      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onAddCustomer={handleAddCustomer}
      />
    </>
  );
}

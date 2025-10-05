import { useState } from "react";
import {
  Plus,
  X,
  Search,
  Save,
  Clock,
  Calendar,
  ShoppingCart,
  AlertCircle,
  Hash,
} from "lucide-react";
import Header from "../components/layout/Header";

// Mock data
const mockMenuItems = [
  {
    id: "1",
    name: "Margherita Pizza",
    category: "Pizza",
    price: 12.99,
    is_available: true,
  },
  {
    id: "2",
    name: "Caesar Salad",
    category: "Salads",
    price: 8.99,
    is_available: true,
  },
  {
    id: "3",
    name: "Pasta Carbonara",
    category: "Pasta",
    price: 14.99,
    is_available: true,
  },
  {
    id: "4",
    name: "Grilled Salmon",
    category: "Main Course",
    price: 22.99,
    is_available: true,
  },
  {
    id: "5",
    name: "Tiramisu",
    category: "Desserts",
    price: 6.99,
    is_available: true,
  },
];

const mockBranches = [
  { id: "1", name: "Downtown", code: "DT" },
  { id: "2", name: "Uptown", code: "UT" },
  { id: "3", name: "Westside", code: "WS" },
];

const currentUser = { role: "admin", branch_id: "1" };

export default function CreateKOT() {
  const [priority, setPriority] = useState("medium");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(
    currentUser.branch_id || mockBranches[0].id
  );
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [kotToken, setKotToken] = useState("");

  const filteredMenuItems = mockMenuItems.filter(
    (item) =>
      item.is_available &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = (menuItem) => {
    const existingItem = items.find((i) => i.menu_item.id === menuItem.id);
    if (existingItem) {
      setItems(
        items.map((i) =>
          i.id === existingItem.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          id: Math.random().toString(),
          menu_item: menuItem,
          quantity: 1,
          notes: "",
        },
      ]);
    }
    setSearchTerm("");
    setShowSearch(false);
  };

  const removeItem = (id) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItemQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setItems(items.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const updateItemNotes = (id, notes) => {
    setItems(items.map((i) => (i.id === id ? { ...i, notes } : i)));
  };

  const handleSubmit = () => {
    const branch = mockBranches.find((b) => b.id === selectedBranch);
    const kotNumber = `KOT-${branch?.code}-${String(
      Math.floor(Math.random() * 999999)
    ).padStart(6, "0")}`;

    console.log("Creating KOT:", {
      kotNumber,
      kotToken,
      branch_id: selectedBranch,
      priority,
      notes,
      delivery_date: deliveryDate,
      delivery_time: deliveryTime,
      items: items.map((i) => ({
        menu_item_id: i.menu_item.id,
        quantity: i.quantity,
        notes: i.notes,
      })),
    });

    alert(`KOT ${kotNumber} created successfully!`);

    setPriority("medium");
    setNotes("");
    setItems([]);
    setDeliveryDate("");
    setDeliveryTime("");
    setKotToken("");
  };

  const today = new Date().toISOString().split("T")[0];
  const totalAmount = items.reduce(
    (sum, item) => sum + item.menu_item.price * item.quantity,
    0
  );

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      <div className="bg-white">
        <Header title={"Create New Kitchen Order"} />
      </div>
      <div className="w-full mx-auto px-4 py-6 overflow-auto">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg shadow-blue-100/50 border border-blue-100/50 p-8 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
              Order Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  KOT Token
                </label>
                <input
                  type="text"
                  value={kotToken}
                  onChange={(e) => setKotToken(e.target.value)}
                  placeholder="Enter token number"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={today}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  Delivery Time
                </label>
                <input
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Special Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergies, dietary restrictions, table number, or any special requests..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all bg-gray-50 hover:bg-white"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100/50 p-8 backdrop-blur-sm">
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
              <div className="mb-6 relative">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search menu items..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/50"
                    autoFocus
                  />
                </div>

                {searchTerm && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    {filteredMenuItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addItem(item)}
                        className="w-full px-5 py-3 text-left hover:bg-blue-50 transition-all border-b border-gray-100 last:border-b-0 group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                              {item.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {item.category}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-blue-600">
                            ₹{item.price.toFixed(2)}
                          </div>
                        </div>
                      </button>
                    ))}
                    {filteredMenuItems.length === 0 && (
                      <div className="px-5 py-6 text-center text-gray-500 text-sm">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        No items found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
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
                      <div className="flex items-start gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {item.menu_item.name}
                        </h3>
                        <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                          {item.menu_item.category}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-600">
                        ₹{item.menu_item.price.toFixed(2)} × {item.quantity} =
                        <span className="text-blue-600 font-bold ml-1">
                          ₹{(item.menu_item.price * item.quantity).toFixed(2)}
                        </span>
                      </p>
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
                    value={item.notes}
                    onChange={(e) => updateItemNotes(item.id, e.target.value)}
                    placeholder="Special instructions for this item..."
                    className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              ))}
            </div>

            {items.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No items added yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Click "Add Item" to start your order
                </p>
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-6 pt-6 border-t-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-700">
                    Order Total
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="w-full flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={items.length === 0}
              className=" py-4 bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg disabled:transform-none text-sm px-4 text-white"
            >
              <Save size={20} />
              Create KOT Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

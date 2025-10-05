import { useState } from "react";
import {
  Clock,
  Printer,
  ChevronDown,
  ChevronUp,
  Package,
  Flame,
  Timer,
} from "lucide-react";
import Header from "../components/layout/Header";
import { useNavigate } from "react-router-dom";

const mockKOTs = [
  {
    id: "1",
    kotNumber: "KOT-DT-001234",
    tokenNumber: "A-105",
    branch: "Downtown Branch",
    priority: "high",
    createdTime: "10:30 AM",
    deliveryTime: "11:00 AM",
    minutesRemaining: 8,
    status: "in-progress",
    items: [
      { name: "Butter Chicken", quantity: 2, price: 350, notes: "Extra spicy" },
      { name: "Garlic Naan", quantity: 4, price: 40, notes: "" },
      { name: "Dal Makhani", quantity: 1, price: 250, notes: "No cream" },
    ],
    notes: "Extra spicy, no onions. VIP customer.",
    deliveryDate: "2025-10-04",
  },
  {
    id: "2",
    kotNumber: "KOT-DT-001235",
    tokenNumber: "B-23",
    branch: "Downtown Branch",
    priority: "medium",
    createdTime: "10:45 AM",
    deliveryTime: "11:30 AM",
    minutesRemaining: 25,
    status: "pending",
    items: [
      { name: "Chicken Biryani", quantity: 2, price: 280, notes: "Mild spice" },
      { name: "Raita", quantity: 2, price: 50, notes: "" },
      { name: "Garden Salad", quantity: 1, price: 80, notes: "No onions" },
    ],
    notes: "Mild spice level preferred",
    deliveryDate: "2025-10-04",
  },
  {
    id: "3",
    kotNumber: "KOT-UT-001236",
    tokenNumber: "C-47",
    branch: "Uptown Branch",
    priority: "low",
    createdTime: "11:00 AM",
    deliveryTime: "12:00 PM",
    minutesRemaining: 55,
    status: "ready",
    items: [
      { name: "Paneer Tikka", quantity: 1, price: 320, notes: "" },
      { name: "Tandoori Roti", quantity: 3, price: 30, notes: "" },
      { name: "Green Chutney", quantity: 2, price: 20, notes: "" },
    ],
    notes: "",
    deliveryDate: "2025-10-04",
  },
  {
    id: "4",
    kotNumber: "KOT-WS-001237",
    tokenNumber: "A-12",
    branch: "Westside Branch",
    priority: "high",
    createdTime: "11:15 AM",
    deliveryTime: "11:45 AM",
    minutesRemaining: 32,
    status: "pending",
    items: [
      { name: "Masala Dosa", quantity: 2, price: 120, notes: "Extra crispy" },
      { name: "Filter Coffee", quantity: 2, price: 40, notes: "Strong" },
      { name: "Idli Sambar", quantity: 1, price: 80, notes: "" },
    ],
    notes: "Urgent - VIP table",
    deliveryDate: "2025-10-04",
  },
];

const priorityConfig = {
  high: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: Flame,
  },
  medium: {
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: Timer,
  },
  low: {
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: Clock,
  },
};

const statusOptions = [
  "pending",
  "in-progress",
  "ready",
  "served",
  "cancelled",
];

const statusColors = {
  pending: "bg-slate-100 text-slate-700",
  "in-progress": "bg-blue-500 text-white",
  ready: "bg-green-500 text-white",
  served: "bg-purple-500 text-white",
  cancelled: "bg-red-500 text-white",
};

export default function KOTPage() {
  const [kots, setKots] = useState(mockKOTs);
  const [filter, setFilter] = useState("all");
  const [expandedKot, setExpandedKot] = useState(null);
  const navigate = useNavigate();

  const updateKOTStatus = (id, newStatus) => {
    setKots(
      kots.map((kot) => (kot.id === id ? { ...kot, status: newStatus } : kot))
    );
  };

  const printBill = (kot) => {
    console.log("Printing bill for:", kot.kotNumber);
    alert(`Printing bill for ${kot.kotNumber}\nToken: ${kot.tokenNumber}`);
  };

  const toggleAccordion = (kotId) => {
    setExpandedKot(expandedKot === kotId ? null : kotId);
  };

  const getTimeColorClass = (minutesRemaining) => {
    if (minutesRemaining <= 10) return "text-red-600 bg-red-100 border-red-300";
    if (minutesRemaining <= 30)
      return "text-yellow-700 bg-yellow-100 border-yellow-300";
    return "text-green-600 bg-green-100 border-green-300";
  };

  const getCardStyle = (minutesRemaining) => {
    if (minutesRemaining <= 10) return "border-l-8 border-l-red-500";
    if (minutesRemaining <= 30) return "border-l-8 border-l-yellow-500";
    return "border-l-4 border-l-blue-500";
  };

  const filteredKOTs =
    filter === "all" ? kots : kots.filter((kot) => kot.status === filter);

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      <div className="bg-white">
        <Header title={"Kitchen Order Tickets"} />
      </div>
      <div className="w-full mx-auto px-6 py-6 overflow-auto">
        <div className="flex gap-2 mb-6 justify-between overflow-x-auto pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                filter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              All Orders ({kots.length})
            </button>
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all capitalize ${
                  filter === status
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                {status.replace("-", " ")} (
                {kots.filter((k) => k.status === status).length})
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate("/create-kot")}
            className={`px-4 py-2 rounded-lg bg-blue-600 hover:cursor-pointer text-white text-sm font-semibold whitespace-nowrap transition-all`}
          >
            Add KOT
          </button>
        </div>

        <div className="space-y-3">
          {filteredKOTs.map((kot) => {
            const total = calculateTotal(kot.items);
            const PriorityIcon = priorityConfig[kot.priority].icon;
            const isExpanded = expandedKot === kot.id;

            return (
              <div
                key={kot.id}
                className={`bg-white rounded-lg shadow-md transition-all ${getCardStyle(
                  kot.minutesRemaining
                )}`}
              >
                <button
                  onClick={() => toggleAccordion(kot.id)}
                  className="w-full p-5 text-left hover:bg-slate-50 transition-colors rounded-t-lg"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`px-4 py-2 rounded-lg border-2 font-bold text-center ${getTimeColorClass(
                          kot.minutesRemaining
                        )}`}
                      >
                        <div className="text-xl leading-none">
                          {kot.minutesRemaining}
                        </div>
                        <div className="text-xs uppercase tracking-wide mt-1">
                          min
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xl font-bold text-slate-900">
                            {kot.kotNumber}
                          </span>
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded border ${
                              priorityConfig[kot.priority].bg
                            } ${priorityConfig[kot.priority].border}`}
                          >
                            <PriorityIcon
                              className={`w-3 h-3 ${
                                priorityConfig[kot.priority].color
                              }`}
                            />
                            <span
                              className={`text-xs font-bold uppercase ${
                                priorityConfig[kot.priority].color
                              }`}
                            >
                              {kot.priority}
                            </span>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-bold ${
                              statusColors[kot.status]
                            }`}
                          >
                            {kot.status.replace("-", " ").toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-slate-600 font-semibold">
                            {kot.items.length} items
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">
                          ₹{total.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {kot.createdTime} → {kot.deliveryTime}
                        </div>
                      </div>

                      <div className="text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="w-6 h-6" />
                        ) : (
                          <ChevronDown className="w-6 h-6" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 p-6 bg-slate-50">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
                          Order Items
                        </h3>
                        <div className="space-y-2">
                          {kot.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 bg-slate-900 text-white rounded-lg font-bold text-sm flex items-center justify-center flex-shrink-0">
                                  {item.quantity}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-slate-900">
                                    {item.name}
                                  </div>
                                  {item.notes && (
                                    <div className="text-xs text-slate-500 italic mt-0.5">
                                      {item.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="font-bold text-slate-900 ml-4">
                                ₹{item.price * item.quantity}
                              </div>
                            </div>
                          ))}
                        </div>

                        {kot.notes && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">
                              Special Instructions
                            </div>
                            <div className="text-sm text-blue-800">
                              {kot.notes}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                            Update Status
                          </label>
                          <div className="relative">
                            <select
                              value={kot.status}
                              onChange={(e) =>
                                updateKOTStatus(kot.id, e.target.value)
                              }
                              className={`w-full px-4 py-3 rounded-lg font-semibold text-sm appearance-none pr-10 transition-all ${
                                statusColors[kot.status]
                              }`}
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status.replace("-", " ").toUpperCase()}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                            Actions
                          </label>
                          <button
                            onClick={() => printBill(kot)}
                            disabled={
                              kot.status !== "ready" && kot.status !== "served"
                            }
                            className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <Printer className="w-5 h-5" />
                            <span>Print Bill</span>
                          </button>
                        </div>

                        <div className="p-4 bg-white rounded-lg border border-slate-200">
                          <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                            Order Total
                          </div>
                          <div className="text-3xl font-bold text-slate-900">
                            ₹{total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredKOTs.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              No orders found
            </h3>
            <p className="text-slate-600 text-sm">
              No orders match the selected filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

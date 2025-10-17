import { useEffect, useState } from "react";
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
import { getKotOrders, updateKOTStatusService } from "../service/KOTService";
import {
  convertTo12Hour,
  formatDateTimeTo12Hour,
  getDeliveryStatusMessage,
} from "../lib/helper";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

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
const statusOptions = ["pending", "baking", "ready", "cancelled"];
const statusColors = {
  pending: "bg-blue-500 text-white",
  ready: "bg-green-500 text-white",
  baking: "bg-yellow-500 text-white",
  cancelled: "bg-red-500 text-white",
};

export default function KOTPage() {
  const [kots, setKots] = useState([]);
  const [filter, setFilter] = useState("all");
  const [expandedKot, setExpandedKot] = useState(null);
  const navigate = useNavigate();
  const { branchInfo } = useAuth();

  useEffect(() => {
    const fetchKots = async () => {
      try {
        const result = await getKotOrders();
        console.log(result);
        setKots(result);
      } catch (error) {
        console.error("Failed to fetch KOT orders:", error);
      }
    };
    fetchKots();
  }, []);

  const updateKOTStatus = async (kotId, newStatus) => {
    const result = await updateKOTStatusService(kotId, newStatus);
    if (result.success) {
      setKots((prevKots) =>
        prevKots.map((kot) =>
          kot.id === kotId ? { ...kot, status: newStatus } : kot
        )
      );
      toast.success(`KOT status updated to ${newStatus}`);
    } else {
      toast.error.error("Failed to update KOT status");
    }
  };

  const printBill = (kot) => {
    navigate(`/pos?token=${encodeURIComponent(kot.kotToken)}&type=kot`);
  };

  const toggleAccordion = (kotId) => {
    setExpandedKot(expandedKot === kotId ? null : kotId);
  };

  const getCardStyle = (status) => {
    if (!status) return "border-l-4 border-l-gray-300";

    const lower = status.toLowerCase();

    switch (lower) {
      case "pending":
        return "border-l-8 text-blue-500 bg-blue-100  border-l-blue-500";
      case "baking":
        return "border-l-8 text-yellow-500 border-l-yellow-500";
      case "ready":
        return "border-l-8 text-green-500 bg-green-100 border-l-green-500";
      case "cancelled":
        return "border-l-8 text-red-500 bg-red-100 border-l-red-500";
      default:
        return "border-l-4 border-l-gray-300";
    }
  };

  const filteredKOTs =
    filter === "all" ? kots : kots.filter((kot) => kot.status === filter);

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
            const PriorityIcon = priorityConfig[kot.priority].icon;
            const isExpanded = expandedKot === kot.id;
            return (
              <div
                key={kot.kotToken}
                className={`bg-white rounded-lg shadow-md transition-all ${getCardStyle(
                  kot?.status
                )}`}
              >
                <button
                  onClick={() => toggleAccordion(kot.id)}
                  className="w-full p-5 text-left hover:bg-slate-50 transition-colors rounded-t-lg"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`px-4 py-2 rounded-lg border-2 font-bold text-center${getCardStyle(
                          kot?.status
                        )}`}
                      >
                        <div className="text-xl leading-none">
                          {getDeliveryStatusMessage(
                            kot.deliveryDate,
                            kot.deliveryTime,
                            kot.status
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xl font-bold text-slate-900">
                            {kot.kotToken}
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
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-slate-600 font-semibold">
                            {kot.items.length} items
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right flex flex-col gap-2">
                        <div className="text-sm font-semibold text-slate-800">
                          <span
                            className={`px-4 py-1 rounded-full text-sm ${
                              statusColors[kot.status?.toLowerCase()] ||
                              "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {kot.status || "Pending"}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-500 mt-1">
                          {kot.deliveryDate}
                        </div>
                        <div className="text-sm font-bold text-slate-500 flex items-center justify-end gap-1 mt-1">
                          {kot.createdTime} {convertTo12Hour(kot.deliveryTime)}
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
                                    {item.productName}
                                  </div>
                                  {item.notes && (
                                    <div className="text-xs text-slate-500 italic mt-0.5">
                                      {item.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="font-bold text-slate-900 ml-4">
                                ₹{item.total}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
                          Order Details
                        </h3>
                        <div className="p-4 bg-white rounded-lg border border-slate-200 text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-600 font-medium">
                              Invoice No:
                            </span>
                            <span className="text-slate-900 font-semibold">
                              {kot?.invoiceId || "Not yet billed"}
                            </span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-600 font-medium">
                              Customer Name:
                            </span>
                            <span className="text-slate-900 font-semibold">
                              {kot?.customerName || "N/A"}
                            </span>
                          </div>

                          <div className="flex justify-between mb-1">
                            <span className="text-slate-600 font-medium">
                              Phone Number:
                            </span>
                            <span className="text-slate-900">
                              {kot?.customerMobile || "No phone"}
                            </span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-600 font-medium">
                              Order Created at :
                            </span>
                            <span className="text-slate-900">
                              {formatDateTimeTo12Hour(kot?.createdAt) || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-600 font-medium">
                              Order Created By :
                            </span>
                            <span className="text-slate-900">
                              {kot?.createdBy == 1
                                ? "Admin"
                                : branchInfo?.id == kot?.createdBy
                                ? branchInfo.bname
                                : branchInfo.id || "N/A"}
                            </span>
                          </div>

                          <div className="flex justify-between mt-2 border-t border-slate-200 pt-2">
                            <span className="text-slate-600 font-medium">
                              Order Total:
                            </span>
                            <span className="text-slate-900 text-lg font-bold">
                              ₹{kot?.totalAmount || "0.00"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                            Update Status
                          </label>
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
                        </div>

                        <div>
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

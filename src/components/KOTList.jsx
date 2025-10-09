import { Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNewKOTS } from "../service/KOTService";
import { useAuth } from "../context/AuthContext";
import { getDeliveryStatusMessage } from "../lib/helper";

const priorityColors = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const statusColors = {
  pending: "bg-gray-100 text-gray-800 border-gray-200",
  "in-progress": "bg-yellow-100 text-yellow-800 border-yellow-200",
  ready: "bg-green-100 text-green-800 border-green-200",
  served: "bg-blue-100 text-blue-800 border-blue-200",
};

export function KOTList() {
  const navigate = useNavigate();
  const [KOTDatails, setKOTDetails] = useState([]);
  const { branchInfo } = useAuth();
  const fetchLastKot = async () => {
    try {
      const lastKot = await getNewKOTS();
      console.log(lastKot);
      setKOTDetails(lastKot);
      return lastKot;
    } catch (error) {
      console.error("Error fetching last KOT:", error);
      return null;
    }
  };
  useEffect(() => {
    fetchLastKot();
  }, []);
  const getCardStyle = (status, isDelayed = false) => {
    if (isDelayed) return "bg-red-50 border-red-300 animate-pulse";
    if (!status) return "bg-gray-100 border-gray-300";

    switch (status.toLowerCase()) {
      case "pending":
        return "bg-blue-100 border-blue-500";
      case "baking":
        return "bg-yellow-100 border-yellow-500";
      case "ready":
        return "bg-green-100 border-green-500";
      case "cancelled":
        return "bg-red-100 border-red-500";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Ongoing KOTs</h3>
          <button
            onClick={() => navigate("/kot")}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View All KOTs
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-6 h-[400px] overflow-y-auto">
        <div className="space-y-4">
          {KOTDatails.map((kot) => {
            const isDelayed = kot?.minutesElapsed >= 30;
            return (
              <div
                key={kot?.kotToken}
                className={`p-4 border rounded-lg hover:shadow-md transition-all ${getCardStyle(
                  kot?.status
                )}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {kot?.kotToken}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${
                          priorityColors[kot?.priority]
                        }`}
                      >
                        {kot?.priority.toUpperCase()}
                      </span>
                      {isDelayed && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full border bg-red-100 text-red-800 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1 inline" />
                          DELAYED
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {kot?.createdBy == 1
                        ? "Admin"
                        : branchInfo?.id == kot?.createdBy
                        ? branchInfo.bname
                        : branchInfo.id || "N/A"}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        isDelayed
                          ? "text-red-600 font-semibold"
                          : "text-gray-500"
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      {getDeliveryStatusMessage(
                        kot.deliveryDate,
                        kot.deliveryTime,
                        kot.status
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${
                        statusColors[kot?.status]
                      }`}
                    >
                      {kot?.status.replace("-", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-base font-semibold text-gray-900">
                    {kot?.items.map((item) => item.productName).join(", ")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

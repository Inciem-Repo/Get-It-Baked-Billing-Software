import { Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockKOTs = [
  {
    id: "1",
    kotNumber: "KOT-001",
    branch: "Main Branch",
    priority: "high",
    createdTime: "10:30 AM",
    minutesElapsed: 35,
    status: "in-progress",
    items: ["Butter Chicken", "Naan", "Dal Makhani"],
    notes: "Extra spicy, no onions",
  },
  {
    id: "2",
    kotNumber: "KOT-002",
    branch: "Downtown",
    priority: "medium",
    createdTime: "10:45 AM",
    minutesElapsed: 45,
    status: "pending",
    items: ["Biryani", "Raita", "Salad"],
    notes: "Mild spice level",
  },
  {
    id: "3",
    kotNumber: "KOT-003",
    branch: "Main Branch",
    priority: "low",
    createdTime: "11:00 AM",
    minutesElapsed: 15,
    status: "ready",
    items: ["Paneer Tikka", "Tandoori Roti"],
  },
  {
    id: "4",
    kotNumber: "KOT-004",
    branch: "Westside",
    priority: "high",
    createdTime: "11:15 AM",
    minutesElapsed: 32,
    status: "pending",
    items: ["Masala Dosa", "Coffee", "Idli Sambar"],
    notes: "Urgent - VIP table",
  },
];

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
          {mockKOTs.map((kot) => {
            const isDelayed = kot.minutesElapsed >= 30;
            return (
              <div
                key={kot.id}
                className={`p-4 border rounded-lg hover:shadow-md transition-all ${
                  isDelayed
                    ? "border-red-300 bg-red-50 animate-pulse"
                    : "border-gray-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {kot.kotNumber}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${
                          priorityColors[kot.priority]
                        }`}
                      >
                        {kot.priority.toUpperCase()}
                      </span>
                      {isDelayed && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full border bg-red-100 text-red-800 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1 inline" />
                          DELAYED
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{kot.branch}</p>
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
                      {kot.createdTime} ({kot.minutesElapsed} min)
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${
                        statusColors[kot.status]
                      }`}
                    >
                      {kot.status.replace("-", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-base font-semibold text-gray-900">
                    {kot.items.join(", ")}
                  </div>
                  {kot.notes && (
                    <div className="text-sm text-gray-600 italic">
                      <span className="font-medium">Note: </span>
                      {kot.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

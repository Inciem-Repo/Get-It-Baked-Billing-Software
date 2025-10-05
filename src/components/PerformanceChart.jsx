import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatDate } from "../lib/formatDate";

const data = [
  { date: "Mon", amount: 12500 },
  { date: "Tue", amount: 15200 },
  { date: "Wed", amount: 13800 },
  { date: "Thu", amount: 16400 },
  { date: "Fri", amount: 18900 },
  { date: "Sat", amount: 22500 },
  { date: "Sun", amount: 20100 },
];

export function PerformanceChart() {
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
          <div className="relative">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-normal text-gray-700 hover:bg-gray-50">
              <CalendarIcon className="h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {formatDate(dateRange.from, "LLL dd, y")} -{" "}
                    {formatDate(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  formatDate(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Select date range</span>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="p-6 pb-4">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: "#6b7280" }}
            />
            <YAxis className="text-xs" tick={{ fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value) => [`₹${value}`, "Amount"]}
            />
            <Bar
              dataKey="amount"
              fill="#3b82f6"
              name="Amount (₹)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
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
import { getBranchPerformanceSummary } from "../service/billingService";

function formatDateYMD(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function PerformanceChart() {
  const todayStr = formatDateYMD(new Date());
  const last7DaysStr = formatDateYMD(
    new Date(new Date().setDate(new Date().getDate() - 6))
  );

  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: last7DaysStr,
    to: todayStr,
  });

  const fetchPerformance = async (from, to) => {
    try {
      const summary = await getBranchPerformanceSummary(from, to);
      setData(summary);
    } catch (error) {
      console.error("Error fetching performance:", error);
      setData([]);
    }
  };

  // Fetch data whenever dateRange changes
  useEffect(() => {
    fetchPerformance(dateRange.from, dateRange.to);
  }, [dateRange]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const today = formatDateYMD(new Date());
    setDateRange((prev) => ({
      ...prev,
      [name]: value > today ? today : value,
    }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
        <div className="flex items-center gap-2">
          <input
            type="date"
            name="from"
            value={dateRange.from}
            max={todayStr}
            onChange={handleDateChange}
            className="border px-2 py-1 rounded text-sm"
          />
          <span>-</span>
          <input
            type="date"
            name="to"
            value={dateRange.to}
            max={todayStr}
            onChange={handleDateChange}
            className="border px-2 py-1 rounded text-sm"
          />
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

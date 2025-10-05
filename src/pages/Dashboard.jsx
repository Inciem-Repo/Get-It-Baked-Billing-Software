// import { CombinedSummaryCard } from "@/components/CombinedSummaryCard";

import {
  DollarSign,
  Receipt,
  ClipboardList,
  TrendingDown,
  Calendar,
  Users,
} from "lucide-react";
import { PerformanceChart } from "../components/PerformanceChart";
import { KOTList } from "../components/KOTList";
import CombinedSummaryCard from "../components/CombinedSummaryCard";
import Header from "../components/layout/Header";

const Dashboard = () => {
  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      <div className="bg-white">
        <Header title={"Dashboard"} />
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CombinedSummaryCard
              title="Overall Stats"
              primaryLabel="Total Amount"
              primaryValue="₹2,45,890"
              secondaryLabel="Total Bills"
              secondaryValue="1,234"
              icon={DollarSign}
              trend="+12.5%"
              trendUp={true}
            />
            <CombinedSummaryCard
              title="Today's Stats"
              primaryLabel="Amount"
              primaryValue="₹18,500"
              secondaryLabel="Bills"
              secondaryValue="67"
              icon={Calendar}
              trend="+15.3%"
              trendUp={true}
            />
            <CombinedSummaryCard
              title="Today's Expense"
              primaryLabel="Expense"
              primaryValue="₹8,240"
              secondaryLabel="Change"
              secondaryValue="+5.2%"
              icon={TrendingDown}
              trend="+5.2%"
              trendUp={false}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceChart />
            <KOTList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

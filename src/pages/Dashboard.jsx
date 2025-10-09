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
import { useEffect, useState } from "react";
import {
  getBillingSummary,
  getBranchExpenseSummary,
} from "../service/billingService";

const Dashboard = () => {
  const [summaryDetails, setSummaryDetails] = useState();
  const [expenseSummaryDetails, setExpenseSummaryDetails] = useState();
  useEffect(() => {
    const getBranchSummary = async () => {
      try {
        const res = await getBillingSummary();
        const resExpense = await getBranchExpenseSummary();
        setExpenseSummaryDetails(resExpense.data);
        setSummaryDetails(res.data);
      } catch (error) {
        console.log.log(error);
      }
    };
    getBranchSummary();
  }, []);

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
              primaryValue={summaryDetails?.totalGrandTotal}
              secondaryLabel="Total Bills"
              secondaryValue={summaryDetails?.totalBills}
              icon={DollarSign}
            />
            <CombinedSummaryCard
              title="Today's Stats"
              primaryLabel="Amount"
              primaryValue={summaryDetails?.todayGrandTotal}
              secondaryLabel="Bills"
              secondaryValue={summaryDetails?.todayBillCount}
              icon={Calendar}
            />
            <CombinedSummaryCard
              title="Total Expense"
              primaryLabel="Total Expense"
              primaryValue={expenseSummaryDetails?.totalExpense}
              secondaryLabel="Today Expense"
              secondaryValue={expenseSummaryDetails?.todayExpense}
              icon={TrendingDown}
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

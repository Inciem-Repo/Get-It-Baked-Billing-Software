import React, { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import POS from "./pages/POS";
import BillingHistory from "./pages/BillingHistory";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";
import Expense from "./pages/Expense";
import PaymentReport from "./pages/PaymentReport";
import SalesReport from "./pages/SalesReport";
import CreateKOT from "./pages/CreateKOT";
import Dashboard from "./pages/Dashboard";
import KOTPage from "./pages/KOTPage";
import AdvanceOrders from "./pages/AdvanceOrders";

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const { branchInfo, login, logout, loading } = useAuth();
  const location = useLocation();

  const getCurrentView = () => {
    const path = location.pathname.slice(1);
    return path || "dashboard";
  };

  if (loading) return <div>Loading...</div>;

  if (!branchInfo) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activeView={getCurrentView()}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/billing-history" element={<BillingHistory />} />
        <Route path="/expense" element={<Expense />} />
        <Route path="/payment-report" element={<PaymentReport />} />
        <Route path="/sales-report" element={<SalesReport />} />
        <Route path="/create-kot" element={<CreateKOT />} />
        <Route path="/kot" element={<KOTPage />} />
        <Route path="/advance-billing" element={<AdvanceOrders />} />
      </Routes>
    </div>
  );
}

export default App;

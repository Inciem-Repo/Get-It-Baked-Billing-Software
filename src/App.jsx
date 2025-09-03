import React, { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import POS from "./pages/POS";
import BillingHistory from "./pages/BillingHistory";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";

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
        <Route path="/" element={<POS />} />
        <Route path="/billing-history" element={<BillingHistory />} />
      </Routes>
    </div>
  );
}

export default App;

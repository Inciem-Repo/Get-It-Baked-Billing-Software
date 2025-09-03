import React from "react";
import { useNavigate } from "react-router-dom";
import { Package, Receipt, History, Menu } from "lucide-react";
import bakedLogo from "../../assets/images/baked-logo.png";
import { menuItems } from "../../constance/menu";

const Sidebar = ({ activeView, isCollapsed, onToggleCollapse }) => {
  const navigate = useNavigate();

  return (
    <div
      className={`bg-slate-800 text-white transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } min-h-screen flex flex-col`}
    >
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="w-full flex items-center justify-center space-x-2">
              <img src={bakedLogo} alt="baked-log" className="w-25 h-10" />
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-slate-700 rounded"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
      <nav className="flex-1 px-2 py-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => navigate(`/${item.id}`)}
                className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!isCollapsed && (
                  <span className="ml-3 text-sm">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;

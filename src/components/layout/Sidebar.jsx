import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, ChevronDown, ChevronRight } from "lucide-react";
import bakedLogo from "../../assets/images/baked-logo.png";
import { menuItems } from "../../constance/menu.js";
import PrinterSelector from "../PrinterSelector.jsx";

const Sidebar = ({ activeView, isCollapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const [printerDialogOpen, setPrinterDialogOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [appVersion, setAppVersion] = useState("");
  const [updateStatus, setUpdateStatus] = useState("Up to date");
  const [status, setStatus] = useState("Idle");
  const [progress, setProgress] = useState(null);

  const handleMenuClick = (item) => {
    if (item.id === "printer-settings") {
      setPrinterDialogOpen(true);
    } else if (item.children) {
      setExpandedMenus((prev) => ({
        ...prev,
        [item.id]: !prev[item.id],
      }));
    } else {
      navigate(`/${item.id}`);
    }
  };
  useEffect(() => {
    window.api.getAppVersion().then(setAppVersion);

    window.api.onUpdateChecking(() => setStatus("Checking for update..."));
    window.api.onUpdateAvailable(() =>
      setStatus("Update available. Downloading...")
    );
    window.api.onUpdateNotAvailable(() => setStatus("No updates available."));
    window.api.onDownloadProgress((data) => {
      setStatus("Downloading update...");
      setProgress(`${data.percent.toFixed(1)}%`);
    });
    window.api.onUpdateDownloaded(() => setStatus("Update ready to install."));
    window.api.onUpdateError((err) => setStatus(`No update available`));
  }, []);

  const handleCheckUpdate = () => {
    window.api.checkForUpdate();
  };

  const handleRestart = () => {
    window.api.restartApp();
  };

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
            const isExpanded = expandedMenus[item.id];

            return (
              <div key={item.id}>
                <button
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <div className="flex items-center">
                    <Icon
                      size={20}
                      className="flex-shrink-0"
                      onClick={() => {
                        if (item.label === "Reports") {
                          isCollapsed;
                          onToggleCollapse();
                        }
                      }}
                    />
                    {!isCollapsed && (
                      <span className="ml-3 text-sm">{item.label}</span>
                    )}
                  </div>

                  {!isCollapsed && item.children && (
                    <span>
                      {isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </span>
                  )}
                </button>

                {item.children && isExpanded && !isCollapsed && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = activeView === child.id;

                      return (
                        <button
                          key={child.id}
                          onClick={() => navigate(`/${child.id}`)}
                          className={`w-full flex items-center px-3 py-2 text-left rounded-lg text-sm transition-colors ${
                            isChildActive
                              ? "bg-blue-500 text-white"
                              : "text-slate-400 hover:bg-slate-700 hover:text-white"
                          }`}
                        >
                          <ChildIcon size={16} className="flex-shrink-0" />
                          <span className="ml-2">{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      <PrinterSelector
        open={printerDialogOpen}
        onClose={() => setPrinterDialogOpen(false)}
      />
      <div className="p-4 border-t border-slate-700 text-xs text-slate-400">
        {!isCollapsed && (
          <div className="space-y-2">
            <p className="font-semibold">Version {appVersion}</p>
            <p>{status}</p>
            {progress && <p>Progress: {progress}</p>}

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCheckUpdate}
                className="px-2 py-1 border border-slate-500 rounded hover:bg-slate-700"
              >
                Re-check
              </button>

              {status === "Update ready to install." && (
                <button
                  onClick={handleRestart}
                  className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Restart & Install
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

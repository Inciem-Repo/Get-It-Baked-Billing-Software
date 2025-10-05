import React, { useEffect, useRef, useState } from "react";
import Information from "../Information";
import { ChevronDown, ChevronUp, Info, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import SyncStatus from "../common/SyncStatus";
import { syncDetails } from "../../service/billingService";

function Header({ title }) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { branchInfo, logout } = useAuth();
  const [status, setStatus] = useState({ status: "idle", message: "Idle" });
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogOut = async () => {
    await logout();
  };
  const handleSync = () => {
    if (navigator.onLine) {
      setLoading(true);
      setStatus({ status: "loading", message: "Syncing..." });
      syncDetails();
    } else {
      setStatus({ status: "offline", message: "Not connected" });
    }
  };
  useEffect(() => {
    window.api.onSyncStatus((data) => {
      setStatus(data);
      setLoading(false);
    });
  }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        setLoading(true);
        setStatus({ status: "loading", message: "Auto Syncing..." });
        syncDetails();
      } else {
        setStatus({ status: "offline", message: "Not connected" });
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-between px-6 py-4 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          {title == "Point of Sales" && (
            <button
              onClick={() => setShowInfoModal(!showInfoModal)}
              className="p-2 text-blue-600 hover:bg-blue-50 hover:cursor-pointer rounded-full transition-colors"
              title="Information"
            >
              <Info size={20} />
            </button>
          )}
        </div>
        <div className="flex">
          <SyncStatus />
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center space-x-2 border border-gray-300 rounded-lg">
              <span className="text-gray-600 px-4 py-2">
                {branchInfo?.bname}
              </span>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="px-2 py-2 text-gray-600 hover:bg-gray-50 rounded-r-lg transition-colors border-l border-gray-300"
              >
                {showDropdown ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            </div>
            {showDropdown && (
              <div className="absolute right-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                <button
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-gray-600 transition-colors rounded-lg"
                  onClick={handleSync}
                  disabled={loading}
                >
                  {loading && (
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  )}
                  {loading ? "Syncing..." : "Sync Now"}
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors rounded-lg"
                  onClick={handleLogOut}
                >
                  <div className="flex items-center space-x-2">
                    <LogOut size={16} />
                    <span>Logout</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showInfoModal && (
        <Information
          setShowInfoModal={() => setShowInfoModal(!showInfoModal)}
        />
      )}
    </div>
  );
}

export default Header;

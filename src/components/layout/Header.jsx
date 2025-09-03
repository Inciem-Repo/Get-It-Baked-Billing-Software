import React, { useState } from "react";
import Information from "../Information";
import { ChevronDown, ChevronUp, Info, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function Header({ title }) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { branchInfo, login, logout, loading } = useAuth();
  const handleLogOut = async () => {
    await logout();
  };
  return (
    <div className="flex flex-col justify-between px-6 py-4 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <button
            onClick={() => setShowInfoModal(!showInfoModal)}
            className="p-2 text-blue-600 hover:bg-blue-50 hover:cursor-pointer rounded-full transition-colors"
            title="Information"
          >
            <Info size={20} />
          </button>
        </div>
        <div className="relative">
          <div className="flex items-center space-x-2 border border-gray-300 rounded-lg">
            <span className="text-gray-600 px-4 py-2">{branchInfo?.bname}</span>
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
      {showInfoModal && (
        <Information
          setShowInfoModal={() => setShowInfoModal(!showInfoModal)}
        />
      )}
    </div>
  );
}

export default Header;

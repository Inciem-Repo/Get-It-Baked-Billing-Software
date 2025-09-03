import React, { createContext, useContext, useState, useEffect } from "react";
import { clearUserInfo, getUserInfo } from "../service/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [branchInfo, setBranchInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getUserInfo();
        if (user) {
          setBranchInfo(user);
        }
      } catch (err) {
        console.error("Failed to load branch info:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = (branchData) => {
    setBranchInfo(branchData);
  };

  const logout = async () => {
    await clearUserInfo();
    setBranchInfo(null);
  };

  return (
    <AuthContext.Provider value={{ branchInfo, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

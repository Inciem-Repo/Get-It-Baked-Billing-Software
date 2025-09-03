import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import bakedLogo from "../assets/images/baked-logo.png";
import loginBg from "../assets/images/login-bg.jpg";
import { authBranches } from "../service/authService";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resError, setResError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await authBranches({ username, password });
      if (result.success) {
        login(result.user);
      } else {
        setResError(result.message);
      }
    } catch (err) {
      setResError("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${loginBg})`,
          }}
        >
          <div className="absolute inset-0 bg-opacity-40"></div>
        </div>

        <div className="relative z-10 flex items-end justify-center h-full pb-20">
          <div className="text-center text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white font-bold text-lg">5</span>
              </div>
              <span className="text-2xl font-semibold">
                5k+ Satisfied clients
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="w-96 bg-gray-900 flex flex-col">
        <div className="p-8 flex justify-end">
          <div className="w-full flex items-center justify-center space-x-2">
            <img src={bakedLogo} alt="baked-log" className="w-25 h-10" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-semibold text-blue-400 mb-8">
              Welcome Back !
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {resError && (
                <span className="text-red-500 text-sm">{resError}</span>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="user name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 pr-12"
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Log In
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

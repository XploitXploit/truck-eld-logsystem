import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { authAPI } from "../services/authService";
import type { AuthUser } from "../types";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (formData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on initial render
  useEffect(() => {
    const loadStoredAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");
      const storedRefreshToken = localStorage.getItem("refreshToken");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
      }

      setLoading(false);
    };

    loadStoredAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await authAPI.login({ username, password });

      setUser(response.user);
      setToken(response.access);
      setRefreshToken(response.refresh);

      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("token", response.access);
      localStorage.setItem("refreshToken", response.refresh);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  };

  const register = async (formData: any) => {
    setLoading(true);
    try {
      // Make sure we're sending exactly the right format
      console.log("Register form data:", formData);

      // Clone the data to avoid reference issues
      const formDataToSend = { ...formData };

      // Make sure all fields are properly formatted strings
      Object.keys(formDataToSend).forEach((key) => {
        if (formDataToSend[key] === undefined || formDataToSend[key] === null) {
          formDataToSend[key] = "";
        }
      });

      const response = await authAPI.register(formDataToSend);

      console.log("Register response:", response);

      setUser(response.user);
      setToken(response.access);
      setRefreshToken(response.refresh);

      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("token", response.access);
      localStorage.setItem("refreshToken", response.refresh);
    } catch (error: any) {
      console.error("Registration failed:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Attempt to handle specific error cases
      if (error.response?.data) {
        const errorData = error.response.data;
        // Log structured format for debugging
        console.log("Structured error data:", JSON.stringify(errorData, null, 2));
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    refreshToken,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

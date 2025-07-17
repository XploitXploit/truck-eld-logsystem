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

      if (response && response.user && response.access) {
        setUser(response.user);
        setToken(response.access);
        setRefreshToken(response.refresh);

        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.access);
        localStorage.setItem("refreshToken", response.refresh);

        authAPI.setupAuthHeaderForServiceCalls(response.access);

        console.log("Login successful - user authenticated");
      } else {
        console.error("Login response missing expected data:", response);
        throw new Error("Invalid login response");
      }
    } catch (error: any) {
      console.error("Login failed:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Login failed. Please check your credentials and try again.";

      const enhancedError = new Error(errorMessage);
      Object.assign(enhancedError, error);

      throw enhancedError;
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
      console.log("Register form data:", formData);

      const formDataToSend = { ...formData };

      Object.keys(formDataToSend).forEach((key) => {
        if (formDataToSend[key] === undefined || formDataToSend[key] === null) {
          formDataToSend[key] = "";
        }
      });

      const response = await authAPI.register(formDataToSend);

      console.log("Register response:", response);

      if (response && response.user && response.access) {
        setUser(response.user);
        setToken(response.access);
        setRefreshToken(response.refresh);

        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.access);
        localStorage.setItem("refreshToken", response.refresh);

        authAPI.setupAuthHeaderForServiceCalls(response.access);
      } else {
        console.error("Registration response missing expected data:", response);
        throw new Error("Invalid registration response");
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);

      if (error.response?.data) {
        const errorData = error.response.data;
        console.log("Structured error data:", JSON.stringify(errorData, null, 2));
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Registration failed. Please try again.";

      const enhancedError = new Error(errorMessage);
      Object.assign(enhancedError, error);

      throw enhancedError;
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

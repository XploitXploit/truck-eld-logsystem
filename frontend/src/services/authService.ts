import axios from "axios";
import type { AuthResponse, LoginFormData, RegisterFormData } from "../types";
import api from "./api";

const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || "http://localhost:8000"
  : "";

// Create a separate instance for auth calls that don't need the auth token
const authInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor for logging
authInstance.interceptors.request.use(
  (config) => {
    console.log(`Request to ${config.url}:`, config.data);
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  },
);

// Add a response interceptor for logging
authInstance.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    console.error("Response error:", error.message);
    if (error.response) {
      console.error(`Error status: ${error.response.status}`, error.response.data);
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  login: async (credentials: LoginFormData): Promise<AuthResponse> => {
    try {
      const response = await authInstance.post("/api/auth/login/", credentials, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Login response:", response.data);

      // Validate the response contains all required fields
      if (
        !response.data ||
        !response.data.user ||
        !response.data.access ||
        !response.data.refresh
      ) {
        console.error("Login response missing required fields:", response.data);
        throw new Error("Invalid response: Missing authentication data");
      }

      // After successful login, update the default Authorization header for future API calls
      api.defaults.headers.common["Authorization"] = `Bearer ${response.data.access}`;

      return response.data;
    } catch (error: any) {
      console.error("Login error:", error);
      console.error("Error response:", error.response?.data);

      // Create a more informative error message
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please check your credentials.";

      const enhancedError = new Error(errorMessage);
      // Preserve original error properties
      Object.assign(enhancedError, error);

      throw enhancedError;
    }
  },

  register: async (userData: RegisterFormData): Promise<AuthResponse> => {
    try {
      // Clean up any undefined or null values in the data
      const cleanUserData = { ...userData };
      Object.keys(cleanUserData).forEach((key) => {
        // Convert any undefined/null values to empty strings
        if (cleanUserData[key] === undefined || cleanUserData[key] === null) {
          cleanUserData[key] = "";
        }
      });

      console.log("Sending registration data:", JSON.stringify(cleanUserData));
      const response = await authInstance.post("/api/auth/register/", cleanUserData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Registration response:", response.data);

      // Validate the response contains all required fields
      if (
        !response.data ||
        !response.data.user ||
        !response.data.access ||
        !response.data.refresh
      ) {
        console.error("Registration response missing required fields:", response.data);
        throw new Error("Invalid response: Missing authentication data");
      }

      // After successful registration, update the default Authorization header for future API calls
      api.defaults.headers.common["Authorization"] = `Bearer ${response.data.access}`;

      return response.data;
    } catch (error: any) {
      console.error("Registration error:", error);
      console.error("Error response:", error.response?.data);

      // Create a more informative error message
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Registration failed";

      const enhancedError = new Error(errorMessage);
      // Preserve original error properties
      Object.assign(enhancedError, error);

      throw enhancedError;
    }
  },

  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await authInstance.post("/api/auth/token/refresh/", {
      refresh: refreshToken,
    });

    // Update the default Authorization header with the new access token
    if (response.data && response.data.access) {
      api.defaults.headers.common["Authorization"] = `Bearer ${response.data.access}`;
    }

    return response.data;
  },

  // Method to check if the current user session is valid
  verifyToken: async (token: string): Promise<boolean> => {
    try {
      await authInstance.post("/api/auth/token/verify/", { token });
      return true;
    } catch (error) {
      return false;
    }
  },

  // Setup method to configure the API with the stored token
  setupAuthHeaderForServiceCalls: (token: string) => {
    if (token) {
      console.log("Setting up auth header with token");
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn("Removing auth header - no token provided");
      delete api.defaults.headers.common["Authorization"];
    }

    // Verify the header was set properly
    const currentHeader = api.defaults.headers.common["Authorization"];
    console.log("Current Authorization header:", currentHeader ? "Token set" : "No token");
  },
};

export default authAPI;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authAPI } from "../../services/authService";
import type { AuthUser } from "../../types";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token"),
  refreshToken: localStorage.getItem("refreshToken"),
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      console.log("[AuthSlice] Attempting login for user:", username);
      const response = await authAPI.login({ username, password });
      console.log("[AuthSlice] Login successful, received response:", response);

      // Store auth data in localStorage
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("token", response.access);
      localStorage.setItem("refreshToken", response.refresh);
      console.log("[AuthSlice] Stored auth data in localStorage");

      return response;
    } catch (error: any) {
      console.error("[AuthSlice] Login failed:", error);
      return rejectWithValue(error.response?.data || "Login failed");
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (formData: any, { rejectWithValue }) => {
    try {
      console.log("[AuthSlice] Attempting registration with form data:", formData);

      // Clone the data to avoid reference issues
      const formDataToSend = { ...formData };

      // Make sure all fields are properly formatted strings
      Object.keys(formDataToSend).forEach((key) => {
        if (formDataToSend[key] === undefined || formDataToSend[key] === null) {
          formDataToSend[key] = "";
        }
      });
      console.log("[AuthSlice] Processed form data:", formDataToSend);

      const response = await authAPI.register(formDataToSend);
      console.log("[AuthSlice] Registration successful, received response:", response);

      // Store auth data in localStorage
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("token", response.access);
      localStorage.setItem("refreshToken", response.refresh);
      console.log("[AuthSlice] Stored auth data in localStorage");

      return response;
    } catch (error: any) {
      console.error("[AuthSlice] Registration failed:", error);
      return rejectWithValue(error.response?.data || "Registration failed");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      console.log("[AuthSlice] Logging out user");
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;

      // Clear localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      console.log("[AuthSlice] Cleared auth data from localStorage");
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        console.log("[AuthSlice] Login pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log("[AuthSlice] Login fulfilled, setting auth state");
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        console.log("[AuthSlice] Auth state updated, isAuthenticated:", state.isAuthenticated);
      })
      .addCase(login.rejected, (state, action) => {
        console.log("[AuthSlice] Login rejected:", action.payload);
        state.loading = false;
        state.error = (action.payload as string) || "Login failed";
      })
      // Register
      .addCase(register.pending, (state) => {
        console.log("[AuthSlice] Registration pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        console.log("[AuthSlice] Registration fulfilled, setting auth state");
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        console.log("[AuthSlice] Auth state updated, isAuthenticated:", state.isAuthenticated);
      })
      .addCase(register.rejected, (state, action) => {
        console.log("[AuthSlice] Registration rejected:", action.payload);
        state.loading = false;
        state.error = (action.payload as string) || "Registration failed";
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

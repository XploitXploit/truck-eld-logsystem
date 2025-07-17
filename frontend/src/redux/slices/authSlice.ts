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
      const response = await authAPI.login({ username, password });

      // Store auth data in localStorage
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("token", response.access);
      localStorage.setItem("refreshToken", response.refresh);

      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Login failed");
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (formData: any, { rejectWithValue }) => {
    try {
      // Clone the data to avoid reference issues
      const formDataToSend = { ...formData };

      // Make sure all fields are properly formatted strings
      Object.keys(formDataToSend).forEach((key) => {
        if (formDataToSend[key] === undefined || formDataToSend[key] === null) {
          formDataToSend[key] = "";
        }
      });

      const response = await authAPI.register(formDataToSend);

      // Store auth data in localStorage
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("token", response.access);
      localStorage.setItem("refreshToken", response.refresh);

      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Registration failed");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;

      // Clear localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Login failed";
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Registration failed";
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

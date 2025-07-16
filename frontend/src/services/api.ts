import axios from "axios";
import type { TripData, TripFormData } from "../types";

const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || "http://localhost:8000"
  : "";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Token will be added automatically via defaults.headers set in authService
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - token might be expired
      console.error("Authentication error:", error.response.data);
      // Could trigger token refresh here or redirect to login
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        // Import needs to be done here to avoid circular dependency
        import("./authService").then(({ authAPI }) => {
          authAPI.refreshToken(refreshToken).catch(() => {
            // If refresh fails, redirect to login
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            window.location.href = "/login";
          });
        });
      } else {
        // No refresh token, redirect to login
        window.location.href = "/login";
      }
    } else if (error.response?.status === 500) {
      console.error("Server error:", error.response.data);
    }
    return Promise.reject(error);
  },
);

export const tripAPI = {
  planTrip: async (tripData: TripFormData): Promise<TripData> => {
    const response = await api.post("/api/plan-trip/", tripData);
    return normalizeResponseData(response.data);
  },

  getTrip: async (tripId: number): Promise<TripData> => {
    console.log("API: Fetching trip with ID:", tripId);
    const response = await api.get(`/api/trip/${tripId}/`);
    console.log("API: Raw server response:", response.data);
    const normalizedData = normalizeResponseData(response.data);
    console.log("API: Normalized trip data:", normalizedData);
    return normalizedData;
  },
};

export default api;

// Helper function to normalize response data and ensure all required fields exist
function normalizeResponseData(data: any): TripData {
  // Ensure summary exists with default values
  if (!data.summary) {
    data.summary = {
      total_days: data.eld_logs?.length || 0,
      total_driving_time: 0,
      total_duty_time: 0,
      compliant: true,
    };
  }

  // Ensure violations array exists
  if (!data.violations) {
    data.violations = [];
  }

  // Ensure fuel_stops_required exists
  if (data.fuel_stops_required === undefined) {
    data.fuel_stops_required = data.total_distance ? Math.floor(data.total_distance / 500) : 0;
  }

  // Log the ID field for debugging
  console.log("API: Normalizing data with ID fields:", {
    id: data.id,
    trip_id: data.trip_id,
  });

  // Ensure all expected properties exist
  return {
    trip_id: data.id || data.trip_id || 0,
    current_location: data.current_location || "",
    pickup_location: data.pickup_location || "",
    dropoff_location: data.dropoff_location || "",
    current_cycle_hours: data.current_cycle_hours || 0,
    total_distance: data.total_distance || 0,
    total_duration: data.total_duration || 0,
    route_geometry: data.route_geometry || null,
    eld_logs: data.eld_logs || [],
    eld_grids: data.eld_grids || [],
    created_at: data.created_at || new Date().toISOString(),
    fuel_stops_required: data.fuel_stops_required || 0,
    violations: data.violations || [],
    summary: {
      total_days: data.summary?.total_days || 0,
      total_driving_time: data.summary?.total_driving_time || 0,
      total_duty_time: data.summary?.total_duty_time || 0,
      compliant: data.summary?.compliant ?? true,
    },
  };
}

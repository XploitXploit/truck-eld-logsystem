import axios from "axios";
import type { TripFormData } from "../types";
import api from "./api";

// Get the API base URL from environment variables
const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || "http://localhost:8000"
  : "";

// Create an axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token in requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const tripAPI = {
  // Get all trips for the current user
  getTrips: async () => {
    try {
      const response = await apiClient.get("/api/trips/");
      return response.data;
    } catch (error) {
      console.error("Error fetching trips:", error);
      throw error;
    }
  },

  // Get a specific trip by ID
  getTripById: async (tripId: string) => {
    try {
      const response = await apiClient.get(`/api/trips/${tripId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching trip ${tripId}:`, error);
      throw error;
    }
  },

  // Create a new trip
  createTrip: async (tripData: TripFormData) => {
    try {
      const response = await apiClient.post("/api/trips/", tripData);
      return response.data;
    } catch (error) {
      console.error("Error creating trip:", error);
      throw error;
    }
  },

  // Update an existing trip
  updateTrip: async (tripId: string, tripData: Partial<any>) => {
    try {
      const response = await apiClient.patch(`/api/trips/${tripId}/`, tripData);
      return response.data;
    } catch (error) {
      console.error(`Error updating trip ${tripId}:`, error);
      throw error;
    }
  },

  // Delete a trip
  deleteTrip: async (tripId: string) => {
    try {
      await apiClient.delete(`/api/trips/${tripId}/`);
      return true;
    } catch (error) {
      console.error(`Error deleting trip ${tripId}:`, error);
      throw error;
    }
  },

  // Plan a trip (used in TripPlanner)
  planTrip: async (formData: TripFormData) => {
    try {
      // Use the api from api.ts which has the auth token set
      const response = await api.post("/api/plan-trip/", formData);
      return response.data;
    } catch (error) {
      console.error("Error planning trip:", error);
      throw error;
    }
  },

  // Get a trip for display (used in TripResults)
  getTrip: async (tripId: number) => {
    try {
      // Use the api from api.ts which has the auth token set
      const response = await api.get(`/api/trip/${tripId}/`);

      // If the response includes a trip_id, use that directly
      if (response.data && typeof response.data === "object") {
        // Ensure the trip has an id property
        if (response.data.trip_id && !response.data.id) {
          response.data.id = response.data.trip_id;
        } else if (response.data.id && !response.data.trip_id) {
          response.data.trip_id = response.data.id;
        }
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching trip ${tripId}:`, error);
      throw error;
    }
  },
};

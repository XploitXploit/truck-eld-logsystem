import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { tripAPI } from "../../services/tripService";
import type { TripData, TripFormData } from "../../types";

// Define types for Trip data
interface Stop {
  id: string;
  location: string;
  address: string;
  coordinates: [number, number]; // [latitude, longitude]
  arrivalTime?: string;
  departureTime?: string;
  stopType: "pickup" | "delivery" | "rest";
  notes?: string;
}

interface Trip {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: "planned" | "active" | "completed" | "cancelled";
  stops: Stop[];
  distance?: number;
  estimatedTime?: number;
  driver?: string;
  vehicle?: string;
  createdAt: string;
  updatedAt: string;
}

// Using TripFormData and TripData interfaces from types

interface TripsState {
  trips: Trip[];
  currentTrip: Trip | null;
  loading: boolean;
  error: string | null;
  plannerFormData: TripFormData | null;
}

const initialState: TripsState = {
  trips: [],
  currentTrip: null,
  loading: false,
  error: null,
  plannerFormData: null,
};

// Async thunks for API calls
export const fetchTrips = createAsyncThunk("trips/fetchTrips", async (_, { rejectWithValue }) => {
  try {
    const trips = await tripAPI.getTrips();
    // Ensure all trips have consistent ID format for Redux state
    if (Array.isArray(trips)) {
      return trips.map((trip) => {
        const updatedTrip = { ...trip };

        if (trip.trip_id && !trip.id) {
          updatedTrip.id = String(trip.trip_id);
        } else if (trip.id && typeof trip.id === "number") {
          updatedTrip.id = String(trip.id);
        }

        // Make sure trip_id is also set for consistency
        if (updatedTrip.id && !updatedTrip.trip_id) {
          updatedTrip.trip_id = updatedTrip.id;
        }

        return updatedTrip;
      });
    }
    return trips;
  } catch (error) {
    const axiosError = error as AxiosError;
    return rejectWithValue(axiosError.response?.data || "Failed to fetch trips");
  }
});

export const fetchTripById = createAsyncThunk(
  "trips/fetchTripById",
  async (tripId: string, { rejectWithValue }) => {
    try {
      // Ensure the ID is in the correct format the API expects
      return await tripAPI.getTripById(tripId);
    } catch (error) {
      const axiosError = error as AxiosError;
      return rejectWithValue(axiosError.response?.data || "Failed to fetch trip");
    }
  },
);

export const addNewTrip = createAsyncThunk(
  "trips/addNewTrip",
  async (tripData: TripFormData, { rejectWithValue }) => {
    try {
      const result = await tripAPI.createTrip(tripData);
      // Ensure consistent ID format for Redux state
      if (result && typeof result === "object") {
        if (result.trip_id && !result.id) {
          result.id = String(result.trip_id);
        } else if (result.id && typeof result.id === "number") {
          result.id = String(result.id);
        }
        // Make sure trip_id is also set for consistency
        if (result.id && !result.trip_id) {
          result.trip_id = result.id;
        }
      }
      return result;
    } catch (error) {
      const axiosError = error as AxiosError;
      return rejectWithValue(axiosError.response?.data || "Failed to create trip");
    }
  },
);

export const modifyTrip = createAsyncThunk(
  "trips/modifyTrip",
  async (
    { tripId, tripData }: { tripId: string; tripData: Partial<TripData> },
    { rejectWithValue },
  ) => {
    try {
      // Convert data if needed for the API
      const result = await tripAPI.updateTrip(tripId, tripData);
      // Ensure returned data has consistent ID format
      if (result && typeof result === "object") {
        if (result.trip_id && !result.id) {
          result.id = String(result.trip_id);
        } else if (result.id && typeof result.id === "number") {
          result.id = String(result.id);
        }
        // Make sure trip_id is also set for consistency
        if (result.id && !result.trip_id) {
          result.trip_id = result.id;
        }
      }
      return result;
    } catch (error) {
      const axiosError = error as AxiosError;
      return rejectWithValue(axiosError.response?.data || "Failed to update trip");
    }
  },
);

export const removeTrip = createAsyncThunk(
  "trips/removeTrip",
  async (tripId: string, { rejectWithValue }) => {
    try {
      await tripAPI.deleteTrip(tripId);
      return tripId; // Return the tripId on successful deletion for reducer usage
    } catch (error) {
      const axiosError = error as AxiosError;
      return rejectWithValue(axiosError.response?.data || "Failed to delete trip");
    }
  },
);

export const planTrip = createAsyncThunk(
  "trips/planTrip",
  async (formData: TripFormData, { rejectWithValue }) => {
    try {
      return await tripAPI.planTrip(formData);
    } catch (error) {
      const axiosError = error as AxiosError;
      return rejectWithValue(axiosError.response?.data || "Failed to plan trip");
    }
  },
);

export const getTrip = createAsyncThunk(
  "trips/getTrip",
  async (tripId: number, { rejectWithValue }) => {
    try {
      const result = await tripAPI.getTrip(tripId);
      // Ensure consistent ID format for Redux state
      if (result && typeof result === "object") {
        if (result.trip_id && !result.id) {
          result.id = String(result.trip_id);
        } else if (result.id && typeof result.id === "number") {
          result.id = String(result.id);
        }
        // Make sure trip_id is also set for consistency
        if (result.id && !result.trip_id) {
          result.trip_id = result.id;
        }
      }
      return result;
    } catch (error) {
      const axiosError = error as AxiosError;
      return rejectWithValue(axiosError.response?.data || "Failed to get trip");
    }
  },
);

const tripSlice = createSlice({
  name: "trips",
  initialState,
  reducers: {
    updatePlannerFormData: (state, action) => {
      state.plannerFormData = {
        ...state.plannerFormData,
        ...action.payload,
      };
    },
    resetPlannerFormData: (state) => {
      state.plannerFormData = null;
    },
    clearTripError: (state) => {
      state.error = null;
    },
    setCurrentTrip: (state, action) => {
      state.currentTrip = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.trips = action.payload;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTripById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTripById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTrip = action.payload;
      })
      .addCase(fetchTripById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addNewTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNewTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.trips.push(action.payload);
        state.currentTrip = action.payload;
      })
      .addCase(addNewTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(modifyTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(modifyTrip.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.trips.findIndex((trip) => trip.id === action.payload.id);
        if (index !== -1) {
          state.trips[index] = action.payload;
        }
        if (state.currentTrip?.id === action.payload.id) {
          state.currentTrip = action.payload;
        }
      })
      .addCase(modifyTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(removeTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.trips = state.trips.filter((trip) => trip.id !== action.payload);
        if (state.currentTrip?.id === action.payload) {
          state.currentTrip = null;
        }
      })
      .addCase(removeTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(planTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(planTrip.fulfilled, (state, action) => {
        state.loading = false;
        // Don't add to trips array as this is a planning step
        // Ensure consistent ID format in Redux state
        if (action.payload && typeof action.payload === "object") {
          if (action.payload.trip_id && !action.payload.id) {
            action.payload.id = String(action.payload.trip_id);
          } else if (action.payload.id && typeof action.payload.id === "number") {
            action.payload.id = String(action.payload.id);
          }
          // Make sure trip_id is also set for consistency
          if (action.payload.id && !action.payload.trip_id) {
            action.payload.trip_id = action.payload.id;
          }
        }
        state.currentTrip = action.payload;
      })
      .addCase(planTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTrip.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure consistent ID format in Redux state
        if (action.payload && typeof action.payload === "object") {
          if (action.payload.trip_id && !action.payload.id) {
            action.payload.id = String(action.payload.trip_id);
          } else if (action.payload.id && typeof action.payload.id === "number") {
            action.payload.id = String(action.payload.id);
          }
        }
        state.currentTrip = action.payload;
      })
      .addCase(getTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updatePlannerFormData, resetPlannerFormData, clearTripError, setCurrentTrip } =
  tripSlice.actions;

export default tripSlice.reducer;

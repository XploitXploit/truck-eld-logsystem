import { configureStore } from "@reduxjs/toolkit";
import axios from "axios";
import type { TypedUseSelectorHook } from "react-redux";
import { useDispatch, useSelector } from "react-redux";
import authReducer from "./slices/authSlice";
import tripReducer from "./slices/tripSlice";
import uiReducer from "./slices/uiSlice";

const updateAxiosTokenMiddleware = (storeAPI) => (next) => (action) => {
  const result = next(action);
  const state = storeAPI.getState();
  const token = state.auth.token;
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
  return result;
};

export const store = configureStore({
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(updateAxiosTokenMiddleware),
  reducer: {
    auth: authReducer,
    trips: tripReducer,
    ui: uiReducer,
  },
  // Add middleware here if needed
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

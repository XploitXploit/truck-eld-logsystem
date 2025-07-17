import { createSlice } from "@reduxjs/toolkit";

interface UIState {
  globalLoading: boolean;
  globalError: string | null;
  modalStates: {
    [key: string]: boolean;
  };
  toast: {
    message: string | null;
    type: "success" | "error" | "info" | "warning" | null;
    isVisible: boolean;
  };
  filterSettings: {
    dateRange: {
      start: string | null;
      end: string | null;
    };
    sortBy: string | null;
    filterBy: {
      [key: string]: any;
    };
  };
}

const initialState: UIState = {
  globalLoading: false,
  globalError: null,
  modalStates: {},
  toast: {
    message: null,
    type: null,
    isVisible: false,
  },
  filterSettings: {
    dateRange: {
      start: null,
      end: null,
    },
    sortBy: null,
    filterBy: {},
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    setGlobalError: (state, action) => {
      state.globalError = action.payload;
    },
    clearGlobalError: (state) => {
      state.globalError = null;
    },
    setModalState: (state, action) => {
      const { modalId, isOpen } = action.payload;
      state.modalStates[modalId] = isOpen;
    },
    showToast: (state, action) => {
      state.toast = {
        message: action.payload.message,
        type: action.payload.type,
        isVisible: true,
      };
    },
    hideToast: (state) => {
      state.toast.isVisible = false;
    },
    clearToast: (state) => {
      state.toast = {
        message: null,
        type: null,
        isVisible: false,
      };
    },
    setDateRange: (state, action) => {
      state.filterSettings.dateRange = action.payload;
    },
    setSortBy: (state, action) => {
      state.filterSettings.sortBy = action.payload;
    },
    setFilterBy: (state, action) => {
      state.filterSettings.filterBy = action.payload;
    },
    resetFilters: (state) => {
      state.filterSettings = initialState.filterSettings;
    },
  },
});

export const {
  setGlobalLoading,
  setGlobalError,
  clearGlobalError,
  setModalState,
  showToast,
  hideToast,
  clearToast,
  setDateRange,
  setSortBy,
  setFilterBy,
  resetFilters
} = uiSlice.actions;

export default uiSlice.reducer;

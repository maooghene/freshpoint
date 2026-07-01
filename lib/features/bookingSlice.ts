import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SelectedService {
  id: string;
  name: string;
  price: number;
  duration: number;
  image: string | null;
}

interface BookingState {
  businessId: string | null;
  businessName: string | null;
  selectedService: SelectedService | null;
  bookingTime: string | null; // Stores the ISO string datetime slot
  staffId: string | null; // Added parameter support for your specialist tracker

  // Live aggregated notification metric field properties
  upcomingCount: number;
}

const initialState: BookingState = {
  businessId: null,
  businessName: null,
  selectedService: null,
  bookingTime: null,
  staffId: null,
  upcomingCount: 0, // Default baseline initialization counter
};

const bookingSlice = createSlice({
  name: "bookingSlice",
  initialState,
  reducers: {
    // Maps business profiles explicitly and handles core item properties
    selectService: (
      state,
      action: PayloadAction<{
        businessId: string;
        businessName: string;
        service: SelectedService;
      }>,
    ) => {
      state.businessId = action.payload.businessId;
      state.businessName = action.payload.businessName;
      state.selectedService = action.payload.service;
    },

    // Formally registers the named action needed by BookingConfirmPage
    setBookingTime: (state, action: PayloadAction<string>) => {
      state.bookingTime = action.payload;
    },

    // Allows saving everything simultaneously from the booking page
    setCompleteBooking: (
      state,
      action: PayloadAction<{
        businessId: string;
        businessName: string;
        selectedService: SelectedService;
        bookingTime: string;
        staffId: string | null;
      }>,
    ) => {
      state.businessId = action.payload.businessId;
      state.businessName = action.payload.businessName;
      state.selectedService = action.payload.selectedService;
      state.bookingTime = action.payload.bookingTime;
      state.staffId = action.payload.staffId;
    },

    // Notification reducers to manage active live dashboard metrics
    setBookingCount: (state, action: PayloadAction<number>) => {
      state.upcomingCount = action.payload;
    },

    incrementBookingCount: (state) => {
      state.upcomingCount += 1;
    },

    clearBookingFlow: (state) => {
      state.businessId = null;
      state.businessName = null;
      state.selectedService = null;
      state.bookingTime = null;
      state.staffId = null;
      // We deliberately DO NOT wipe upcomingCount here so the Navbar stays hydrated
    },
  },
});

export const {
  selectService,
  setBookingTime,
  setCompleteBooking,
  setBookingCount,
  incrementBookingCount,
  clearBookingFlow,
} = bookingSlice.actions;

export default bookingSlice.reducer;

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
}

const initialState: BookingState = {
  businessId: null,
  businessName: null,
  selectedService: null,
  bookingTime: null,
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    // FIXED: Maps business profiles explicitly and handles core item properties
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

    // FIXED: Formally registers the named action needed by BookingConfirmPage
    setBookingTime: (state, action: PayloadAction<string>) => {
      state.bookingTime = action.payload;
    },

    clearBookingFlow: (state) => {
      state.businessId = null;
      state.businessName = null;
      state.selectedService = null;
      state.bookingTime = null;
    },
  },
});

// Structural selectors typed safely using local configuration interfaces
export const selectActiveBooking = (state: { booking: BookingState }) =>
  state.booking;

export const { selectService, setBookingTime, clearBookingFlow } =
  bookingSlice.actions;
export default bookingSlice.reducer;

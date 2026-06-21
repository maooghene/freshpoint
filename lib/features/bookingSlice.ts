import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../store";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type LocationType = "IN_SHOP" | "MOBILE";

export interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  locationType: LocationType;
  notes: string | null;
  paymentReference: string | null;
  paymentStatus: string | null;
  totalAmount: number | null;
  addressId: string | null;
  businessId: string;
  itemId: string;
  userId: string;
  staffId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiErrorResponse {
  message: string;
}

interface BookingState {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  bookings: [],
  loading: false,
  error: null,
};

export const fetchUserBookings = createAsyncThunk<
  Booking[],
  void,
  { rejectValue: string }
>("booking/fetchUserBookings", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get<Booking[]>("/api/bookings");
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch bookings",
    );
  }
});

export const createBooking = createAsyncThunk<
  Booking,
  Omit<
    Booking,
    | "id"
    | "status"
    | "createdAt"
    | "updatedAt"
    | "paymentStatus"
    | "paymentReference"
  >,
  { rejectValue: string }
>("booking/createBooking", async (bookingData, { rejectWithValue }) => {
  try {
    const response = await axios.post<Booking>("/api/bookings", bookingData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to create booking",
    );
  }
});

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchUserBookings.fulfilled,
        (state, action: PayloadAction<Booking[]>) => {
          state.loading = false;
          state.bookings = action.payload;
        },
      )
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "An unknown error occurred";
      })
      .addCase(
        createBooking.fulfilled,
        (state, action: PayloadAction<Booking>) => {
          state.bookings.push(action.payload);
        },
      );
  },
});

export const selectAllBookings = (state: {
  booking: BookingState;
}): Booking[] => state.booking.bookings;

export default bookingSlice.reducer;

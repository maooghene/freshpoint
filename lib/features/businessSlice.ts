import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../store";

// 1. Define the Business interface matching your Prisma Model
export interface Business {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  sittingCapacity: number;
  categories: string[];
  description: string | null;
  image: string | null;
  status: string;
  isActive: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiErrorResponse {
  message: string;
}

// 2. Define the State Structure
interface BusinessState {
  businesses: Business[];
  currentBusiness: Business | null;
  loading: boolean;
  error: string | null;
}

const initialState: BusinessState = {
  businesses: [],
  currentBusiness: null,
  loading: false,
  error: null,
};

// 3. Async Thunk to fetch all active wellness businesses
export const fetchAllBusinesses = createAsyncThunk<
  Business[],
  void,
  { rejectValue: string }
>("business/fetchAllBusinesses", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get<Business[]>("/api/businesses");
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch businesses",
    );
  }
});

// 4. Async Thunk to fetch a single business tenant by its unique slug
export const fetchBusinessBySlug = createAsyncThunk<
  Business,
  string,
  { rejectValue: string }
>("business/fetchBusinessBySlug", async (slug: string, { rejectWithValue }) => {
  try {
    const response = await axios.get<Business>(`/api/businesses/slug/${slug}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch business details",
    );
  }
});

// 5. The Business Slice Engine
const businessSlice = createSlice({
  name: "business",
  initialState,
  reducers: {
    clearCurrentBusiness: (state) => {
      state.currentBusiness = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Businesses
      .addCase(fetchAllBusinesses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllBusinesses.fulfilled,
        (state, action: PayloadAction<Business[]>) => {
          state.loading = false;
          state.businesses = action.payload;
        },
      )
      .addCase(fetchAllBusinesses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "An unknown error occurred";
      })
      // Fetch Single Business By Slug
      .addCase(fetchBusinessBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchBusinessBySlug.fulfilled,
        (state, action: PayloadAction<Business>) => {
          state.loading = false;
          state.currentBusiness = action.payload;
        },
      )
      .addCase(fetchBusinessBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "An unknown error occurred";
      });
  },
});

// 6. Type-Safe Selectors
export const selectAllBusinesses = (state: RootState): Business[] =>
  state.business.businesses;
export const selectCurrentBusiness = (state: RootState): Business | null =>
  state.business.currentBusiness;
export const selectBusinessLoading = (state: RootState): boolean =>
  state.business.loading;

export const { clearCurrentBusiness } = businessSlice.actions;
export default businessSlice.reducer;

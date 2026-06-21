import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../store";

export interface Rating {
  id: string;
  rating: number;
  review: string | null;
  userId: string;
  itemId: string;
  businessId: string;
  bookingId: string | null;
  createdAt: string;
}

interface ApiErrorResponse {
  message: string;
}

interface RatingState {
  ratings: Rating[];
  loading: boolean;
  error: string | null;
}

const initialState: RatingState = {
  ratings: [],
  loading: false,
  error: null,
};

export const fetchItemRatings = createAsyncThunk<
  Rating[],
  string,
  { rejectValue: string }
>("rating/fetchItemRatings", async (itemId: string, { rejectWithValue }) => {
  try {
    const response = await axios.get<Rating[]>(`/api/items/${itemId}/ratings`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to get item reviews",
    );
  }
});

const ratingSlice = createSlice({
  name: "rating",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchItemRatings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchItemRatings.fulfilled,
        (state, action: PayloadAction<Rating[]>) => {
          state.loading = false;
          state.ratings = action.payload;
        },
      )
      .addCase(fetchItemRatings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "An unknown error occurred";
      });
  },
});

export const selectCurrentItemRatings = (state: {
  rating: RatingState;
}): Rating[] => state.rating.ratings;

export default ratingSlice.reducer;

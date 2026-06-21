import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../store";

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string | null;
  zipCode: string;
  isDefault: boolean;
  userId: string;
}

interface ApiErrorResponse {
  message: string;
}

interface AddressState {
  addresses: Address[];
  loading: boolean;
  error: string | null;
}

const initialState: AddressState = {
  addresses: [],
  loading: false,
  error: null,
};

export const fetchUserAddresses = createAsyncThunk<
  Address[],
  void,
  { rejectValue: string }
>("address/fetchUserAddresses", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get<Address[]>("/api/addresses");
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch addresses",
    );
  }
});

const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchUserAddresses.fulfilled,
        (state, action: PayloadAction<Address[]>) => {
          state.loading = false;
          state.addresses = action.payload;
        },
      )
      .addCase(fetchUserAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "An unknown error occurred";
      });
  },
});

export const selectAllAddresses = (state: {
  address: AddressState;
}): Address[] => state.address.addresses;

export default addressSlice.reducer;

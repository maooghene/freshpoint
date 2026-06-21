import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../store"; // Points directly up to your central store file

export type ItemType = "SERVICE" | "PRODUCT";

export interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: ItemType;
  image: string | null;
  isActive: boolean;
  businessId: string;

  // Product Inventory
  stock: number | null;
  sku: string | null;
  costPrice: number | null;
  weight: number | null;

  // Service Booking Fields
  duration: number | null;

  createdAt: string;
  updatedAt: string;
}

interface ApiErrorResponse {
  message: string;
}

interface ItemState {
  items: Item[];
  loading: boolean;
  error: string | null;
  filters: {
    type: ItemType | "ALL";
    search: string;
  };
}

const initialState: ItemState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    type: "ALL",
    search: "",
  },
};

// Async Pipeline to fetch items for a specific business tenant safely
export const fetchItemsByBusiness = createAsyncThunk<
  Item[],
  string,
  { rejectValue: string }
>(
  "item/fetchItemsByBusiness",
  async (businessId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<Item[]>(
        `/api/businesses/${businessId}/items`,
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      return rejectWithValue(
        axiosError.response?.data?.message || "Failed to fetch items",
      );
    }
  },
);

const itemSlice = createSlice({
  name: "item",
  initialState,
  reducers: {
    setItemTypeFilter: (state, action: PayloadAction<ItemType | "ALL">) => {
      state.filters.type = action.payload;
    },
    setItemSearchFilter: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    clearItemFilters: (state) => {
      state.filters = { type: "ALL", search: "" };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItemsByBusiness.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchItemsByBusiness.fulfilled,
        (state, action: PayloadAction<Item[]>) => {
          state.loading = false;
          state.items = action.payload;
        },
      )
      .addCase(fetchItemsByBusiness.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "An unknown error occurred";
      });
  },
});

// Selectors connected directly to global application state
export const selectAllItems = (state: RootState): Item[] => state.item.items;

export const selectFilteredItems = (state: RootState): Item[] => {
  const { items, filters } = state.item;
  return items.filter((item) => {
    const matchesType = filters.type === "ALL" || item.type === filters.type;
    const matchesSearch =
      item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (item.description?.toLowerCase().includes(filters.search.toLowerCase()) ??
        false);
    return matchesType && matchesSearch;
  });
};

export const { setItemTypeFilter, setItemSearchFilter, clearItemFilters } =
  itemSlice.actions;
export default itemSlice.reducer;

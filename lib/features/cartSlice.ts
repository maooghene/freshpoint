import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface CartItem {
  id: string;
  cartId: string;
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  priceAtAdd: number | null;
  createdAt: string;
}

interface CartState {
  businessId: string | null; // Multi-tenant lock: One active business context at a time
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
}

const initialState: CartState = {
  businessId: null,
  items: [],
  totalQuantity: 0,
  totalAmount: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItemToCart: (
      state,
      action: PayloadAction<{
        item: Omit<CartItem, "cartId" | "createdAt">;
        businessId: string;
      }>,
    ) => {
      const { item, businessId } = action.payload;

      // If user switches businesses, clear out previous items completely to isolate checkouts
      if (state.businessId !== businessId) {
        state.businessId = businessId;
        state.items = [];
      }

      const existingItem = state.items.find((i) => i.itemId === item.itemId);
      if (!existingItem) {
        state.items.push({
          ...item,
          cartId: "local-cart",
          createdAt: new Date().toISOString(),
        });
      } else {
        existingItem.quantity += item.quantity;
      }

      state.totalQuantity += item.quantity;
      state.totalAmount += item.price * item.quantity;
    },
    removeItemFromCart: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const existingItem = state.items.find((item) => item.itemId === itemId);

      if (existingItem) {
        state.totalQuantity -= existingItem.quantity;
        state.totalAmount -= existingItem.price * existingItem.quantity;
        state.items = state.items.filter((item) => item.itemId !== itemId);
      }

      if (state.items.length === 0) {
        state.businessId = null;
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.businessId = null;
      state.totalQuantity = 0;
      state.totalAmount = 0;
    },
  },
});

export const selectCartItems = (state: { cart: CartState }): CartItem[] =>
  state.cart.items;
export const selectCartTotalAmount = (state: { cart: CartState }): number =>
  state.cart.totalAmount;
export const selectCartBusinessContext = (state: {
  cart: CartState;
}): string | null => state.cart.businessId;

export const { addItemToCart, removeItemFromCart, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;

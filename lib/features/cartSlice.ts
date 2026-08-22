// lib/features/cartSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  id: string;
  cartId: string;
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  priceAtAdd: number | null;
  image?: string | null;
  createdAt: string;
  maxStock?: number | null; // Tracked to ensure cart screen displays real-time limits
  stockStatus?: "OK" | "LOW_STOCK" | "OUT_OF_STOCK"; // UI-ready indicator state flag
  variantId?: string | null; // Which ItemVariant (size/color combo) was selected, if any
  variantLabel?: string | null; // Human-readable label, e.g. "M / Black", for display
}

interface CartState {
  businessId: string | null;
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

// Internal structural helper to safely standardize and re-evaluate quantities against known stock
const adjustItemStockStatus = (item: CartItem) => {
  if (item.maxStock === undefined || item.maxStock === null) {
    item.stockStatus = "OK";
    return;
  }
  if (item.maxStock <= 0) {
    item.stockStatus = "OUT_OF_STOCK";
  } else if (item.quantity >= item.maxStock) {
    item.stockStatus = "LOW_STOCK";
  } else {
    item.stockStatus = "OK";
  }
};

// Two cart lines are "the same line" only if both the item AND the
// selected variant match. This lets a Medium/Black and a Large/Black of
// the same product coexist as separate lines with their own price and
// quantity, instead of silently merging and overwriting each other.
const isSameCartLine = (
  a: { itemId: string; variantId?: string | null },
  b: { itemId: string; variantId?: string | null },
) => a.itemId === b.itemId && (a.variantId ?? null) === (b.variantId ?? null);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItemToCart: (
      state,
      action: PayloadAction<{
        item: Omit<CartItem, "cartId" | "createdAt" | "stockStatus">;
        businessId: string;
      }>,
    ) => {
      const { item, businessId } = action.payload;

      if (state.businessId !== businessId) {
        state.businessId = businessId;
        state.items = [];
        state.totalQuantity = 0;
        state.totalAmount = 0;
      }

      const existingItem = state.items.find((i) => isSameCartLine(i, item));
      let quantityToAdd = item.quantity;

      if (!existingItem) {
        // Enforce hard clamp against known item bounds immediately at addition
        if (typeof item.maxStock === "number" && item.maxStock > 0) {
          quantityToAdd = Math.min(quantityToAdd, item.maxStock);
        }

        const newItem: CartItem = {
          ...item,
          quantity: quantityToAdd,
          cartId: "local-cart",
          createdAt: new Date().toISOString(),
        };
        adjustItemStockStatus(newItem);
        state.items.push(newItem);
      } else {
        const targetTotalQuantity = existingItem.quantity + quantityToAdd;
        let finalAllowedQuantity = targetTotalQuantity;

        if (
          typeof existingItem.maxStock === "number" &&
          existingItem.maxStock > 0
        ) {
          finalAllowedQuantity = Math.min(
            targetTotalQuantity,
            existingItem.maxStock,
          );
        }

        quantityToAdd = finalAllowedQuantity - existingItem.quantity;
        existingItem.quantity = finalAllowedQuantity;
        adjustItemStockStatus(existingItem);
      }

      state.totalQuantity += quantityToAdd;
      state.totalAmount += item.price * quantityToAdd;
    },

    updateItemQuantity: (
      state,
      action: PayloadAction<{
        itemId: string;
        quantity: number;
        variantId?: string | null;
      }>,
    ) => {
      const { itemId, quantity, variantId } = action.payload;
      const existing = state.items.find((i) =>
        isSameCartLine(i, { itemId, variantId }),
      );
      if (!existing) return;

      // Handle raw deletion sequence if drops to or below zero bounds
      if (quantity <= 0) {
        state.totalQuantity -= existing.quantity;
        state.totalAmount -= existing.price * existing.quantity;
        state.items = state.items.filter((i) => !isSameCartLine(i, existing));
        if (state.items.length === 0) state.businessId = null;
        return;
      }

      let targetQuantity = quantity;
      if (typeof existing.maxStock === "number" && existing.maxStock > 0) {
        targetQuantity = Math.min(quantity, existing.maxStock);
      }

      const diff = targetQuantity - existing.quantity;
      existing.quantity = targetQuantity;
      adjustItemStockStatus(existing);

      state.totalQuantity += diff;
      state.totalAmount += existing.price * diff;
    },

    removeItemFromCart: (
      state,
      action: PayloadAction<
        string | { itemId: string; variantId?: string | null }
      >,
    ) => {
      // Backward compatible: accepts either a plain itemId string (old call
      // sites, matches any variant of that item) or an { itemId, variantId }
      // object for precise single-line removal.
      const target =
        typeof action.payload === "string"
          ? { itemId: action.payload }
          : action.payload;

      const matches =
        typeof action.payload === "string"
          ? (i: CartItem) => i.itemId === target.itemId
          : (i: CartItem) => isSameCartLine(i, target);

      const toRemove = state.items.filter(matches);
      for (const existingItem of toRemove) {
        state.totalQuantity -= existingItem.quantity;
        state.totalAmount -= existingItem.price * existingItem.quantity;
      }
      state.items = state.items.filter((item) => !matches(item));

      if (state.items.length === 0) state.businessId = null;
    },

    // Reducer allowing live cart routes/intervals to inject current stock levels
    updateCartLiveStock: (
      state,
      action: PayloadAction<{ stockUpdates: Record<string, number | null> }>,
    ) => {
      const { stockUpdates } = action.payload;

      state.items.forEach((item) => {
        if (stockUpdates[item.itemId] !== undefined) {
          const freshStock = stockUpdates[item.itemId];
          item.maxStock = freshStock;

          // If stock suddenly falls beneath what they had chosen, silently pull down values
          if (typeof freshStock === "number" && item.quantity > freshStock) {
            const excessQuantity = item.quantity - Math.max(0, freshStock);
            const resolvedQuantity = Math.max(0, freshStock);

            state.totalQuantity -= excessQuantity;
            state.totalAmount -= item.price * excessQuantity;
            item.quantity = resolvedQuantity;
          }
          adjustItemStockStatus(item);
        }
      });
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

export const {
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  updateCartLiveStock,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;

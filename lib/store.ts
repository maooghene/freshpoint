import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import bookingReducer from "@/lib/features/bookingSlice";
import itemReducer from "@/lib/features/itemSlice";
import addressReducer from "@/lib/features/addressSlice";
import ratingReducer from "@/lib/features/ratingSlice";
import businessReducer from "@/lib/features/businessSlice";
import cartReducer from "@/lib/features/cartSlice";

// 1. Configure the central engine
export const store = configureStore({
  reducer: {
    booking: bookingReducer,
    item: itemReducer,
    address: addressReducer,
    rating: ratingReducer,
    business: businessReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: {
          getToken: () => {
            if (typeof window !== "undefined")
              return localStorage.getItem("token");
            return null;
          },
        },
      },
    }),
});

// 2. Export completely concrete schema definitions
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 3. Global Type-Safe React Hooks for UI Components
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <TSelected>(
  selector: (state: RootState) => TSelected,
) => useSelector<RootState, TSelected>(selector);

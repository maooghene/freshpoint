"use client";

import { useSelector, useDispatch } from "react-redux";
import {
  CartItem,
  addItemToCart,
  removeItemFromCart,
} from "@/lib/features/cartSlice";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2Icon, Plus, Minus, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const currency = "₦";

  // FIXED: Explicitly map local store shape to safely isolate from cyclic unknown fallbacks
  const { items, totalAmount } = useSelector(
    (state: {
      cart: {
        items: CartItem[];
        totalAmount: number;
        businessId: string | null;
      };
    }) => state.cart,
  );

  const handleDecreaseQuantity = (item: CartItem) => {
    if (item.quantity <= 1) {
      dispatch(removeItemFromCart(item.itemId));
    } else {
      // Re-add with a negative count value to safely step-down aggregate state counters
      dispatch(
        addItemToCart({
          businessId: "local-cart",
          item: {
            id: item.id,
            itemId: item.itemId,
            name: item.name,
            price: item.price,
            quantity: -1,
            priceAtAdd: item.priceAtAdd,
          },
        }),
      );
    }
  };

  const handleIncreaseQuantity = (item: CartItem) => {
    dispatch(
      addItemToCart({
        businessId: "local-cart",
        item: {
          id: item.id,
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: 1,
          priceAtAdd: item.priceAtAdd,
        },
      }),
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pt-24 min-h-screen">
      <div className="mb-8 space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Retail Basket
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          Review physical wellness products added from vendor stores.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
            <ShoppingBag className="size-8" />
          </div>
          <p className="text-base text-muted-foreground font-medium">
            Your shopping product cart is currently empty.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 rounded-xl font-semibold"
            onClick={() => router.push("/explore")}
          >
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-5 border border-border bg-card/40 backdrop-blur-md p-4 rounded-2xl shadow-xs transition-all hover:border-primary/20"
              >
                {/* PRODUCT THUMBNAIL WRAPPER */}
                <div className="relative w-20 h-20 bg-muted rounded-xl overflow-hidden border border-border/60 shrink-0">
                  <Image
                    src="/placeholder-product.jpg" // Fallback placeholder asset for items mapping
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* DETAILS METADATA TRACKS */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-foreground text-base truncate tracking-tight">
                    {item.name}
                  </h2>
                  <p className="text-primary font-extrabold text-sm mt-0.5">
                    {currency}
                    {(item.price * item.quantity).toLocaleString()}
                  </p>

                  {/* HIGH-UTILITY QUANTITY COUNTER CHIPS */}
                  <div className="flex items-center gap-1 mt-3">
                    <button
                      type="button"
                      onClick={() => handleDecreaseQuantity(item)}
                      className="h-7 w-7 flex items-center justify-center border border-border rounded-lg bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={12} />
                    </button>

                    <span className="w-8 text-center text-xs font-bold text-foreground">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleIncreaseQuantity(item)}
                      className="h-7 w-7 flex items-center justify-center border border-border rounded-lg bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* REMOVE OVERRIDE ACTIONS */}
                <button
                  type="button"
                  onClick={() => dispatch(removeItemFromCart(item.itemId))}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all cursor-pointer shrink-0"
                  aria-label="Remove item from basket"
                >
                  <Trash2Icon size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* CHECKOUT TOTAL AGGREGATIONS SUMMARY */}
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/20 p-5 rounded-2xl border border-border mt-8">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Subtotal Aggregate
              </p>
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                {currency}
                {totalAmount.toLocaleString()}
              </h2>
            </div>

            <Button
              onClick={() => router.push("/checkout")}
              size="lg"
              className="w-full sm:w-auto px-8 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

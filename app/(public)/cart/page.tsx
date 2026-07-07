"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/lib/store";
import {
  removeItemFromCart,
  updateItemQuantity,
  clearCart,
  CartItem,
} from "@/lib/features/cartSlice";
import { Button } from "@/components/ui/button";
import {
  Trash2Icon,
  ShoppingBagIcon,
  PackageOpen,
  MinusIcon,
  PlusIcon,
  ArrowLeftIcon,
} from "lucide-react";

export default function CartPage() {
  const dispatch = useAppDispatch();
  const { items, totalAmount, totalQuantity } = useAppSelector(
    (state) => state.cart,
  );

  const currency = "₦";

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 max-w-md mx-auto w-full bg-background text-foreground animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/5">
          <PackageOpen className="size-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
          Your cart is empty
        </h1>
        <p className="text-muted-foreground text-sm font-medium mb-8 leading-relaxed">
          You haven&apos;t added any products to your basket yet. Browse our
          partner storefronts to find wellness products and merchandise.
        </p>
        <Button
          asChild
          size="lg"
          className="rounded-xl font-semibold shadow-md px-8"
        >
          <Link href="/explore">Explore Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-24 pb-32 bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 w-full space-y-8">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <ShoppingBagIcon className="w-7 h-7 text-primary" />
              Your Basket
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              {totalQuantity} item{totalQuantity !== 1 ? "s" : ""} in your cart
            </p>
          </div>
          <button
            onClick={() => dispatch(clearCart())}
            className="text-xs font-bold text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear all
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* CART ITEMS LIST */}
          <div className="flex-1 w-full space-y-4">
            {items.map((item: CartItem) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md shadow-xs hover:border-primary/20 transition-all"
              >
                {/* IMAGE */}
                <div className="relative h-24 w-24 rounded-xl overflow-hidden border border-border/60 bg-muted shrink-0">
                  <Image
                    src={item.image || "/placeholder-product.jpg"}
                    fill
                    className="object-cover"
                    alt={item.name}
                  />
                </div>

                {/* DETAILS */}
                <div className="flex-1 space-y-1 min-w-0">
                  <h3 className="text-base font-bold text-foreground tracking-tight truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    {currency}
                    {Number(item.price).toLocaleString()} each
                  </p>
                  <p className="text-lg font-black text-foreground pt-1">
                    {currency}
                    {Number(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>

                {/* QUANTITY + REMOVE */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border">
                    <button
                      type="button"
                      onClick={() =>
                        dispatch(
                          updateItemQuantity({
                            itemId: item.itemId,
                            quantity: item.quantity - 1,
                          }),
                        )
                      }
                      disabled={item.quantity <= 1}
                      className="h-8 w-8 flex items-center justify-center border border-border rounded-lg bg-background hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Decrease quantity"
                    >
                      <MinusIcon size={12} />
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch(
                          updateItemQuantity({
                            itemId: item.itemId,
                            quantity: item.quantity + 1,
                          }),
                        )
                      }
                      className="h-8 w-8 flex items-center justify-center border border-border rounded-lg bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <PlusIcon size={12} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => dispatch(removeItemFromCart(item.itemId))}
                    className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all cursor-pointer"
                    aria-label="Remove item"
                  >
                    <Trash2Icon size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ORDER SUMMARY SIDEBAR */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-xl space-y-6 sticky top-24">
              <h2 className="font-extrabold text-lg tracking-tight text-foreground">
                Order Summary
              </h2>

              <div className="space-y-3">
                {items.map((item: CartItem) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium truncate max-w-[160px]">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-bold text-foreground shrink-0">
                      {currency}
                      {Number(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 flex justify-between items-center">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-black text-xl text-primary">
                  {currency}
                  {Number(totalAmount).toLocaleString()}
                </span>
              </div>

              <Button
                asChild
                size="lg"
                className="w-full rounded-xl font-bold shadow-md"
              >
                <Link href="/checkout/products">
                  <ShoppingBagIcon className="mr-2 size-4" />
                  Proceed to Checkout
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full rounded-xl font-semibold"
              >
                <Link href="/explore">
                  <ArrowLeftIcon className="mr-2 size-4" />
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  CalendarIcon,
  Trash2Icon,
  ClockIcon,
  MapPinIcon,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/lib/store";
import { clearBookingFlow } from "@/lib/features/bookingSlice";
import { Button } from "@/components/ui/button";
import { BookingSummary } from "@/components/BookingSummary";

export default function BookingCart() {
  const currency = "₦";
  const dispatch = useAppDispatch();

  // Directly reads the selected appointment state from your Redux slice
  const bookingState = useAppSelector((state) => state.booking);
  const { businessName, selectedService, bookingTime } = bookingState;

  const handleCancelBooking = () => {
    dispatch(clearBookingFlow());
  };

  // Convert slice structure into a standardized array for our UI loop maps
  const activeBookings = selectedService
    ? [
        {
          id: selectedService.id,
          name: selectedService.name,
          price: selectedService.price,
          duration: selectedService.duration,
          image: selectedService.image,
          businessName: businessName,
          time: bookingTime,
        },
      ]
    : [];

  return activeBookings.length > 0 ? (
    <div className="relative min-h-screen overflow-hidden pt-20 bg-background text-foreground">
      {/* BULLETPROOF BACKGROUND GRID PATTERN */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 
          bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] 
          dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] 
          bg-[size:4rem_4rem] 
          [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"
        />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 dark:bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        {/* TITLE SECTION */}
        <div className="mb-12 space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Your Selection</h1>
          <p className="text-muted-foreground font-medium">
            Review your treatment choice and dynamic schedule
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* BOOKING LIST CONTAINER */}
          <div className="flex-1 w-full space-y-4">
            {activeBookings.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md shadow-xs hover:border-primary/30 transition-all"
              >
                {/* IMAGE FRAME WRAPPER */}
                <div className="relative h-24 w-24 rounded-xl overflow-hidden border border-border/60 bg-muted shrink-0">
                  <Image
                    src={item.image || "/placeholder-service.jpg"}
                    fill
                    className="object-cover"
                    alt={item.name}
                  />
                </div>

                {/* SERVICE SPECS METADATA */}
                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-bold text-foreground tracking-tight">
                    {item.name}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <ClockIcon size={14} className="text-primary" />
                      {item.duration} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPinIcon size={14} className="text-primary" />
                      {item.businessName}
                    </span>
                  </div>
                  {item.time && (
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
                      Selected Time:{" "}
                      {new Date(item.time).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  )}
                  <p className="pt-2 font-bold text-lg text-foreground">
                    {currency}
                    {item.price.toLocaleString()}
                  </p>
                </div>

                {/* ITEM MANAGEMENT ACTIONS */}
                <div className="flex sm:flex-col items-end gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-border">
                  <button
                    type="button"
                    onClick={handleCancelBooking}
                    className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all cursor-pointer"
                    aria-label="Remove item"
                  >
                    <Trash2Icon size={18} />
                  </button>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-xs font-semibold rounded-lg text-primary hover:text-primary/80 hover:bg-primary/5"
                  >
                    <Link href={`/book/${item.id}`}>Change Time</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* SIDEBAR SUMMARY CHECKOUT MODULE */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-xl space-y-6">
              <BookingSummary
                totalPrice={selectedService?.price || 0}
                items={activeBookings}
              />
              
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    /* CLEAN EMPTY WORKSPACE LAYER */
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 max-w-md mx-auto w-full bg-background text-foreground animate-in fade-in duration-300">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <ShoppingBag className="size-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
        No treatments selected
      </h1>
      <p className="text-muted-foreground text-sm font-medium mb-8 leading-relaxed">
        Your dynamic appointment booking basket is currently empty. Explore our
        collection of premium salons and wellness providers to get started.
      </p>

      {/* 🚀 FIXED: Updated fallback button to bg-primary purple too */}
      <Button
        asChild
        size="lg"
        className="rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md px-8"
      >
        <Link href="/explore">Find a Provider Space</Link>
      </Button>
    </div>
  );
}

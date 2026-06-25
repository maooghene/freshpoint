// src/components/public/booking/CustomerBookingWidget.tsx
"use client";

import { useState } from "react";
import { SparklesIcon, ClockIcon, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
}

interface BusinessWithItems {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  slug: string;
  items: ServiceItem[];
}

interface BookingWidgetProps {
  business: BusinessWithItems;
}

export default function CustomerBookingWidget({
  business,
}: BookingWidgetProps) {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(
    null,
  );
  const [bookingDate, setBookingDate] = useState<string>("");
  const [bookingTime, setBookingTime] = useState<string>("");
  const currency = "₦";

  const handleCheckoutInitiation = () => {
    if (!selectedService || !bookingDate || !bookingTime) return;

    // Proceed to payment integration step
    console.log("Initiating payment for service mapping:", {
      serviceId: selectedService.id,
      date: bookingDate,
      time: bookingTime,
      businessId: business.id,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* BUSINESS TITLE BANNER */}
      <div className="border-b pb-6 space-y-2">
        <h1 className="text-4xl font-black text-foreground tracking-tight">
          {business.name}
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl">
          {business.description ||
            "Welcome to our booking page. Select an available offering below to schedule your appointment."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* SERVICE OFFERINGS LIST (Left Columns) */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold tracking-tight mb-2">
            1. Select a Service
          </h2>
          {business.items.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No bookable services listed yet.
            </p>
          ) : (
            business.items.map((service) => (
              <div
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`p-5 border rounded-2xl cursor-pointer transition-all ${
                  selectedService?.id === service.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-foreground">
                      {service.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 max-w-md">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium pt-2">
                      <ClockIcon className="w-3.5 h-3.5 text-primary" />
                      <span>{service.duration || 30} Minutes</span>
                    </div>
                  </div>
                  <span className="font-black text-primary text-lg">
                    {currency}
                    {service.price.toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* TIME SLOTS & CHECKOUT CONTAINER (Right Column) */}
        <div className="space-y-6">
          <div className="p-6 border border-border bg-card rounded-2xl shadow-sm space-y-6">
            <h2 className="text-xl font-bold tracking-tight">
              2. Select Schedule
            </h2>

            {/* DATE SELECT FIELD */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-primary" /> Date
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 bg-background focus:ring-2 focus:ring-primary outline-none text-sm font-medium h-11"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* TIME SELECT FIELD */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ClockIcon className="w-3.5 h-3.5 text-primary" /> Appointment
                Time
              </label>
              <input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 bg-background focus:ring-2 focus:ring-primary outline-none text-sm font-medium h-11"
              />
            </div>

            {/* BOOKING SUMMARY ROW */}
            {selectedService && bookingDate && bookingTime && (
              <div className="pt-4 border-t border-dashed space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Booking Summary
                </p>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-foreground truncate max-w-[150px]">
                    {selectedService.name}
                  </span>
                  <span className="font-bold text-primary">
                    {currency}
                    {selectedService.price.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Scheduled for {bookingDate} at {bookingTime}
                </p>
              </div>
            )}

            <Button
              onClick={handleCheckoutInitiation}
              disabled={!selectedService || !bookingDate || !bookingTime}
              className="w-full h-12 rounded-xl font-bold text-sm shadow-md"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Proceed to Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

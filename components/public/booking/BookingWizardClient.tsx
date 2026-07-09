"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ClockIcon, MapPinIcon, Calendar, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useBookingState } from "@/hooks/useBookingState";
import { BookingSlotsGrid } from "@/components/BookingSlotsGrid";
import { SpecialistSidebar } from "@/components/SpecialistSidebar";
import { ImageWithFallback } from "@/components/ImageWithFallback";

interface StaffScheduleDetails {
  day: string;
  isOff: boolean;
}

interface StaffMemberDetails {
  id: string;
  name: string;
  schedules?: StaffScheduleDetails[];
}

interface ItemDetails {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
  image: string | null;
  type: string;
  business: {
    id: string;
    slug: string;
    name: string;
    address: string;
    staff: StaffMemberDetails[];
  };
}

export default function BookingWizardClient({ item }: { item: ItemDetails }) {
  const router = useRouter();
  const {
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    selectedStaff,
    setSelectedStaff,
    calculatedSlots,
    fetchingHours,
    evaluatedStaffRoster,
    isSelectedSpecialistOffDuty,
    todayString,
  } = useBookingState(item);

  const getReadableSelectedDate = () => {
    if (!selectedDate) return "";
    const [year, month, day] = selectedDate.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleAddToBasket = () => {
    if (!selectedDate) {
      alert("Please choose a day on the calendar first.");
      return;
    }

    if (isSelectedSpecialistOffDuty) {
      alert(
        "This professional is scheduled to be off duty on this day. You cannot proceed to checkout with this selection.",
      );
      return;
    }

    if (!selectedSlot) {
      alert("Please pick an available time slot before clicking checkout.");
      return;
    }

    const params = new URLSearchParams({
      itemId: item.id,
      businessId: item.business.id,
      date: selectedDate,
      time: encodeURIComponent(selectedSlot),
    });

    if (selectedStaff !== "any") {
      params.set("staffId", selectedStaff);
    }

    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="w-full space-y-8 py-12 animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-[2rem] p-6 flex flex-col sm:flex-row gap-6 items-center shadow-xs">
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-muted border border-border shrink-0">
          <ImageWithFallback
            src={item.image}
            alt={item.name}
            icon={Sparkles}
            label="Treatment"
            sizes="96px"
          />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground truncate">
              {item.name}
            </h1>
            <Badge
              variant="secondary"
              className="w-fit mx-auto sm:mx-0 text-[10px] font-bold bg-primary/10 text-primary border-none"
            >
              SERVICE TREATMENT
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-medium line-clamp-2 max-w-xl">
            {item.description ||
              "Premium treatment option tailored to your wellness needs."}
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-x-5 gap-y-1.5 pt-3 border-t border-border text-xs font-bold text-muted-foreground/80">
            <div className="flex items-center gap-1 text-foreground">
              <Sparkles size={14} className="text-primary" />
              <span>{item.business.name}</span>
            </div>
            {item.duration && (
              <div className="flex items-center gap-1">
                <ClockIcon size={14} className="text-primary" />
                <span>{item.duration} mins</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MapPinIcon size={14} className="text-primary" />
              <span className="truncate max-w-[180px]">
                {item.business.address}
              </span>
            </div>
          </div>
        </div>

        <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6 shrink-0 min-w-[120px]">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Rate Cost
          </p>
          <p className="text-2xl font-black text-foreground">
            ₦{Number(item.price).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-[2rem] p-6 space-y-8 shadow-xs">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-lg tracking-tight">
                Select Appointment Date
              </h3>
              {selectedDate && (
                <span className="text-xs text-primary font-bold bg-primary/10 px-3 py-1 rounded-full animate-in fade-in">
                  {getReadableSelectedDate()}
                </span>
              )}
            </div>

            <div className="relative w-full max-w-sm flex items-center bg-background border border-border rounded-2xl px-4 py-3.5 focus-within:border-primary transition-all">
              <Calendar className="text-muted-foreground size-5 mr-3 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                min={todayString}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot("");
                }}
                className="w-full bg-transparent outline-none text-sm font-bold text-foreground cursor-pointer"
              />
            </div>
          </div>

          <BookingSlotsGrid
            fetchingHours={fetchingHours}
            isSelectedSpecialistOffDuty={isSelectedSpecialistOffDuty}
            calculatedSlots={calculatedSlots}
            selectedSlot={selectedSlot}
            setSelectedSlot={setSelectedSlot}
          />
        </div>

        <div className="space-y-6">
          <SpecialistSidebar
            selectedStaff={selectedStaff}
            setSelectedStaff={setSelectedStaff}
            setSelectedSlot={setSelectedSlot}
            evaluatedStaffRoster={evaluatedStaffRoster}
          />

          <div className="bg-card border border-border rounded-[2rem] p-5 shadow-xs space-y-4">
            {isSelectedSpecialistOffDuty && (
              <div className="flex gap-2 text-xs text-destructive bg-destructive/5 p-3 rounded-xl border border-destructive/20 items-start">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">
                  The selected specialist is off duty on this day. Please choose
                  a different specialist or date.
                </p>
              </div>
            )}

            <div className="flex gap-2 text-xs text-muted-foreground bg-muted/60 p-3 rounded-xl border border-border/50 items-start">
              <Info size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">
                {selectedSlot && !isSelectedSpecialistOffDuty
                  ? `${getReadableSelectedDate()} at ${selectedSlot}. Proceed to confirm your booking.`
                  : "Select a date and time slot to continue to checkout."}
              </p>
            </div>

            <Button
              onClick={handleAddToBasket}
              disabled={!selectedSlot || isSelectedSpecialistOffDuty}
              className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Booking Basket
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

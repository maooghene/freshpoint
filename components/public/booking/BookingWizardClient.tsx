"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Sparkles,
  ClockIcon,
  MapPinIcon,
  Calendar,
  Info,
  Check,
  Loader2,
  CalendarOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StaffMember {
  id: string;
  name: string;
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
    slug: string; // 🔑 Ensure your query pulls business slug context parameters correctly
    name: string;
    address: string;
    staff: StaffMember[];
  };
}

interface DBBusinessSchedule {
  id: string;
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  openTime: string; // e.g. "09:00"
  closeTime: string; // e.g. "16:30"
  isClosed: boolean;
}

export default function BookingWizardClient({ item }: { item: ItemDetails }) {
  const router = useRouter();
  const todayString = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayString);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<string>("any");

  // 🛠️ LIVE STREAM HOOK STATES: Replaces static loops with real-time database hours tracking
  const [storeSchedules, setStoreSchedules] = useState<DBBusinessSchedule[]>(
    [],
  );
  const [calculatedSlots, setCalculatedSlots] = useState<string[]>([]);
  const [fetchingHours, setFetchingHours] = useState<boolean>(true);

  // 1️⃣ Fetch operational hours directly using the public endpoint path
  useEffect(() => {
    let isMounted = true;
    async function loadLiveBusinessHours() {
      try {
        setFetchingHours(true);
        // Targets your unified public slug endpoint safely
        const res = await fetch(
          `/api/businesses/slug/${item.business.slug}/schedule`,
        );
        if (!res.ok) throw new Error("Failed to load storefront metrics");

        const data = await res.json();
        if (isMounted) {
          setStoreSchedules(data.schedules || []);
        }
      } catch (err) {
        console.error("Storefront schedule fetch error:", err);
      } finally {
        if (isMounted) setFetchingHours(false);
      }
    }
    if (item.business.slug) loadLiveBusinessHours();
    return () => {
      isMounted = false;
    };
  }, [item.business.slug]);

  // 2️⃣ DYNAMIC GENERATOR: Slices custom hours (like 9:00 to 16:30) into clean slots based on date chosen
  const generateTimeSlotsForDate = useCallback(
    (dateString: string) => {
      if (storeSchedules.length === 0) return;

      const daysMap = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ];
      const targetDate = new Date(dateString);
      const targetDayStr = daysMap[targetDate.getDay()];

      // Find the specific rule the provider saved for this day
      const dayRule = storeSchedules.find((s) => s.day === targetDayStr);

      // If day is unchecked/closed or not configured, freeze available options immediately
      if (!dayRule || dayRule.isClosed) {
        setCalculatedSlots([]);
        return;
      }

      // Unpack saved limits (e.g. openTime: "09:00", closeTime: "16:30")
      const [startHour, startMin] = dayRule.openTime.split(":").map(Number);
      const [endHour, endMin] = dayRule.closeTime.split(":").map(Number);

      const timeStringsArray: string[] = [];
      let currentHour = startHour;
      let currentMin = startMin;

      while (
        currentHour < endHour ||
        (currentHour === endHour && currentMin <= endMin)
      ) {
        // Formats string into readable layout tags (e.g., convert "13:30" to "01:30 PM")
        const rawHour = currentHour;
        const ampm = rawHour >= 12 ? "PM" : "AM";
        const displayHour = rawHour % 12 === 0 ? 12 : rawHour % 12;
        const displayStr = `${displayHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")} ${ampm}`;

        timeStringsArray.push(displayStr);

        // Increments index selections forward by clean 30-minute operational block periods
        currentMin += 30;
        if (currentMin >= 60) {
          currentHour += 1;
          currentMin = 0;
        }
      }

      setCalculatedSlots(timeStringsArray);
    },
    [storeSchedules],
  );

  // Track state changes to re-evaluate slots whenever user alters the active calendar element card
  useEffect(() => {
    if (selectedDate && storeSchedules.length > 0) {
      generateTimeSlotsForDate(selectedDate);
    }
  }, [selectedDate, storeSchedules, generateTimeSlotsForDate]);

  const getReadableSelectedDate = () => {
    if (!selectedDate) return "";
    const parsedDate = new Date(selectedDate);
    return parsedDate.toLocaleDateString("en-NG", {
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
      {/* HERO HEADER ROW */}
      <div className="bg-card border border-border rounded-[2rem] p-6 flex flex-col sm:flex-row gap-6 items-center shadow-xs">
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-muted border border-border shrink-0">
          <Image
            src={item.image || "/placeholder-service.jpg"}
            alt={item.name}
            fill
            className="object-cover"
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

      {/* MATRIX SELECTOR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-[2rem] p-6 space-y-8 shadow-xs">
          {/* CALENDAR SELECTOR */}
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
                className="w-full bg-transparent outline-none text-sm font-bold text-foreground cursor-pointer scheme-light dark:scheme-dark"
              />
            </div>
          </div>

          {/* DYNAMIC TIME SLOTS CONTAINER */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-lg tracking-tight">
              Available Slots
            </h3>

            {fetchingHours ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground p-4 bg-muted/40 rounded-xl border border-dashed animate-pulse">
                <Loader2 className="animate-spin w-4 h-4 text-primary" />
                Synchronizing live provider operating calendars...
              </div>
            ) : calculatedSlots.length === 0 ? (
              /* If shop hours are toggled to Closed on this weekday, throw safe fallback notice alerts */
              <div className="flex flex-col items-center justify-center p-8 bg-destructive/5 border border-dashed border-destructive/20 text-center rounded-2xl gap-2 animate-in fade-in">
                <CalendarOff className="w-8 h-8 text-destructive/60" />
                <p className="text-xs font-bold text-destructive">
                  This wellness workspace is closed on this calendar day.
                </p>
                <p className="text-[10px] text-muted-foreground max-w-[280px]">
                  Please tap a different date on the picker dashboard above to
                  book appointments.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
                {calculatedSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedSlot(time)}
                    className={`p-3 text-center rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                      selectedSlot === time
                        ? "border-primary bg-primary text-primary-foreground shadow-md scale-[1.02]"
                        : "border-border bg-background/40 hover:border-primary/30 text-foreground hover:scale-[1.01]"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* INTERACTIVE SPECIALIST SIDEBAR (Part 2 Integration) */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-[2rem] p-6 space-y-5 shadow-xs">
            <h3 className="font-extrabold text-lg tracking-tight">
              Select Specialist
            </h3>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setSelectedStaff("any")}
                className={`w-full flex items-center gap-3 p-3 border rounded-xl transition text-left cursor-pointer ${
                  selectedStaff === "any"
                    ? "border-primary bg-primary/5 font-bold"
                    : "border-border bg-background/30"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {selectedStaff === "any" ? <Check size={14} /> : "★"}
                </div>
                <span className="text-xs font-bold">Any Professional</span>
              </button>

              {item.business.staff?.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedStaff(member.id)}
                  className={`w-full flex items-center gap-3 p-3 border rounded-xl transition text-left cursor-pointer ${
                    selectedStaff === member.id
                      ? "border-primary bg-primary/5 font-bold"
                      : "border-border bg-background/30"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary shrink-0">
                    {selectedStaff === member.id ? (
                      <Check size={14} />
                    ) : (
                      member.name.charAt(0)
                    )}
                  </div>
                  <span className="text-xs font-bold">{member.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CTA PANEL */}
          <div className="bg-card border border-border rounded-[2rem] p-5 shadow-xs space-y-4">
            <div className="flex gap-2 text-xs text-muted-foreground bg-muted/60 p-3 rounded-xl border border-border/50 items-start">
              <Info size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">
                {selectedSlot
                  ? `${getReadableSelectedDate()} at ${selectedSlot}. Proceed to confirm your booking.`
                  : "Select a date and time slot to continue to checkout."}
              </p>
            </div>

            <Button
              onClick={handleAddToBasket}
              disabled={!selectedSlot}
              className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md text-sm transition-all cursor-pointer"
            >
              Add to Booking Basket
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

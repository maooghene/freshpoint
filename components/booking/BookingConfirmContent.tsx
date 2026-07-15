// components/booking/BookingConfirmContent.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { useAppDispatch } from "@/lib/store";
import { setBookingTime, selectService } from "@/lib/features/bookingSlice";

type Day =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

interface ScheduleItem {
  day: Day;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface ItemServiceResponse {
  id: string;
  name: string;
  price: number;
  duration: number | null;
  image: string | null;
  business: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ApiErrorResponse {
  message: string;
}

export function BookingConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { getToken } = useAuth();

  const itemId = searchParams?.get("itemId");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [service, setService] = useState<ItemServiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceItem = async () => {
      if (!itemId) return;
      try {
        setLoading(true);
        setErrorMsg(null);
        const token = await getToken();
        const res = await axios.get<ItemServiceResponse>(
          `/api/items/${itemId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = res.data;
        setService(data);

        dispatch(
          selectService({
            businessId: data.business.id,
            businessName: data.business.name,
            service: {
              id: data.id,
              name: data.name,
              price: data.price,
              duration: data.duration ?? 30,
              image: data.image,
            },
          }),
        );
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        console.error("FAILED TO FETCH SERVICE ITEM:", axiosError);
        setErrorMsg(
          axiosError.response?.data?.message || "Service data unavailable",
        );
        setService(null);
      } finally {
        setLoading(false);
      }
    };
    fetchServiceItem();
  }, [itemId, getToken, dispatch]);

  useEffect(() => {
    const fetchBusinessSchedule = async () => {
      try {
        const token = await getToken();
        const res = await axios.get<ScheduleItem[]>(
          "/api/businesses/schedule",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setSchedule(res.data || []);
      } catch (err) {
        console.error("FAILED TO FETCH COMPLIANT SCHEDULE:", err);
      }
    };
    fetchBusinessSchedule();
  }, [getToken]);

  const selectedDay = useMemo(() => {
    if (!date) return null;
    const daysArray: Day[] = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    return daysArray[new Date(date).getDay()];
  }, [date]);

  const todaySchedule = useMemo(() => {
    return schedule.find((s) => s.day === selectedDay) || null;
  }, [schedule, selectedDay]);

  const slots = useMemo(() => {
    if (!date || !todaySchedule || todaySchedule.isClosed || !service)
      return [];
    const duration = service.duration ?? 30;
    const start = new Date(
      `2000-01-01T${todaySchedule.openTime.slice(0, 5)}:00`,
    );
    const end = new Date(
      `2000-01-01T${todaySchedule.closeTime.slice(0, 5)}:00`,
    );

    const result: string[] = [];
    let current = new Date(start);
    while (current.getTime() + duration * 60000 <= end.getTime()) {
      result.push(current.toTimeString().slice(0, 5));
      current = new Date(current.getTime() + duration * 60000);
    }
    return result;
  }, [date, todaySchedule, service]);

  const handleContinue = () => {
    if (!date || !time) return;
    const dateTime = new Date(`${date}T${time}`).toISOString();
    dispatch(setBookingTime(dateTime));
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin size-8 text-primary" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="size-10 text-destructive mb-4" />
        <p className="text-muted-foreground font-medium">
          {errorMsg || "Requested service item was not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6 max-w-3xl mx-auto w-full text-foreground bg-background">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Select Date & Time
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose an open booking block for your appointment at{" "}
          {service.business.name}.
        </p>
      </div>

      <div className="mb-8 max-w-xs">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Target Date
        </label>
        <input
          type="date"
          value={date}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => {
            setDate(e.target.value);
            setTime("");
          }}
          className="w-full bg-muted/40 text-foreground border border-border/60 rounded-xl px-4 py-3 focus:border-primary/50 transition-colors"
        />
      </div>

      {date && (
        <div className="space-y-4 mb-10">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Available Slots
          </label>
          {slots.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`p-3 border rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                    time === slot
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-foreground border-border hover:bg-muted/50"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 bg-muted/20 border border-dashed border-border rounded-2xl text-center px-4">
              <AlertCircle className="size-6 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground font-medium">
                No active wellness slots matching this date block.
              </p>
            </div>
          )}
        </div>
      )}

      <Button
        onClick={handleContinue}
        disabled={!date || !time}
        size="lg"
        className="w-full font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-primary text-primary-foreground cursor-pointer"
      >
        <CalendarIcon className="mr-2 size-4" />
        Continue to Confirmation
      </Button>
    </div>
  );
}

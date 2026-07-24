"use client";

import React, { useState, useEffect } from "react";

interface TimeSlotPickerProps {
  businessId: string;
  selectedServiceDuration: number; // passed from parent component (in minutes)
  onSlotSelected: (timeStr: string, dateStr: string) => void;
}

export default function TimeSlotPicker({
  businessId,
  selectedServiceDuration,
  onSlotSelected,
}: TimeSlotPickerProps) {
  // Get today's local date string formatted as YYYY-MM-DD
  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId || !selectedServiceDuration || !selectedDate) return;

    async function fetchSlots() {
      setLoading(true);
      setError(null);
      setActiveSlot(null);

      try {
        const response = await fetch(
          `/api/businesses/${businessId}/availability?date=${selectedDate}&duration=${selectedServiceDuration}`,
        );
        const data = await response.json();

        if (data.success) {
          setSlots(data.slots);
        } else {
          setError(data.error || "Failed to load timeslots.");
        }
      } catch (err) {
        setError("Network error occurred while fetching available times.");
      } finally {
        setLoading(false);
      }
    }

    fetchSlots();
  }, [businessId, selectedServiceDuration, selectedDate]);

  const handleSlotClick = (slot: string) => {
    setActiveSlot(slot);
    onSlotSelected(slot, selectedDate);
  };

  return (
    <div className="w-full max-w-md p-6 mx-auto bg-white border border-gray-100 rounded-2xl shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Select Date & Time
      </h3>

      {/* Date Picker Input Row */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Appointment Date
        </label>
        <input
          type="date"
          min={getTodayStr()}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:outline-none transition-all"
        />
      </div>

      {/* Time Slots Grid Panel */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Available Windows ({selectedServiceDuration} mins)
        </label>

        {loading && (
          <div className="grid grid-cols-3 gap-2 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">
            {error}
          </p>
        )}

        {!loading && !error && slots.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            No openings left for this date.
          </p>
        )}

        {!loading && !error && slots.length > 0 && (
          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {slots.map((slot) => {
              const isSelected = activeSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleSlotClick(slot)}
                  className={`py-2 px-3 text-sm font-medium rounded-xl border transition-all text-center ${
                    isSelected
                      ? "bg-black text-white border-black shadow-sm"
                      : "bg-white text-gray-800 border-gray-200 hover:border-gray-900"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

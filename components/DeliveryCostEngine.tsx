"use client";

import * as React from "react";
import { MapPin, Phone, Truck, ShieldCheck, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface DeliveryCostEngineProps {
  businessLat: number; // Defaults to Lagos context (6.5244) from Prisma schema
  businessLng: number; // Defaults to Lagos context (3.3792) from Prisma schema
}

export function DeliveryCostEngine({
  businessLat,
  businessLng,
}: DeliveryCostEngineProps) {
  const [phoneInput, setPhoneInput] = React.useState("");
  const [normalizedPhone, setNormalizedPhone] = React.useState("");
  const [isPhoneValid, setIsPhoneValid] = React.useState(true);

  // Simulated Autocomplete Pickers coordinates for demonstration
  const [customerLat, setCustomerLat] = React.useState<number | null>(null);
  const [customerLng, setCustomerLng] = React.useState<number | null>(null);
  const [calculatedDistance, setCalculatedDistance] = React.useState<
    number | null
  >(null);
  const [deliveryCost, setDeliveryCost] = React.useState<number | null>(null);

  /**
   * Upstream Normalization: Converts localized input sequences to E.164 format
   * Matches standard Nigerian specifications (11-digit local, +234, or 234 variants)
   */
  const normalizeNigerianPhone = (input: string) => {
    let digits = input.replace(/\D/g, ""); // Strip non-numeric artifacts

    if (digits.startsWith("0") && digits.length === 11) {
      digits = "234" + digits.substring(1);
    } else if (digits.length === 10 && !digits.startsWith("234")) {
      digits = "234" + digits;
    }

    // Strict regular expression validator matching active Nigerian telco profiles
    const nigerianE164Regex =
      /^(234)(701|702|703|704|705|706|707|708|709|802|803|804|805|806|807|808|809|901|902|903|904|905|906|907|908|909|911|912|913|915|916)\d{7}$/;

    const isValid = nigerianE164Regex.test(digits);
    setIsPhoneValid(isValid);
    setNormalizedPhone(digits);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setPhoneInput(rawValue);
    normalizeNigerianPhone(rawValue);
  };

  /**
   * Distance Calculation Engine using the Haversine Mathematical Model
   */
  const calculateHaversineDistance = () => {
    if (customerLat === null || customerLng === null) return;

    const toRadians = (degree: number) => (degree * Math.PI) / 180;
    const R = 6371; // Earth's absolute mean radius in kilometers

    const dLat = toRadians(customerLat - businessLat);
    const dLng = toRadians(customerLng - businessLng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(businessLat)) *
        Math.cos(toRadians(customerLat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    setCalculatedDistance(distanceKm);

    // Flat Rate Distance-Based Matrix Fee Calculation Rules (NGN)
    if (distanceKm <= 5) {
      setDeliveryCost(1500); // Inner circle drop-off flat fee
    } else if (distanceKm > 5 && distanceKm <= 15) {
      setDeliveryCost(3000); // Intermediate zone drop-off fee
    } else {
      setDeliveryCost(5000); // Long-distance regional threshold fee
    }
  };

  // Mock function to simulate pickers choice triggers
  const simulateIkejaToLekkiPicker = () => {
    setCustomerLat(6.4281); // Lekki Coordinates Context
    setCustomerLng(3.4219);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm w-full max-w-xl">
      <div className="space-y-1">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Delivery Cost & Customer Matrix
        </h3>
        <p className="text-xs text-muted-foreground">
          Calculates accurate pricing based on distance data from your Lagos
          headquarters.
        </p>
      </div>

      {/* SECTION 1: Phone Matrix Normalization */}
      <div className="space-y-2">
        <Label
          htmlFor="deliveryPhone"
          className="text-xs font-bold text-foreground flex items-center gap-1.5"
        >
          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
          Recipient Phone Number (Nigerian Format)
        </Label>
        <div className="space-y-1.5">
          <Input
            id="deliveryPhone"
            value={phoneInput}
            onChange={handlePhoneChange}
            placeholder="0803 123 4567 or +234..."
            className="rounded-xl h-10"
          />
          {phoneInput && (
            <div className="text-[11px] font-semibold flex items-center gap-1.5">
              {isPhoneValid ? (
                <span className="text-emerald-500 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  E.164 Normalization Verified: {normalizedPhone}
                </span>
              ) : (
                <span className="text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Invalid prefix combination for local telco carriers.
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Location Autocomplete simulation */}
      <div className="space-y-3 pt-2 border-t border-border">
        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          Destination Autocomplete Picker
        </Label>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={simulateIkejaToLekkiPicker}
            className="text-xs rounded-xl flex-1 h-9"
          >
            Simulate Picker (Select Lekki Location)
          </Button>
          <Button
            type="button"
            disabled={customerLat === null}
            onClick={calculateHaversineDistance}
            className="text-xs rounded-xl font-bold h-9 px-4"
          >
            Compute Matrix Fee
          </Button>
        </div>

        {calculatedDistance !== null && deliveryCost !== null && (
          <div className="p-4 bg-muted/50 border rounded-xl space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Computed Radius:</span>
              <span className="font-mono font-bold text-foreground">
                {calculatedDistance.toFixed(2)} km
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-dashed">
              <span className="text-muted-foreground font-semibold">
                Delivery Fee Matrix:
              </span>
              <span className="text-sm font-black text-primary">
                ₦{deliveryCost.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

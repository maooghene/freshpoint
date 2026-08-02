import { useEffect, useState } from "react";

interface DeliveryFeeCalculationResult {
  deliveryFee: number;
  estimatedDistance: number;
  calculatingFee: boolean;
  fallbackMessage: string | null;
  coordinates: { latitude: number; longitude: number } | null;
}

interface DeliveryCalculateApiResponse {
  success: boolean;
  deliveryFee: number;
  distanceKm: number;
  isFallback: boolean;
  message?: string;
  latitude?: number;
  longitude?: number;
}

export function useDeliveryFeeCalculation(
  businessId: string,
  isDelivery: boolean,
  address: string,
): DeliveryFeeCalculationResult {
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [estimatedDistance, setEstimatedDistance] = useState<number>(0);
  const [calculatingFee, setCalculatingFee] = useState<boolean>(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const trimmedAddress = address.trim();

    // Guards against isDelivery=true with no valid businessId — this can
    // happen for a moment during post-checkout navigation, when clearCart()
    // empties the Redux businessId while this page is still mounted
    // waiting for the route transition to finish. Without this guard the
    // effect fires a doomed request and logs a confusing 400 after
    // checkout has already succeeded.
    if (!isDelivery || !businessId || trimmedAddress.length < 6) {
      setDeliveryFee(0);
      setEstimatedDistance(0);
      setFallbackMessage(null);
      setCoordinates(null);
      return;
    }

    // Cancels the in-flight fetch itself (not just the debounce timer) when
    // the address changes again, isDelivery toggles off, or the component
    // unmounts (e.g. navigating to /orders/success right after payment).
    // Without this, a late-resolving fetch from a stale address/navigation
    // still hits the API and logs a confusing 400 in the terminal after
    // checkout has already completed.
    const abortController = new AbortController();

    const triggerDistanceCalculation = async () => {
      try {
        setCalculatingFee(true);
        setFallbackMessage(null);

        const res = await fetch("/api/delivery/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId,
            destinationAddress: trimmedAddress,
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          console.error(
            "Delivery calculate endpoint returned status:",
            res.status,
          );
          return;
        }

        const data: DeliveryCalculateApiResponse = await res.json();

        setDeliveryFee(data.deliveryFee);
        setEstimatedDistance(data.distanceKm ?? 0);

        // Only trust coordinates when the backend actually resolved a real
        // location (not the base-fee fallback path, which has none).
        if (
          !data.isFallback &&
          typeof data.latitude === "number" &&
          typeof data.longitude === "number"
        ) {
          setCoordinates({
            latitude: data.latitude,
            longitude: data.longitude,
          });
        } else {
          setCoordinates(null);
        }

        if (data.isFallback) {
          setFallbackMessage(data.message || "Flat rate applied.");
        }
      } catch (err) {
        // AbortError is expected whenever a newer request supersedes this
        // one, or the component unmounts mid-flight — not a real error.
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        console.error("FEE_CALCULATION_ERROR:", err);
      } finally {
        if (!abortController.signal.aborted) {
          setCalculatingFee(false);
        }
      }
    };

    const delayDebounceFn = setTimeout(triggerDistanceCalculation, 800);

    return () => {
      clearTimeout(delayDebounceFn);
      abortController.abort();
    };
  }, [address, isDelivery, businessId]);

  return {
    deliveryFee,
    estimatedDistance,
    calculatingFee,
    fallbackMessage,
    coordinates,
  };
}

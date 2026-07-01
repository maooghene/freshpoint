// lib/fees.ts

const FRESHPOINT_COMMISSION_RATE = 0.08; // 8%
const PAYSTACK_RATE = 0.015; // 1.5%
const PAYSTACK_FLAT = 100; // ₦100

export function calculateFees(servicePrice: number) {
  const freshpointFee = Math.round(servicePrice * FRESHPOINT_COMMISSION_RATE);
  const paystackFee = Math.round(servicePrice * PAYSTACK_RATE) + PAYSTACK_FLAT;
  const providerPayout = servicePrice - freshpointFee;
  const freshpointNet = freshpointFee - paystackFee;

  return {
    servicePrice,
    freshpointFee,
    paystackFee,
    providerPayout,
    freshpointNet,
  };
}

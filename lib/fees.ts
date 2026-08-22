// lib/fees.ts

const PAYSTACK_RATE = 0.015; // 1.5%
const PAYSTACK_FLAT = 100; // ₦100

export function calculateFees(servicePrice: number, commissionRate: number) {
  const freshpointFee = Math.round(servicePrice * commissionRate);
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

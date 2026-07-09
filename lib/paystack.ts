import { PaystackVerifyResponse } from "@/app/api/orders/confirm/utils"; // or move this type to a shared types file

const secretKey = process.env.PAYSTACK_SECRET_KEY;

/**
 * Single shared utility to verify payment state across all marketplace entities.
 */
export async function verifyPaystackPayment(
  reference: string,
): Promise<boolean> {
  if (!secretKey) {
    console.error(
      "❌ [FreshPoint Gateway] CRITICAL ERROR: PAYSTACK_SECRET_KEY is missing.",
    );
    throw new Error(
      "Internal Server Configuration Error: Missing Secret Authorization Key",
    );
  }

  const verifyUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;
  console.log(
    `📡 [FreshPoint Gateway] Dispatched shared handshake to: ${verifyUrl}`,
  );

  try {
    const response = await fetch(verifyUrl, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    console.log(
      `📥 [FreshPoint Gateway] Handshake returned status: ${response.status}`,
    );

    if (!response.ok) return false;

    const verifyData = (await response.json()) as PaystackVerifyResponse;
    return verifyData?.status && verifyData?.data?.status === "success";
  } catch (fetchError: unknown) {
    console.error(
      "💥 [FreshPoint Gateway] Socket execution failed:",
      fetchError,
    );
    return false;
  }
}

/**
 * Generates an accurate timestamp specifically locked to West Africa Time (WAT - UTC+1)
 * regardless of where the serverless function executes.
 */
export function getNigerianTimestamp(): Date {
  const now = new Date();
  // Vercel server time is UTC. Add 1 hour to match WAT.
  const watOffsetMs = 1 * 60 * 60 * 1000;
  return new Date(now.getTime() + watOffsetMs);
}

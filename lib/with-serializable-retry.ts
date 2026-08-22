import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Runs a transaction at SERIALIZABLE isolation, the strongest level Postgres
 * offers. If two concurrent requests would create a double-booking, Postgres
 * detects the conflict and forces one to fail with a retryable error — this
 * function catches that specific case and retries automatically, so the
 * caller just sees either a clean success or a genuine business-rule reject.
 */
export async function runSerializableWithRetry<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let attempt = 0;
  for (;;) {
    attempt++;
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      });
    } catch (err: any) {
      const isSerializationConflict =
        err?.code === "P2034" ||
        (typeof err?.message === "string" &&
          err.message.includes("could not serialize access"));

      if (isSerializationConflict && attempt < maxAttempts) {
        continue; // safe to retry — no partial writes occurred
      }
      throw err;
    }
  }
}

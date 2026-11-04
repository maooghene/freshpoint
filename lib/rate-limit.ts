import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiting backed by the Postgres database, so it works
 * across serverless instances without a separate service. Each (rule, caller)
 * pair has one row; a single atomic upsert counts the request and reports
 * whether it is over the limit.
 *
 * It fails open: if the database call errors, the request is allowed and the
 * error is logged, so a limiter outage never takes the app down.
 */

export interface RateLimitRule {
  /** Short stable name for the rule, e.g. "support-chat". */
  name: string;
  /** Maximum requests allowed per window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-vercel-forwarded-for") ?? headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip")?.trim() || "unknown";
}

export async function checkRateLimit(
  rule: RateLimitRule,
  identity: string,
): Promise<RateLimitResult> {
  const key = `${rule.name}:${identity}`.slice(0, 200);
  const windowMs = rule.windowSec * 1000;
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1
          ELSE "RateLimitBucket"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${resetAt}
          ELSE "RateLimitBucket"."resetAt"
        END
      RETURNING "count", "resetAt"
    `;
    const row = rows[0];
    if (!row) return { ok: true, remaining: rule.limit, retryAfterSec: 0 };

    const count = Number(row.count);
    const retryAfterSec = Math.max(
      1,
      Math.ceil((new Date(row.resetAt).getTime() - now.getTime()) / 1000),
    );
    return {
      ok: count <= rule.limit,
      remaining: Math.max(0, rule.limit - count),
      retryAfterSec,
    };
  } catch (error) {
    console.error("RATE_LIMIT_CHECK_FAILURE:", error);
    return { ok: true, remaining: rule.limit, retryAfterSec: 0 };
  }
}

export function tooManyRequests(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    {
      error: "Too many requests. Please slow down and try again shortly.",
      code: "RATE_LIMITED",
      retryAfterSec,
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}

/**
 * Route-handler helper. Returns a 429 response when the caller is over the
 * limit, or null when the request may proceed:
 *
 *   const limited = await rateLimit(request, RATE_LIMITS.aiChat);
 *   if (limited) return limited;
 *
 * Signed-in callers are counted by their Clerk user id; everyone else by
 * client IP (pass `{ byIp: true }` to force IP counting). Many Nigerian mobile
 * users share one IP, so IP-only rules should stay generous.
 */
export async function rateLimit(
  request: Request,
  rule: RateLimitRule,
  options: { byIp?: boolean } = {},
): Promise<NextResponse | null> {
  let identity = `ip:${getClientIp(request.headers)}`;
  if (!options.byIp) {
    try {
      const { userId } = await auth();
      if (userId) identity = `u:${userId}`;
    } catch {
      // No Clerk context (e.g. called outside middleware): fall back to IP.
    }
  }
  const result = await checkRateLimit(rule, identity);
  return result.ok ? null : tooManyRequests(result.retryAfterSec);
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;

/** Central place to tune limits. */
export const RATE_LIMITS = {
  // AI routes cost money per call: tight per user, plus a looser per-IP cap.
  aiChat: { name: "ai-chat", limit: 20, windowSec: 10 * MINUTE },
  aiChatIp: { name: "ai-chat-ip", limit: 60, windowSec: HOUR },
  // Public writes that create records.
  bookingCreate: { name: "booking-create", limit: 15, windowSec: 10 * MINUTE },
  ratingCreate: { name: "rating-create", limit: 15, windowSec: 10 * MINUTE },
  // Lookups that could be used to enumerate booking references.
  bookingLookup: { name: "booking-lookup", limit: 40, windowSec: 10 * MINUTE },
  // Authenticated writes, uploads and payment steps.
  upload: { name: "upload", limit: 30, windowSec: 10 * MINUTE },
  payment: { name: "payment", limit: 20, windowSec: 10 * MINUTE },
  mutation: { name: "mutation", limit: 120, windowSec: 10 * MINUTE },
  registration: { name: "register-business", limit: 5, windowSec: HOUR },
  geocode: { name: "geocode", limit: 60, windowSec: 10 * MINUTE },
} satisfies Record<string, RateLimitRule>;

import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Shared request validation for API routes.
 *
 * Usage:
 *   const parsed = await parseJsonBody(request, schema);
 *   if (!parsed.ok) return parsed.response;
 *   const { field } = parsed.data;   // fully typed, trimmed and bounded
 *
 * Every client-supplied value is untrusted. Schemas should bound string
 * lengths and numbers, and use enums for anything written to a status column.
 */

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

function badRequest(message: string, issues?: { path: string; message: string }[]) {
  return NextResponse.json(
    { error: message, ...(issues ? { issues } : {}) },
    { status: 400 },
  );
}

function summarizeIssues(error: z.ZodError) {
  return error.issues.slice(0, 5).map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

/** Validates an already-parsed value (form fields, route params, query). */
export function parseValue<S extends z.ZodType>(
  value: unknown,
  schema: S,
): ParseResult<z.output<S>> {
  const result = schema.safeParse(value);
  if (!result.success) {
    return {
      ok: false,
      response: badRequest("Invalid request", summarizeIssues(result.error)),
    };
  }
  return { ok: true, data: result.data };
}

/** Reads and validates a JSON request body. Malformed JSON is a 400, not a 500. */
export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<ParseResult<z.output<S>>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: badRequest("Invalid JSON body") };
  }
  return parseValue(raw, schema);
}

/**
 * Validates the plain text fields of a multipart form. File entries are
 * skipped here and must be checked separately (type and size).
 */
export function parseFormFields<S extends z.ZodType>(
  formData: FormData,
  schema: S,
): ParseResult<z.output<S>> {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") fields[key] = value;
  }
  return parseValue(fields, schema);
}

/**
 * Escapes a value before it is placed inside HTML (emails, notifications).
 * User-supplied names must never be interpolated into markup unescaped.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Checks an uploaded image. Returns an error message, or null when it is fine.
 * An absent file (or an empty file input) is fine unless `required` is true.
 */
export function validateImageFile(
  file: File | null | undefined,
  required = false,
): string | null {
  if (!file || typeof file === "string" || file.size === 0) {
    return required ? "An image file is required" : null;
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Image must be a JPEG, PNG, WebP or GIF file";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be 5 MB or smaller";
  }
  return null;
}

/** Makes a client-supplied file name safe to use in a storage path. */
export function safeFileName(name: string): string {
  return name.replace(/[^\w.\-]/g, "_").slice(-80) || "upload";
}

// ── Reusable building blocks ────────────────────────────────────────────

/** Database ids (cuid / uuid / Clerk ids). Bounded so huge strings are rejected. */
export const idSchema = z.string().trim().min(1).max(128);

/** Free text with a hard upper bound. */
export const text = (max: number, min = 1) => z.string().trim().min(min).max(max);

/** Optional free text; empty strings become undefined. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

export const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .regex(/^[+()\-\s\d]*$/, "Invalid phone number");

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

/** Money amount in naira: finite, non-negative, bounded. */
export const nairaSchema = z.number().finite().min(0).max(100_000_000);

/** Positive whole quantity. */
export const quantitySchema = z.number().int().min(1).max(1000);

export const latitudeSchema = z.number().min(-90).max(90);
export const longitudeSchema = z.number().min(-180).max(180);

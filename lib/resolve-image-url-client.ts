/**
 * Client-safe version of the image URL resolver — no ImageKit SDK,
 * no private key, just string formatting. Use this in any "use client"
 * component. For server components/API routes, use lib/resolve-image-url.ts
 * instead, which applies real ImageKit transformations.
 */
export function resolveImageUrlClient(
  savedPath: string | null | undefined,
): string | null {
  if (!savedPath || savedPath.trim().length === 0) {
    return null;
  }

  const trimmed = savedPath.trim();

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.includes("imagekit.io")
  ) {
    // Already a full URL — whether pre-transformed or raw, it's already
    // usable as-is. No re-wrapping needed here since we don't have SDK
    // access on the client to safely rebuild transformation URLs.
    return trimmed;
  }

  const rawEndpoint =
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.trim() ??
    "https://ik.imagekit.io/kpre23ygt";
  const sanitizedEndpoint = rawEndpoint.replace(/\/+$/, "");
  const cleanToken = trimmed.replace(/^\//, "");

  return `${sanitizedEndpoint}/${cleanToken}`;
}

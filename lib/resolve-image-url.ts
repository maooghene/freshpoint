import imagekit from "@/config/imageKit";

export function resolveAbsoluteImageUrl(
  rawImage: string | null,
): string | null {
  if (!rawImage?.trim()) return null;
  const trimmedImage = rawImage.trim();
  const rawEndpoint =
    process.env.IMAGEKIT_URL_ENDPOINT?.trim() ??
    "https://ik.imagekit.io/kpre23ygt";
  const sanitizedEndpoint = rawEndpoint.replace(/\/+$/, "");

  try {
    const url = new URL(trimmedImage);
    const endpointUrl = new URL(sanitizedEndpoint);
    if (url.hostname === endpointUrl.hostname) {
      let cleanedPath = url.pathname
        .replace(endpointUrl.pathname, "")
        .replace(/^\/+/, "");

      // Strip any existing ImageKit transformation segment
      // (e.g. "tr:q-auto:f-webp:w-512/") to avoid double-nested URLs
      cleanedPath = cleanedPath.replace(/^tr:[^/]+\//, "");

      return imagekit.url({
        path: cleanedPath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "768" },
        ],
      });
    }
  } catch {
    // not a full URL; continue normal resolution
  }

  if (/^\/uploads\//i.test(trimmedImage) || /^uploads\//i.test(trimmedImage)) {
    return null;
  }

  if (trimmedImage.startsWith("/")) return encodeURI(trimmedImage);

  return `${sanitizedEndpoint}/${encodeURI(trimmedImage.replace(/^\//, ""))}`;
}

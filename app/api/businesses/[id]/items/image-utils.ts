import imagekit from "@/config/imageKit";

/**
 * Handles binary multipart form data stream conversion and pushes it to ImageKit.
 */
export const uploadItemImage = async (imageFile: File): Promise<string> => {
  console.log(
    `📸 Uploading image: ${imageFile.name} | Size: ${imageFile.size}B | Type: ${imageFile.type}`,
  );

  const buffer = Buffer.from(await imageFile.arrayBuffer());
  const safeName = imageFile.name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");

  const uploadResponse = await imagekit.upload({
    file: buffer,
    fileName: `${Date.now()}-${safeName}`,
    folder: "/uploads",
  });

  console.log(`✅ ImageKit upload complete: ${uploadResponse.url}`);
  return uploadResponse.url;
};

/**
 * Normalizes absolute resource strings into validated CDN URLs using structured transformations.
 */
export const resolveItemImageUrl = (rawImage: string | null): string | null => {
  if (!rawImage?.trim()) return null;
  const trimmed = rawImage.trim();

  const endpoint =
    process.env.IMAGEKIT_URL_ENDPOINT?.trim() ?? "https://imagekit.io";
  const sanitizedEndpoint = endpoint.replace(/\/+$/, "");

  try {
    const url = new URL(trimmed);
    const endpointUrl = new URL(sanitizedEndpoint);

    if (url.hostname === endpointUrl.hostname) {
      const cleanedPath = url.pathname
        .replace(endpointUrl.pathname, "")
        .replace(/^\/+/, "");

      return imagekit.url({
        path: cleanedPath,
        // CORRECTED: Hardened literal integer format prevents generation of a broken tr:w-"768" string
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: 768 },
        ],
      });
    }
  } catch {
    // String is likely a raw path fragment; fall through to fallback concatenation
  }

  if (trimmed.startsWith("/")) return encodeURI(trimmed);
  return `${sanitizedEndpoint}/${encodeURI(trimmed.replace(/^\//, ""))}`;
};

/**
 * Resizes and compresses an image file in-browser before upload.
 * Keeps aspect ratio, caps the longest side at maxDimension, and
 * re-encodes as JPEG at the given quality.
 */
export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.8,
): Promise<File> {
  // Skip compression for already-small files or non-image types
  if (!file.type.startsWith("image/") || file.size < 500 * 1024) {
    return file;
  }

  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return file; // Fallback: canvas unsupported, use original

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );

  if (!blob) return file; // Fallback: encoding failed, use original

  // Preserve original filename but force .jpg extension since we re-encoded as JPEG
  const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";

  return new File([blob], newName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

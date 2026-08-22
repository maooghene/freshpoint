/**
 * Uploads a file directly from the browser to ImageKit, bypassing our
 * own server as a relay. Returns the final CDN URL.
 */
export async function uploadToImageKit(file: File): Promise<string> {
  // 1. Get a short-lived signed token from our own server
  const authRes = await fetch("/api/imagekit/auth");
  if (!authRes.ok) {
    throw new Error("Failed to get upload authorization");
  }
  const { token, expire, signature } = await authRes.json();

  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error("Missing NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY env variable");
  }

  const safeName = file.name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");

  // 2. Upload directly to ImageKit's API from the browser
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", `${Date.now()}-${safeName}`);
  formData.append("folder", "/uploads");
  formData.append("publicKey", publicKey);
  formData.append("signature", signature);
  formData.append("expire", expire.toString());
  formData.append("token", token);

  const uploadRes = await fetch(
    "https://upload.imagekit.io/api/v1/files/upload",
    {
      method: "POST",
      body: formData,
    },
  );

  if (!uploadRes.ok) {
    const errorBody = await uploadRes.json().catch(() => null);
    throw new Error(errorBody?.message || "ImageKit upload failed");
  }

  const data = await uploadRes.json();
  return data.url as string;
}

// lib/imagekit.ts

interface ImageKitUploadResponse {
  filePath: string;
  url: string;
  [key: string]: unknown;
}

export async function uploadToImageKit(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (!privateKey || !publicKey || !urlEndpoint) {
    throw new Error("Missing structural ImageKit environment variables.");
  }

  // Set up the standard multi-part payload structure required by ImageKit APIs
  const formData = new FormData();
  formData.append("file", new Blob([buffer]), file.name);
  formData.append("fileName", `freshpoint-${Date.now()}-${file.name}`);
  formData.append("useUniqueFileName", "true");

  const authHeader = Buffer.from(`${privateKey}:`).toString("base64");

  const response = await fetch("https://imagekit.io", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ImageKit Core Upload Fault: ${errorText}`);
  }

  const data = (await response.json()) as ImageKitUploadResponse;

  // Return the direct clean token path (e.g. "uploads/abc.jpg") rather than the massive full URL
  return data.filePath.replace(/^\//, "");
}

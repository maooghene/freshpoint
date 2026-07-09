interface LoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Standardizes outbound Next.js asset paths to format optimizations
 * using ImageKit's native CDN edge processing parameters.
 */
export default function imageKitLoader({
  src,
  width,
  quality,
}: LoaderProps): string {
  // If the source string is empty or a local file fallback path, bypass processing
  if (!src || src.startsWith("/")) return src;

  const baseUrl = "https://ik.imagekit.io/kpre23ygt/";

  if (src.startsWith(baseUrl)) {
    // Extract the raw file path segment relative to the endpoint root
    const relativePath = src.replace(baseUrl, "");
    const params = [`tr:w-${width}`];

    if (quality) {
      params.push(`q-${quality}`);
    }

    return `${baseUrl}${params.join(",")}/${relativePath}`;
  }

  return src;
}

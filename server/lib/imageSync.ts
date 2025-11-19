/**
 * Image synchronization utilities
 * Downloads images from external sources and uploads to S3
 */

import { storagePut } from "../storage";

/**
 * Download image from URL and upload to S3
 * @param imageUrl - Source image URL
 * @param productSku - Product SKU for file naming
 * @returns S3 URL of uploaded image, or null if failed
 */
export async function downloadAndUploadImage(
  imageUrl: string,
  productSku: string
): Promise<string | null> {
  try {
    // Download image from source URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`[ImageSync] Failed to download image from ${imageUrl}: ${response.status}`);
      return null;
    }

    // Get image buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine content type from response headers
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Extract file extension from content type
    const ext = contentType.split("/")[1] || "jpg";

    // Generate unique file key with random suffix to prevent enumeration
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const fileKey = `products/${productSku}-${randomSuffix}.${ext}`;

    // Upload to S3
    const { url } = await storagePut(fileKey, buffer, contentType);

    console.log(`[ImageSync] Successfully uploaded image for ${productSku} to ${url}`);
    return url;
  } catch (error) {
    console.error(`[ImageSync] Error syncing image for ${productSku}:`, error);
    return null;
  }
}

/**
 * Download multiple images and return URLs
 * @param images - Array of {url, sku} objects
 * @returns Array of S3 URLs (null for failed uploads)
 */
export async function downloadAndUploadImages(
  images: Array<{ url: string; sku: string }>
): Promise<Array<string | null>> {
  return Promise.all(
    images.map(({ url, sku }) => downloadAndUploadImage(url, sku))
  );
}

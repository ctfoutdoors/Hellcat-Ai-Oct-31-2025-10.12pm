/**
 * Client-side storage helper
 * Uploads files to S3 via backend API
 */

export async function storagePut(
  key: string,
  data: Uint8Array | ArrayBuffer,
  contentType: string
): Promise<{ url: string; key: string }> {
  // Convert to base64 for transport
  const buffer = data instanceof Uint8Array ? data : new Uint8Array(data);
  const base64 = btoa(String.fromCharCode(...buffer));

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      data: base64,
      contentType,
    }),
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}

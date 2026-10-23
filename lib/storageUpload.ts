/**
 * Helper to upload images directly to Supabase Storage bucket ('images') via /api/upload.
 * Converts Files, Blobs, and base64 data URLs to permanent public Supabase Storage CDN URLs.
 * Guarantees that raw data:image/... base64 strings are NEVER saved to the database.
 */

import { MAX_ORIGINAL_IMAGE_BYTES } from "@/lib/productImageUpload";

export function isBase64Image(val: unknown): boolean {
  return typeof val === "string" && val.startsWith("data:image/");
}

export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/webp";
  const binaryString = atob(parts[1] || "");
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export async function uploadSingleImage(
  image: string | File | Blob,
  folder: string = "products"
): Promise<string> {
  if (!image) return "";

  // If already a regular web URL (CDN, Supabase, Unsplash, etc.) and not base64, return as is
  if (typeof image === "string" && !isBase64Image(image)) {
    return image;
  }

  const uploadBlob = typeof image === "string" ? base64ToBlob(image) : image;
  if (uploadBlob.size > MAX_ORIGINAL_IMAGE_BYTES) {
    throw new Error("Cannot upload an image over 1 MB. Choose an image of 1 MB or less.");
  }

  const formData = new FormData();
  formData.append("folder", folder);

  if (typeof image === "string") {
    const blob = uploadBlob;
    const ext = (blob.type.split("/")[1] || "webp").replace("jpeg", "jpg");
    formData.append("file", blob, `upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`);
  } else if (image instanceof File) {
    formData.append("file", image, image.name);
  } else if (image instanceof Blob) {
    const ext = (image.type.split("/")[1] || "webp").replace("jpeg", "jpg");
    formData.append("file", image, `upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`);
  }

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errMessage = `Upload failed with HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.error) errMessage = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }

  const data = await response.json();
  const returnedUrl = data?.url || (Array.isArray(data?.urls) ? data.urls[0] : null);

  if (!returnedUrl) {
    throw new Error("Upload succeeded but no public URL was returned from the server.");
  }

  return returnedUrl;
}

export async function uploadMultipleImages(
  images: (string | File | Blob)[],
  folder: string = "products"
): Promise<string[]> {
  if (!Array.isArray(images) || images.length === 0) return [];

  // Upload all images in parallel
  const results = await Promise.all(
    images.map((img) => uploadSingleImage(img, folder))
  );

  return results;
}

import { productCardUrl } from "@/lib/productImages";

export const MAX_ORIGINAL_IMAGE_BYTES = 1_000_000;

function imageSizeIssue(file: File): string | null {
  return file.size > MAX_ORIGINAL_IMAGE_BYTES
    ? `Size: ${(file.size / 1_000_000).toFixed(2)} MB exceeds the 1 MB maximum.`
    : null;
}

export function validateOriginalImageSize(file: File): void {
  const issue = imageSizeIssue(file);
  if (issue) throw new Error(`Cannot upload "${file.name}": ${issue}`);
}

export const PRODUCT_IMAGE_RULES = {
  detail: { width: 1200, height: 1500, maxBytes: 400 * 1024 },
  card: { width: 480, height: 600, maxBytes: 100 * 1024 },
} as const;

export const IMAGE_SLOT_RULES = {
  category: { folder: "categories", width: 800, height: 1000, maxBytes: 200 * 1024 },
  instagram: { folder: "instagram", width: 800, height: 800, maxBytes: 150 * 1024 },
  mobileBanner: { folder: "banners", width: 800, height: 1000, maxBytes: 300 * 1024 },
  landscapeBanner: { folder: "banners", width: 1600, height: 500, maxBytes: 400 * 1024 },
} as const;

export type ImageSlot = keyof typeof IMAGE_SLOT_RULES;

export class WebpEncodingUnavailable extends Error {
  constructor() {
    super("This browser cannot create WebP images.");
    this.name = "WebpEncodingUnavailable";
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read this image.")); };
    image.src = url;
  });
}

export async function inspectImageUpload(file: File, slot: ImageSlot | "product" | null): Promise<string[]> {
  const issues: string[] = [];
  const sizeIssue = imageSizeIssue(file);
  if (sizeIssue) issues.push(sizeIssue);
  if (!file.type.startsWith("image/")) {
    issues.push("Format: Choose an image file.");
    return issues;
  }
  if (!slot) return issues;

  let image: HTMLImageElement;
  try {
    image = await loadImage(file);
  } catch {
    issues.push("Dimensions: Could not read this image.");
    return issues;
  }
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const rules = slot === "product" ? PRODUCT_IMAGE_RULES.detail : IMAGE_SLOT_RULES[slot];
  if (width < rules.width || height < rules.height || width * rules.height !== height * rules.width) {
    issues.push(`Dimensions: ${width} × ${height} px. Required: at least ${rules.width} × ${rules.height} px with the same proportions.`);
  }
  return issues;
}

async function makeWebp(image: HTMLImageElement, width: number, height: number, maxBytes: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot process images.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  for (const quality of [0.82, 0.75, 0.68, 0.6, 0.52, 0.45]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob || blob.type !== "image/webp") throw new WebpEncodingUnavailable();
    if (blob.size <= maxBytes) return blob;
  }
  throw new Error(`This image cannot be reduced below ${Math.round(maxBytes / 1024)} KB without excessive quality loss. Choose a simpler photo.`);
}

export async function prepareProductImage(file: File): Promise<{ detail: Blob; card: Blob }> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  validateOriginalImageSize(file);
  const image = await loadImage(file);
  const { naturalWidth: width, naturalHeight: height } = image;
  if (width < PRODUCT_IMAGE_RULES.detail.width || height < PRODUCT_IMAGE_RULES.detail.height) {
    throw new Error("Product photos must be at least 1200 × 1500 px.");
  }
  if (width * 5 !== height * 4) {
    throw new Error("Product photos must have a 4:5 portrait shape (for example 1200 × 1500 px). No photo will be cropped.");
  }

  const detail = await makeWebp(image, PRODUCT_IMAGE_RULES.detail.width, PRODUCT_IMAGE_RULES.detail.height, PRODUCT_IMAGE_RULES.detail.maxBytes);
  const card = await makeWebp(image, PRODUCT_IMAGE_RULES.card.width, PRODUCT_IMAGE_RULES.card.height, PRODUCT_IMAGE_RULES.card.maxBytes);
  return { detail, card };
}

export async function uploadProductImage({ detail, card }: { detail: Blob; card: Blob }): Promise<string> {
  const body = new FormData();
  body.append("productPair", "true");
  body.append("detail", detail, "detail.webp");
  body.append("card", card, "card.webp");
  const response = await fetch("/api/upload", { method: "POST", body });
  const result = await response.json();
  if (!response.ok || !result?.url) throw new Error(result?.error || "Could not upload this image.");
  if (productCardUrl(result.url) === result.url) throw new Error("The uploaded image pair has an invalid URL.");
  return result.url;
}

export async function prepareSlotImage(file: File, slot: ImageSlot): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  validateOriginalImageSize(file);
  const rules = IMAGE_SLOT_RULES[slot];
  const image = await loadImage(file);
  const { naturalWidth: width, naturalHeight: height } = image;
  if (width < rules.width || height < rules.height) {
    throw new Error(`This image must be at least ${rules.width} × ${rules.height} px.`);
  }
  if (width * rules.height !== height * rules.width) {
    throw new Error(`This image needs a ${rules.width}:${rules.height} shape. No photo will be cropped.`);
  }
  return makeWebp(image, rules.width, rules.height, rules.maxBytes);
}

export async function uploadSlotImage(output: Blob, slot: ImageSlot): Promise<string> {
  const body = new FormData();
  body.append("imageSlot", slot);
  body.append("file", output, `${slot}.webp`);
  const response = await fetch("/api/upload", { method: "POST", body });
  const result = await response.json();
  if (!response.ok || !result?.url) throw new Error(result?.error || "Could not upload this image.");
  return result.url;
}

export async function uploadOriginalForServerConversion(file: File, slot: ImageSlot | "product"): Promise<string> {
  validateOriginalImageSize(file);
  const body = new FormData();
  body.append("sourceFile", file);
  if (slot === "product") body.append("productSource", "true");
  else body.append("imageSlot", slot);
  const response = await fetch("/api/upload", { method: "POST", body });
  const result = await response.json();
  if (!response.ok || !result?.url) throw new Error(result?.error || "Could not upload this image.");
  if (slot === "product" && productCardUrl(result.url) === result.url) {
    throw new Error("The uploaded image pair has an invalid URL.");
  }
  return result.url;
}

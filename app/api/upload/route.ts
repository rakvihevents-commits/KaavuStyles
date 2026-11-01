import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { IMAGE_SLOT_RULES, MAX_ORIGINAL_IMAGE_BYTES, PRODUCT_IMAGE_RULES, type ImageSlot } from "@/lib/productImageUpload";
import { requireAdmin } from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function webpDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP" || buffer.readUInt32LE(4) + 8 !== buffer.length) return null;
  const format = buffer.toString("ascii", 12, 16);
  if (format === "VP8 ") {
    if (buffer[23] !== 0x9d || buffer[24] !== 0x01 || buffer[25] !== 0x2a) return null;
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (format === "VP8L") {
    if (buffer[20] !== 0x2f) return null;
    return {
      width: 1 + (buffer[21] | ((buffer[22] & 0x3f) << 8)),
      height: 1 + ((buffer[22] >> 6) | (buffer[23] << 2) | ((buffer[24] & 0x0f) << 10)),
    };
  }
  if (format === "VP8X") {
    return {
      width: 1 + buffer[24] + (buffer[25] << 8) + (buffer[26] << 16),
      height: 1 + buffer[27] + (buffer[28] << 8) + (buffer[29] << 16),
    };
  }
  return null;
}

async function convertSource(file: File, width: number, height: number, maxBytes: number): Promise<Buffer> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  if (file.size > MAX_ORIGINAL_IMAGE_BYTES) {
    throw new Error("Cannot upload an image over 1 MB. Choose an image of 1 MB or less.");
  }
  const source = Buffer.from(await file.arrayBuffer());
  let metadata;
  try {
    metadata = await sharp(source, { limitInputPixels: 30_000_000 }).metadata();
  } catch {
    throw new Error("Could not read this image.");
  }
  const sourceWidth = metadata.orientation && metadata.orientation >= 5 && metadata.orientation <= 8 ? metadata.height : metadata.width;
  const sourceHeight = metadata.orientation && metadata.orientation >= 5 && metadata.orientation <= 8 ? metadata.width : metadata.height;
  if (!sourceWidth || !sourceHeight) throw new Error("Could not read this image.");
  for (const quality of [82, 75, 68, 60, 52, 45]) {
    const output = await sharp(source, { limitInputPixels: 30_000_000 })
      .rotate()
      .resize(width, height, { fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
      .webp({ quality, effort: 5 })
      .toBuffer();
    if (output.length <= maxBytes) return output;
  }
  throw new Error(`This image cannot be reduced below ${Math.round(maxBytes / 1024)} KB without excessive quality loss. Choose a simpler photo.`);
}

export async function POST(req: NextRequest) {
  try {
    try { requireAdmin(req); }
    catch { return NextResponse.json({ error: "Please sign in to the admin panel again." }, { status: 401 }); }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Supabase credentials not configured on server" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Ensure bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const hasImages = buckets?.some(
        (b) => b.name === "images" || b.id === "images"
      );
      if (!hasImages) {
        await supabase.storage.createBucket("images", {
          public: true,
          fileSizeLimit: 10485760,
          allowedMimeTypes: [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
            "image/gif",
          ],
        });
      }
    } catch {
      // Continue even if listBuckets fails
    }

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      if (formData.get("productPair") === "true" || formData.get("productSource") === "true") {
        let detailBytes: Buffer;
        let cardBytes: Buffer;
        if (formData.get("productSource") === "true") {
          const source = formData.get("sourceFile");
          if (!(source instanceof File)) return NextResponse.json({ error: "An image file is required." }, { status: 400 });
          try {
            detailBytes = await convertSource(source, PRODUCT_IMAGE_RULES.detail.width, PRODUCT_IMAGE_RULES.detail.height, PRODUCT_IMAGE_RULES.detail.maxBytes);
            cardBytes = await convertSource(source, PRODUCT_IMAGE_RULES.card.width, PRODUCT_IMAGE_RULES.card.height, PRODUCT_IMAGE_RULES.card.maxBytes);
          } catch (error) {
            return NextResponse.json({ error: error instanceof Error ? error.message : "Could not process this image." }, { status: 400 });
          }
        } else {
          const detail = formData.get("detail");
          const card = formData.get("card");
          if (!(detail instanceof File) || !(card instanceof File)) {
            return NextResponse.json({ error: "Both product image sizes are required." }, { status: 400 });
          }
          detailBytes = Buffer.from(await detail.arrayBuffer());
          cardBytes = Buffer.from(await card.arrayBuffer());
        }
        for (const [name, bytes, rules] of [
          ["Detail", detailBytes, PRODUCT_IMAGE_RULES.detail],
          ["Card", cardBytes, PRODUCT_IMAGE_RULES.card],
        ] as const) {
          const dimensions = webpDimensions(bytes);
          if (!dimensions || dimensions.width > rules.width || dimensions.height > rules.height || bytes.length > rules.maxBytes) {
            return NextResponse.json({ error: `${name} image must be WebP, up to ${rules.width} × ${rules.height} px, and at most ${Math.round(rules.maxBytes / 1024)} KB.` }, { status: 400 });
          }
        }
        const key = `product-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const detailPath = `products/${key}-detail.webp`;
        const cardPath = `products/${key}-card.webp`;
        const uploadedPaths: string[] = [];
        for (const [path, bytes] of [[detailPath, detailBytes], [cardPath, cardBytes]] as const) {
          const { error } = await supabase.storage.from("images").upload(path, bytes, {
            contentType: "image/webp", cacheControl: "31536000", upsert: false,
          });
          if (error) {
            if (uploadedPaths.length) await supabase.storage.from("images").remove(uploadedPaths);
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
          uploadedPaths.push(path);
        }
        const { data } = supabase.storage.from("images").getPublicUrl(detailPath);
        return NextResponse.json({ success: true, url: data.publicUrl });
      }
      const imageSlot = formData.get("imageSlot");
      if (imageSlot !== null && (typeof imageSlot !== "string" || !Object.prototype.hasOwnProperty.call(IMAGE_SLOT_RULES, imageSlot))) {
        return NextResponse.json({ error: "Unknown image upload slot." }, { status: 400 });
      }
      if (typeof imageSlot === "string" && Object.prototype.hasOwnProperty.call(IMAGE_SLOT_RULES, imageSlot)) {
        const rules = IMAGE_SLOT_RULES[imageSlot as ImageSlot];
        let bytes: Buffer;
        if (formData.has("sourceFile")) {
          const source = formData.get("sourceFile");
          if (!(source instanceof File)) return NextResponse.json({ error: "An image file is required." }, { status: 400 });
          try {
            bytes = await convertSource(source, rules.width, rules.height, rules.maxBytes);
          } catch (error) {
            return NextResponse.json({ error: error instanceof Error ? error.message : "Could not process this image." }, { status: 400 });
          }
        } else {
          const file = formData.get("file");
          if (!(file instanceof File)) return NextResponse.json({ error: "An image file is required." }, { status: 400 });
          bytes = Buffer.from(await file.arrayBuffer());
        }
        const dimensions = webpDimensions(bytes);
        if (!dimensions || dimensions.width > rules.width || dimensions.height > rules.height || bytes.length > rules.maxBytes) {
          return NextResponse.json({ error: `Image must be WebP, up to ${rules.width} × ${rules.height} px, and at most ${Math.round(rules.maxBytes / 1024)} KB.` }, { status: 400 });
        }
        const path = `${rules.folder}/${imageSlot}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.webp`;
        const { error } = await supabase.storage.from("images").upload(path, bytes, {
          contentType: "image/webp", cacheControl: "31536000", upsert: false,
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        const { data } = supabase.storage.from("images").getPublicUrl(path);
        return NextResponse.json({ success: true, url: data.publicUrl });
      }
      const files = formData.getAll("file") as File[];
      const folder = ((formData.get("folder") as string) || "products").replace(
        /[^a-zA-Z0-9_-]/g,
        ""
      );

      if (["products", "categories", "banners", "instagram"].includes(folder)) {
        return NextResponse.json({ error: "Use the image uploader for this slot so its dimensions and file size can be checked." }, { status: 400 });
      }

      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: "No files found in form data" },
          { status: 400 }
        );
      }

      const uploadedUrls: string[] = [];

      for (const file of files) {
        if (!(file instanceof File) || file.size > MAX_ORIGINAL_IMAGE_BYTES) {
          return NextResponse.json({ error: "Cannot upload an image over 1 MB. Choose an image of 1 MB or less." }, { status: 400 });
        }
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const originalName = file.name || "photo.webp";
        const parts = originalName.split(".");
        const extension = (parts.length > 1 ? parts.pop()! : "webp").toLowerCase();
        const safeBaseName = parts
          .join(".")
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .substring(0, 30);
        const fileName = `${safeBaseName || "img"}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 7)}.${extension}`;
        const filePath = `${folder}/${fileName}`;

        let mimeType = file.type;
        if (!mimeType || mimeType === "application/octet-stream") {
          mimeType =
            extension === "png"
              ? "image/png"
              : extension === "jpg" || extension === "jpeg"
              ? "image/jpeg"
              : extension === "gif"
              ? "image/gif"
              : "image/webp";
        }

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          return NextResponse.json(
            { error: uploadError.message },
            { status: 500 }
          );
        }

        const { data: publicUrlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      return NextResponse.json({
        success: true,
        urls: uploadedUrls,
        url: uploadedUrls[0],
      });
    } else {
      // Handle JSON base64 payloads
      const body = await req.json();
      const {
        image,
        images,
        folder = "products",
        name = "photo",
      } = body;

      const itemsToUpload = images || (image ? [image] : []);
      if (!Array.isArray(itemsToUpload) || itemsToUpload.length === 0) {
        return NextResponse.json(
          { error: "No image provided in request body" },
          { status: 400 }
        );
      }

      const cleanFolder = String(folder).replace(/[^a-zA-Z0-9_-]/g, "") || "products";
      if (["products", "categories", "banners", "instagram"].includes(cleanFolder) && itemsToUpload.some((item: unknown) => typeof item === "string" && item.startsWith("data:image/"))) {
        return NextResponse.json({ error: "Use the image uploader for this slot so its dimensions and file size can be checked." }, { status: 400 });
      }
      const uploadedUrls: string[] = [];

      for (const item of itemsToUpload) {
        if (typeof item === "string" && item.startsWith("data:image/")) {
          const match = item.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const base64Data = match[2];
            const buffer = Buffer.from(base64Data, "base64");
            if (buffer.length > MAX_ORIGINAL_IMAGE_BYTES) {
              return NextResponse.json({ error: "Cannot upload an image over 1 MB. Choose an image of 1 MB or less." }, { status: 400 });
            }
            const ext =
              mimeType.split("/")[1]?.replace("jpeg", "jpg") || "webp";
            const fileName = `${name}-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 7)}.${ext}`;
            const filePath = `${cleanFolder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("images")
              .upload(filePath, buffer, {
                contentType: mimeType,
                upsert: true,
              });

            if (uploadError) {
              console.error("Base64 upload error:", uploadError);
              return NextResponse.json(
                { error: uploadError.message },
                { status: 500 }
              );
            }

            const { data: publicUrlData } = supabase.storage
              .from("images")
              .getPublicUrl(filePath);

            uploadedUrls.push(publicUrlData.publicUrl);
            continue;
          }
        }
        // If already a remote URL, keep as is
        uploadedUrls.push(item);
      }

      return NextResponse.json({
        success: true,
        urls: uploadedUrls,
        url: uploadedUrls[0],
      });
    }
  } catch (error) {
    console.error("Upload route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

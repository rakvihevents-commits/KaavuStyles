"use client";

import React, { useRef, useState, useId } from "react";
import Image from "next/image";
import { Upload, X, Link as LinkIcon, Plus, Loader2 } from "lucide-react";
import { compressAndOptimizeImage } from "@/lib/utils";
import { WebpEncodingUnavailable, inspectImageUpload, prepareProductImage, prepareSlotImage, uploadOriginalForServerConversion, uploadProductImage, uploadSlotImage, type ImageSlot } from "@/lib/productImageUpload";

import { uploadMultipleImages, uploadSingleImage, isBase64Image } from "@/lib/storageUpload";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  single?: boolean;
  label?: string;
  noOptimize?: boolean;
  maxDimension?: number;
  quality?: number;
  alwaysOptimize?: boolean;
  folder?: string;
  imageSlot?: ImageSlot;
}

export default function ImageUploader({
  images,
  onChange,
  single = false,
  label = "Upload Product Images",
  noOptimize = false,
  maxDimension = 1600,
  quality = 0.85,
  alwaysOptimize = false,
  folder = "products",
  imageSlot,
}: ImageUploaderProps) {
  const labelId = useId();
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [dimensions, setDimensions] = useState<Record<string, { width: number; height: number }>>({});
  const isProductUpload = folder === "products";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || isCompressing) return;
    setUploadError("");

    setIsCompressing(true);
    const fileList = Array.from(files);

    try {
      // Check file size and readability before uploading the selection.
      const checks = await Promise.all(fileList.map(async (file) => ({
        file,
        issues: await inspectImageUpload(file, isProductUpload ? "product" : imageSlot ?? null),
      })));
      const failures = checks.filter(({ issues }) => issues.length > 0);
      if (failures.length > 0) {
        throw new Error(failures.map(({ file, issues }) => `Cannot upload "${file.name}":\n${issues.join("\n")}`).join("\n\n"));
      }
      let preparedImages: string[] = [];

      if (isProductUpload) {
        preparedImages = await Promise.all(fileList.map(async (file) => {
          try {
            return await uploadProductImage(await prepareProductImage(file));
          } catch (error) {
            if (error instanceof WebpEncodingUnavailable) return uploadOriginalForServerConversion(file, "product");
            throw error;
          }
        }));
      } else if (imageSlot) {
        preparedImages = await Promise.all(fileList.map(async (file) => {
          try {
            return await uploadSlotImage(await prepareSlotImage(file, imageSlot), imageSlot);
          } catch (error) {
            if (error instanceof WebpEncodingUnavailable) return uploadOriginalForServerConversion(file, imageSlot);
            throw error;
          }
        }));
      } else if (noOptimize) {
        const promises = fileList.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        );
        preparedImages = await Promise.all(promises);
      } else {
        const promises = fileList.map((file) => compressAndOptimizeImage(file, maxDimension, quality, alwaysOptimize));
        preparedImages = await Promise.all(promises);
      }

      // Upload directly to Supabase Storage bucket via server API route
      const finalUrls = isProductUpload || imageSlot ? preparedImages : await uploadMultipleImages(preparedImages, folder);

      if (single) {
        onChange([finalUrls[0]]);
      } else {
        onChange([...images, ...finalUrls]);
      }
    } catch (err: any) {
      console.error("Image upload error:", err);
      setUploadError(err?.message || "Could not upload your photo. Please try again.");
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed || isCompressing || isProductUpload || imageSlot) return;
    setUploadError("");

    try {
      let finalUrl = trimmed;
      if (isBase64Image(trimmed)) {
        setIsCompressing(true);
        finalUrl = await uploadSingleImage(trimmed, folder);
      }

      if (single) {
        onChange([finalUrl]);
      } else {
        onChange([...images, finalUrl]);
      }
      setUrlInput("");
    } catch (err: any) {
      setUploadError(err?.message || "Could not add your photo. Please try again.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-3 min-w-0" role="group" aria-labelledby={labelId} aria-busy={isCompressing}>
      <div className="flex flex-wrap justify-between items-center gap-2">
        <p id={labelId} className="text-xs font-semibold text-ink">{label}</p>
        {!isProductUpload && !imageSlot && <button type="button" disabled={isCompressing} onClick={() => setIsUrlMode(!isUrlMode)} className="inline-flex items-center gap-1.5 text-xs text-crimson hover:underline disabled:opacity-50">
          {isUrlMode ? <Upload className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
          {isUrlMode ? "Upload from device" : "Paste image URL"}
        </button>}
      </div>
      <div className="rounded-xl border-2 border-gold bg-ivory-50 p-3 sm:p-4 shadow-sm" aria-label="Image upload requirements">
        <p className="text-xs font-bold uppercase tracking-wider text-crimson">Image upload requirements</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink">
          <span className="rounded-md border border-gold/50 bg-white px-3 py-2">Original file: <strong>{isProductUpload ? "5 MB" : "1 MB"} max</strong></span>
          <span className="rounded-md border border-gold/50 bg-white px-3 py-2">Dimensions: <strong>Any size or proportions</strong></span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">Choose an image up to {isProductUpload ? "5 MB" : "1 MB"}. Photos are optimized automatically while keeping their proportions, without cropping or stretching.</p>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple={!single} onChange={handleFileSelect} disabled={isCompressing} className="hidden" aria-label={label} />
      {isUrlMode && !isProductUpload && !imageSlot && <div className="flex flex-col sm:flex-row gap-2">
        <input type="url" aria-label={`Image URL for ${label}`} placeholder="https://example.com/photo.jpg" value={urlInput} disabled={isCompressing} onChange={event => setUrlInput(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-ivory-300 bg-white p-3 text-base sm:text-sm text-ink outline-none focus:border-gold" />
        <button type="button" disabled={isCompressing || !urlInput.trim()} onClick={handleAddUrl} className="rounded-lg px-4 py-3 bg-crimson text-ivory text-xs font-semibold disabled:opacity-50">{single && images.length ? "Replace photo" : "Add photo"}</button>
      </div>}
      <div className="rounded-xl border border-ivory-300 bg-ivory-50 p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {images.map((src, index) => <div key={`${src}-${index}`} className="relative aspect-square min-w-0 rounded-lg overflow-hidden border border-ivory-300 bg-white group">
            <Image src={src} onLoad={(event) => {
              const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
              setDimensions((previous) => previous[src]?.width === width && previous[src]?.height === height
                ? previous : { ...previous, [src]: { width, height } });
            }} alt={`${label}, photo ${index + 1}`} fill sizes="(max-width: 639px) 40vw, (max-width: 1023px) 180px, 120px" className="object-cover" />
            <button type="button" disabled={isCompressing} aria-label={`Remove photo ${index + 1} from ${label}`} onClick={() => handleRemove(index)} className="absolute top-2 right-2 z-10 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/95 text-crimson shadow-sm hover:bg-crimson hover:text-white disabled:opacity-50"><X className="w-4 h-4" /></button>
            {index === 0 && <span className="absolute left-2 top-2 bg-ink/80 px-2 py-1 rounded text-[9px] uppercase tracking-wider text-ivory">Cover</span>}
            {dimensions[src] && <span className="absolute bottom-0 inset-x-0 bg-ink/70 text-white text-[9px] text-center py-1">{dimensions[src].width} × {dimensions[src].height} px</span>}
          </div>)}
          <button type="button" disabled={isCompressing} onClick={() => fileInputRef.current?.click()} className={`rounded-lg border-2 border-dashed border-gold/40 bg-white/60 hover:bg-gold/5 hover:border-gold transition-colors flex flex-col items-center justify-center gap-2 text-center p-4 disabled:cursor-wait ${images.length ? "aspect-square" : "col-span-2 sm:col-span-3 lg:col-span-5 min-h-[180px]"}`}>
            {isCompressing ? <Loader2 className="w-7 h-7 text-gold animate-spin" /> : images.length ? <Plus className="w-8 h-8 text-gold" /> : <Upload className="w-7 h-7 text-gold" />}
            <span className="text-xs font-semibold text-ink">{isCompressing ? "Uploading photos…" : images.length ? single ? "Replace photo" : "Add photo" : "Choose photos from device"}</span>
            {!images.length && !isCompressing && <span className="max-w-xs text-xs text-ink-muted">{noOptimize ? "Choose a photo to preview it here." : single ? "Your photo is optimized automatically." : "Photos are optimized automatically. You can select several at once."}</span>}
          </button>
        </div>
        {images.length > 0 && <p className="mt-3 text-[11px] text-ink-muted">{images.length} photo{images.length === 1 ? "" : "s"}{single ? " · Use Replace photo to choose another." : " · Use + to upload more photos."}</p>}
      </div>
      {uploadError && <p role="alert" className="whitespace-pre-line rounded-lg border border-crimson/40 bg-crimson/5 p-3 text-sm font-medium text-crimson">{uploadError}</p>}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import ShareProduct from "@/components/ShareProduct";
import { Product } from "@/lib/mockData";
import { useStore } from "@/context/StoreContext";
import { stockForSize, stockForVariant, availableVariant } from "@/lib/inventory";
import { formatPrice } from "@/lib/utils";
import { productCardUrl } from "@/lib/productImages";
import {
  X,
  Heart,
  ShoppingBag,
  Truck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
}: {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { addToCart, toggleWishlist, isInWishlist } = useStore();
  const [selectedImage, setSelectedImage] = useState(
    product.images[0] || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800"
  );
  const [selectedSize, setSelectedSize] = useState((product.sizes.length ? product.sizes : ["Standard"]).find(size => stockForSize(product, size) > 0) || product.sizes[0] || "Standard");
  const [selectedColor, setSelectedColor] = useState(availableVariant(product)?.color || product.colors[0] || "Standard");

  const colorSpecificPhotos = product.colorImages?.[selectedColor]?.length
    ? product.colorImages[selectedColor]
    : product.images.filter((img) => img.toLowerCase().includes(selectedColor.toLowerCase()));

  const gallery = colorSpecificPhotos.length > 0
    ? colorSpecificPhotos
    : (product.images.length > 0 ? product.images : ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800"]);

  useEffect(() => {
    const colIdx = product.colors.indexOf(selectedColor);
    const colPhotos = product.colorImages?.[selectedColor]?.length
      ? product.colorImages[selectedColor]
      : product.images.filter((img) => img.toLowerCase().includes(selectedColor.toLowerCase()));
    if (colPhotos.length > 0) {
      setSelectedImage(colPhotos[0]);
    } else if (colIdx >= 0 && colIdx < product.images.length) {
      setSelectedImage(product.images[colIdx]);
    } else if (product.images[0]) {
      setSelectedImage(product.images[0]);
    }
  }, [selectedColor, product.id]);

  // Fullscreen Inspection Modal state for Mobile & Touch/Click
  const [isFullscreenZoomOpen, setIsFullscreenZoomOpen] = useState(false);
  const [fullscreenScale, setFullscreenScale] = useState(1);

  const isWishlisted = isInWishlist(product.id);

  if (!isOpen) return null;

  const currentImageIdx = gallery.indexOf(selectedImage);

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const prevIdx =
      currentImageIdx <= 0 ? gallery.length - 1 : currentImageIdx - 1;
    setSelectedImage(gallery[prevIdx] || gallery[0]);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextIdx =
      currentImageIdx >= gallery.length - 1 ? 0 : currentImageIdx + 1;
    setSelectedImage(gallery[nextIdx] || gallery[0]);
  };

  const handleAddToCart = () => {
    if (stockForVariant(product, selectedSize, selectedColor) <= 0) return;
    addToCart(product, selectedSize, selectedColor, 1);
    onClose();
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreenScale((prev) => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreenScale((prev) => Math.max(prev - 0.5, 1));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreenScale(1);
  };

  return (
    <>
      {/* MAIN PRODUCT DETAIL POPUP OVERLAY */}
      <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-hidden">
        {/* MODAL CONTAINER */}
        <div className="relative w-full max-w-4xl max-h-[94vh] sm:max-h-[90vh] bg-ivory rounded-t-2xl sm:rounded-none border-t-2 sm:border-2 border-gold shadow-2xl flex flex-col overflow-hidden my-0 sm:my-auto animate-fadeIn">
          
          {/* MOBILE & DESKTOP TOP BAR */}
          <div className="sticky top-0 bg-ink text-ivory px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between z-30 border-b border-gold/40 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.24em] text-gold font-bold truncate max-w-[200px] sm:max-w-none">
                {product.category} • Quick View
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => toggleWishlist(product.id)}
                className="p-1.5 text-ivory-300 hover:text-crimson transition-colors cursor-pointer"
                title="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-crimson text-crimson" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-ivory/80 hover:text-white bg-ivory/10 hover:bg-crimson rounded-full transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* SCROLLABLE BODY CONTENT */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
              
              {/* 1. PRODUCT GALLERY (NO HOVER ZOOM, CLEAN INTERACTION) */}
              <div className="space-y-3">
                {/* Main Image Container */}
                <div
                  onClick={() => setIsFullscreenZoomOpen(true)}
                  className="relative aspect-[4/5] sm:aspect-[4/5] w-full bg-ivory-200 border border-ivory-300 overflow-hidden cursor-pointer group shadow-sm"
                >
                  <Image
                    src={selectedImage}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority
                  />

                  {/* PREVIOUS (<) & NEXT (>) OVERLAY ARROWS */}
                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 bg-ink/80 text-gold hover:bg-crimson hover:text-white rounded-full transition-all z-20 shadow-lg border border-gold/40 cursor-pointer"
                        title="Previous Image (<)"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-ink/80 text-gold hover:bg-crimson hover:text-white rounded-full transition-all z-20 shadow-lg border border-gold/40 cursor-pointer"
                        title="Next Image (>)"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Clean Inspection Badge */}
                  <div className="absolute bottom-3 right-3 bg-ink/85 text-gold text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-gold/40 flex items-center space-x-1.5 shadow-md">
                    <Maximize2 className="w-3 h-3 text-gold" />
                    <span>Fullscreen Zoom</span>
                  </div>
                </div>

                {/* Thumbnail Strip */}
                {gallery.length > 1 && (
                  <div className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-1 scrollbar-none">
                    {gallery.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        className={`relative w-14 h-16 sm:w-16 sm:h-20 bg-ivory-200 border flex-shrink-0 transition-all cursor-pointer ${
                          selectedImage === img
                            ? "border-crimson ring-2 ring-crimson shadow-md scale-105"
                            : "border-ivory-300 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <Image src={productCardUrl(img)} alt={`Thumb ${idx + 1}`} fill sizes="64px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. PRODUCT DETAILS & SELECTORS */}
              <div className="space-y-5 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-gold font-semibold block truncate" title={product.category}>
                    {product.category}
                  </span>
                  <h2 className="font-serif text-xl sm:text-3xl text-ink font-normal leading-tight">
                    {product.name}
                  </h2>

                  {/* Price Row */}
                  <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 pt-1">
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-crimson">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm sm:text-base text-ink-muted line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                    {product.originalPrice && (
                      <span className="px-2 py-0.5 bg-gold/15 text-gold text-[9px] sm:text-[10px] uppercase font-bold tracking-widest border border-gold/40">
                        Save {formatPrice(product.originalPrice - product.price)}
                      </span>
                    )}
                  </div>

                  {/* Lifestyle Tags */}
                  {product.lifestyleTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {product.lifestyleTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-ivory-200 text-ink-muted text-[10px] uppercase tracking-wider border border-ivory-300 font-semibold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-ink-muted leading-relaxed font-sans pt-1">
                    {product.description}
                  </p>
                </div>

                {/* SELECTORS (SIZE & COLOR) */}
                <div className="space-y-4 pt-4 border-t border-ivory-300">
                  {/* Size Selector */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-ink font-bold">
                        Select Size
                      </label>
                      <span className="text-xs text-crimson font-bold uppercase tracking-wider">
                        {selectedSize}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((sz) => (
                        <button
                          key={sz}
                          disabled={stockForVariant(product, sz, selectedColor) <= 0}
                          style={stockForVariant(product, sz, selectedColor) <= 0 ? { opacity: 0.4, cursor: "not-allowed", textDecoration: "line-through" } : undefined}
                          title={`${stockForVariant(product, sz, selectedColor)} available`}
                          onClick={() => setSelectedSize(sz)}
                          className={`min-w-[44px] px-3.5 py-2 text-xs uppercase tracking-wider transition-all border cursor-pointer ${
                            selectedSize === sz
                              ? "bg-crimson text-ivory border-crimson font-bold shadow-md"
                              : "bg-ivory-50 text-ink border-ivory-300 hover:border-gold"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ShareProduct product={product} />
                  {/* Color Selector */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-ink font-bold">
                        Select Color
                      </label>
                      <span className="text-xs text-gold font-bold uppercase tracking-wider">
                        {selectedColor}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((col) => (
                        <button
                          key={col}
                          onClick={() => {
                            setSelectedColor(col);
                            const nextSize = (product.sizes.length ? product.sizes : ["Standard"]).find(size => stockForVariant(product, size, col) > 0);
                            if (nextSize) setSelectedSize(nextSize);
                            const colIdx = product.colors.indexOf(col);
                            const photos = product.colorImages?.[col]?.length
                              ? product.colorImages[col]
                              : product.images.filter((img) => img.toLowerCase().includes(col.toLowerCase()));
                            if (photos.length > 0) {
                              setSelectedImage(photos[0]);
                            } else if (colIdx >= 0 && colIdx < product.images.length) {
                              setSelectedImage(product.images[colIdx]);
                            } else if (product.images[0]) {
                              setSelectedImage(product.images[0]);
                            }
                            setFullscreenScale(1);
                          }}
                          className={`px-3.5 py-2 text-xs uppercase tracking-wider transition-all border cursor-pointer ${
                            selectedColor === col
                              ? "bg-gold text-ink border-gold font-bold shadow-md"
                              : "bg-ivory-50 text-ink border-ivory-300 hover:border-gold"
                          }`}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Desktop Action Buttons */}
                <div className="hidden sm:block pt-4 space-y-3">
                  <button
                    disabled={stockForVariant(product, selectedSize, selectedColor) <= 0}
              onClick={handleAddToCart}
                    className="w-full py-4 bg-crimson hover:bg-crimson-800 text-ivory text-xs uppercase tracking-[0.24em] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-luxury flex items-center justify-center space-x-2 border border-gold/40 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{stockForVariant(product, selectedSize, selectedColor) > 0 ? "Add to Shopping Bag" : "Out of stock"}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-ink-muted border-t border-ivory-200">
                    <div className="flex items-center space-x-1.5 font-semibold">
                      <Truck className="w-4 h-4 text-gold flex-shrink-0" />
                      <span>Free Express Shipping</span>
                    </div>
                    <div className="flex items-center space-x-1.5 font-semibold">
                      <RotateCcw className="w-4 h-4 text-gold flex-shrink-0" />
                      <span>100% Quality Guarantee</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* STICKY BOTTOM ACTION BAR ON MOBILE */}
          <div className="sm:hidden p-3 bg-ivory border-t border-gold/30 shadow-lg flex-shrink-0 space-y-2">
            <button
              disabled={stockForVariant(product, selectedSize, selectedColor) <= 0}
              onClick={handleAddToCart}
              className="w-full py-3.5 bg-crimson active:bg-crimson-800 text-ivory text-xs uppercase tracking-[0.22em] font-bold shadow-md flex items-center justify-center space-x-2 border border-gold/40 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{stockForVariant(product, selectedSize, selectedColor) > 0 ? `Add to Bag • ${formatPrice(product.price)}` : "Out of stock"}</span>
            </button>
            <div className="flex justify-between items-center text-[9px] text-ink-muted px-1 font-semibold">
              <span className="flex items-center space-x-1">
                <Truck className="w-3 h-3 text-gold" />
                <span>Express Delivery</span>
              </span>
              <span className="flex items-center space-x-1">
                <RotateCcw className="w-3 h-3 text-gold" />
                <span>Verified Quality</span>
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* FULLSCREEN HIGH-RESOLUTION IMAGE ZOOM INSPECTOR MODAL */}
      {isFullscreenZoomOpen && (
        <div
          onClick={() => setIsFullscreenZoomOpen(false)}
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col justify-between items-center p-4 animate-fadeIn"
        >
          {/* Top Control Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl flex items-center justify-between text-white border-b border-gold/40 pb-3 z-10"
          >
            <div className="flex items-center space-x-2">
              <Maximize2 className="w-5 h-5 text-[#E5C378]" />
              <span className="font-serif text-sm sm:text-lg uppercase tracking-wider text-white truncate max-w-[200px] sm:max-w-none">
                {product.name} (Inspection)
              </span>
            </div>

            {/* Zoom Controls & Close */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-2 bg-ivory/10 hover:bg-ivory/20 text-[#E5C378] rounded-full transition-colors cursor-pointer border border-gold/40"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-2 bg-ivory/10 hover:bg-ivory/20 text-[#E5C378] rounded-full transition-colors cursor-pointer border border-gold/40"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              {fullscreenScale > 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-2 bg-ivory/10 hover:bg-ivory/20 text-white rounded-full transition-colors cursor-pointer border border-ivory/40"
                  title="Reset Zoom"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFullscreenZoomOpen(false)}
                className="p-2 bg-crimson text-ivory rounded-full transition-all cursor-pointer shadow-md ml-1"
                title="Close Zoom Modal"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Fullscreen Main Image Viewer */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-auto py-4 cursor-grab active:cursor-grabbing"
          >
            <div
              className="relative w-full h-full max-h-[80vh] flex items-center justify-center transition-transform duration-300 ease-out"
              style={{ transform: `scale(${fullscreenScale})` }}
            >
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Previous (<) & Next (>) Arrows in Fullscreen */}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-ink/90 text-gold hover:bg-crimson hover:text-white rounded-full transition-all z-20 shadow-2xl border border-gold cursor-pointer"
                  title="Previous Image (<)"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-ink/90 text-gold hover:bg-crimson hover:text-white rounded-full transition-all z-20 shadow-2xl border border-gold cursor-pointer"
                  title="Next Image (>)"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnail Bar in Fullscreen */}
          {gallery.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md flex justify-center space-x-2 sm:space-x-3 pt-3 border-t border-gold/30 z-10"
            >
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-12 h-14 sm:w-14 sm:h-16 bg-ink border flex-shrink-0 transition-all cursor-pointer ${
                    selectedImage === img
                      ? "border-[#E5C378] ring-2 ring-[#E5C378] scale-105"
                      : "border-ivory/30 opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={productCardUrl(img)} alt={`Thumb ${idx + 1}`} fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { getImageProps } from "next/image";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HeroBanner() {
  const { banners, isBannerLoading } = useStore();
  const activeBanners = banners.filter((b) => b.isActive);
  const [initialLoadElapsed, setInitialLoadElapsed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoadElapsed(true), 3500);
    return () => clearTimeout(timer);
  }, []);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  if (isBannerLoading && !initialLoadElapsed && activeBanners.length === 0) {
    return (
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[1600/500] bg-[#2B0B14] overflow-hidden flex flex-col items-center justify-center text-center p-6 space-y-4 border-b-2 border-gold/40 animate-pulse z-0">
        <div className="w-16 h-16 rounded-full border-2 border-gold/40 p-1 bg-[#2B0B14]">
          <div className="w-full h-full rounded-full bg-gold/20" />
        </div>
        <div className="h-3.5 w-36 sm:w-44 bg-gold/30 rounded mx-auto" />
        <div className="h-8 sm:h-12 w-64 sm:w-[450px] bg-gold/40 rounded mx-auto" />
        <div className="h-10 w-44 bg-crimson/60 rounded border border-gold/40 mx-auto mt-3" />
      </div>
    );
  }

  if (activeBanners.length === 0) return (
    <section className="bg-[#2B0B14] min-h-[360px] sm:min-h-[420px] flex flex-col items-center justify-center text-center px-6 text-ivory">
      <p className="text-gold text-xs uppercase tracking-[0.2em]">Kaavu Styless</p>
      <h1 className="font-serif text-4xl sm:text-6xl mt-4">For Every Version Of You</h1>
      <Link prefetch={false} href="/shop" className="mt-8 border border-gold px-8 py-3 text-sm">Explore the Collections</Link>
    </section>
  );
  const banner = activeBanners[currentIdx % activeBanners.length];
  const { props: landscapeProps } = getImageProps({
    src: banner.imageUrl, alt: banner.title, fill: true,
    sizes: "100vw", quality: 75, priority: true,
  });
  const { props: mobileProps } = getImageProps({
    src: banner.mobileImageUrl || banner.imageUrl, alt: banner.title, fill: true,
    sizes: "100vw", quality: 75, priority: true,
  });
  const textAlign = banner.textAlign?.toLowerCase() || "left";

  const bannerAlignClass =
    textAlign === "right"
      ? "items-center text-center mx-auto md:items-end md:text-right md:ml-auto md:mr-0"
      : textAlign === "center"
      ? "items-center text-center mx-auto"
      : "items-center text-center mx-auto md:items-start md:text-left md:mx-0";

  const ctaAlignClass =
    textAlign === "right"
      ? "justify-center md:justify-end"
      : textAlign === "center"
      ? "justify-center"
      : "justify-center md:justify-start";

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % activeBanners.length);
  };

  return (
    <div data-home-hero className="relative w-full bg-ink overflow-hidden group">
      <link rel="preload" as="image" href={mobileProps.srcSet ? undefined : mobileProps.src} imageSrcSet={mobileProps.srcSet} imageSizes={mobileProps.sizes} media="(max-width: 767px)" />
      <link rel="preload" as="image" href={landscapeProps.srcSet ? undefined : landscapeProps.src} imageSrcSet={landscapeProps.srcSet} imageSizes={landscapeProps.sizes} media="(min-width: 768px)" />
      {/* Background Banner Image & Dark Vignette Overlay */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[1600/500]">
        <picture>
          <source media="(max-width: 767px)" srcSet={mobileProps.srcSet || mobileProps.src} sizes={mobileProps.sizes} />
          <img {...landscapeProps} fetchPriority="high" decoding="async" className="object-cover object-top" />
        </picture>
        {/* Dark Vignette & Gradient Overlay for Contrast */}
        <div className={`absolute inset-0 ${textAlign === "right" ? "bg-gradient-to-l" : textAlign === "center" ? "bg-gradient-to-t" : "bg-gradient-to-r"} from-black/65 via-black/20 to-transparent`} />
      </div>

      {/* Mobile content is centered; desktop follows the banner alignment. */}
      <div className={`absolute inset-0 max-w-7xl mx-auto px-6 pt-10 pb-14 md:px-16 md:py-8 lg:px-20 flex flex-col justify-end md:justify-center text-ivory ${bannerAlignClass}`}>
        <div key={banner.id} className={`hero-entrance w-full max-w-[30rem] gap-4 lg:gap-5 flex flex-col ${bannerAlignClass}`}>
          <p className="font-sans text-[9px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.3em] text-ivory/90 font-medium max-w-full break-words">
            {banner.subtitle || "Kaavu StylesS EXCLUSIVE"}
          </p>

          <h1
            className="font-serif text-[clamp(1.875rem,8vw,2.5rem)] sm:text-4xl md:text-[clamp(2rem,3vw,3.5rem)] font-medium leading-[1.08] tracking-[-0.025em] text-balance max-w-full break-words"
            style={{ color: banner.textColor || "#F8F3EC", textShadow: "0 2px 18px rgba(0,0,0,0.25)" }}
          >
            {banner.title}
          </h1>

          <div className={`pt-1 sm:pt-2 flex items-center w-full ${ctaAlignClass}`}>
            <Link prefetch={false}
              href={banner.ctaLink || "/shop"}
              className="inline-flex items-center gap-3 px-6 py-3.5 sm:px-6 sm:py-3 border border-ivory/60 bg-ivory/10 backdrop-blur-sm text-ivory text-[11px] uppercase tracking-[0.16em] font-medium transition-colors duration-300 hover:bg-ivory hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory group/cta"
            >
              {banner.ctaText || "Explore Collections"}
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/cta:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Carousel Controls */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            type="button"
            className="absolute z-10 left-2 sm:left-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full border border-ivory/30 bg-ink/40 hover:bg-ivory text-ivory hover:text-ink backdrop-blur-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            type="button"
            className="absolute z-10 right-2 sm:right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full border border-ivory/30 bg-ink/40 hover:bg-ivory text-ivory hover:text-ink backdrop-blur-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-3">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`h-1.5 transition-all rounded-full ${
                  currentIdx === idx ? "w-8 bg-gold" : "w-3 bg-ivory/40"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

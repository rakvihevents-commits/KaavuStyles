"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import HeroBanner from "@/components/HeroBanner";
import StoryNarrative from "@/components/StoryNarrative";
import HomeMotion from "@/components/HomeMotion";
import ProductCard from "@/components/ProductCard";
import { useStore } from "@/context/StoreContext";
import {
  ArrowRight,
  Instagram,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Truck,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  Award,
} from "lucide-react";

export default function HomePage() {
  const { products, categories, instagramPosts, lifestyleTags, isLoading: storeLoading } = useStore();
  const [initialLoadElapsed, setInitialLoadElapsed] = useState(false);
  const isLoading = storeLoading && !initialLoadElapsed;
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoadElapsed(true), 3500);
    return () => clearTimeout(timer);
  }, []);
  const [activeTag, setActiveTag] = useState("all");
  const sliderRef = useRef<HTMLDivElement>(null);
  const lifestyleSliderRef = useRef<HTMLDivElement>(null);

  // 4-second Auto-scrolling for Latest Products Slider
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      if (sliderRef.current) {
        const container = sliderRef.current;
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 15) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollBy({ left: 360, behavior: "smooth" });
        }
      }
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // 4-second Auto-scrolling for Shop By Lifestyle Slider
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      if (lifestyleSliderRef.current) {
        const container = lifestyleSliderRef.current;
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 15) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollBy({ left: 360, behavior: "smooth" });
        }
      }
    }, 4000);
    return () => clearInterval(timer);
  }, []);



  // 10 Latest Products for Horizontal Slider
  const latestTenProducts = products.filter((p) => p.isLatest || p.isFeatured).slice(0, 10);
  const displayLatest = latestTenProducts.length > 0 ? latestTenProducts : products.slice(0, 10);

  // Products filtered by selected Lifestyle Tag
  const lifestyleFilteredProducts =
    activeTag === "all"
      ? products
      : products.filter((p) =>
        p.lifestyleTags.some((t) => t.toLowerCase() === activeTag.toLowerCase())
      );

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -360, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      const container = sliderRef.current;
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 15) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: 360, behavior: "smooth" });
      }
    }
  };

  const scrollLeftLifestyle = () => {
    if (lifestyleSliderRef.current) {
      lifestyleSliderRef.current.scrollBy({ left: -360, behavior: "smooth" });
    }
  };

  const scrollRightLifestyle = () => {
    if (lifestyleSliderRef.current) {
      const container = lifestyleSliderRef.current;
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 15) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: 360, behavior: "smooth" });
      }
    }
  };

  return (
    <HomeMotion>
      {/* 1. HERO BANNER SLIDER WITH PARALLAX MOTION */}
      <HeroBanner />

      {/* 2. CATEGORIES SECTION (Which Version are you today ) */}
      <section className="w-full px-4 sm:px-6 lg:px-12 space-y-6 pt-4">
        <div data-reveal="up" className="flex flex-col md:flex-row md:items-end justify-between border-b border-ivory-300 pb-3 gap-2 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-xs uppercase tracking-[0.3em] text-gold font-bold flex items-center justify-center md:justify-start space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              <span>Style, your Way </span>
            </span>
            <h2 className="whitespace-nowrap font-serif text-[clamp(1rem,5.5vw,1.5rem)] sm:text-2xl uppercase font-light tracking-tight text-ink text-center md:text-left">
              Which Version <span className="text-crimson font-normal italic">are you Today{"\u00a0"}?</span>
            </h2>
          </div>
          <Link
            href="/catory"
            className="mt-2 md:mt-0 text-xs uppercase tracking-[0.24em] text-crimson font-bold hover:text-gold transition-colors flex items-center justify-center md:justify-start space-x-1 group"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-72 sm:h-96 bg-ivory-200/60 rounded-t-[999px] border-2 border-gold/30 p-4 animate-pulse flex flex-col justify-end text-center space-y-2 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B0B14]/40 via-transparent to-transparent" />
                <div className="h-3 w-16 bg-gold/30 rounded mx-auto relative z-10" />
                <div className="h-5 w-24 bg-gold/40 rounded mx-auto relative z-10" />
                <div className="h-3 w-20 bg-gold/30 rounded mx-auto relative z-10" />
              </div>
            ))
          ) : categories.length === 0 ? (
            <div className="col-span-full text-center py-12 text-ink-muted text-sm font-sans">
              No categories found. Check back soon for our latest collections.
            </div>
          ) : (
            categories.slice(0, 5).map((cat, index) => (
              <Link
                key={cat.id}
                data-reveal="up"
                style={{ transitionDelay: `${index * 80}ms` }}
                href={`/shop?category=${encodeURIComponent(cat.slug || cat.id)}`}
                className="group relative h-72 sm:h-96 bg-ivory rounded-t-[999px] border-2 border-gold p-1.5 shadow-luxury transition-all duration-500 hover-lift flex flex-col overflow-hidden [&:nth-child(5)]:col-span-2 sm:[&:nth-child(5)]:col-span-1 [&:nth-child(5)]:w-1/2 sm:[&:nth-child(5)]:w-full [&:nth-child(5)]:mx-auto"
              >
                <div className="relative w-full h-full rounded-t-[990px] overflow-hidden bg-ink">
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 20vw"
                    quality={75}
                    className="object-cover opacity-85 group-hover:scale-110 transition-transform duration-1000 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/30 to-transparent" />
                  <div className="absolute bottom-4 left-3 right-3 text-ivory space-y-1 z-10 text-center">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-gold font-sans font-bold block">
                      Collections
                    </span>
                    <h3 className="font-serif text-sm sm:text-2xl uppercase font-light tracking-wide group-hover:text-gold transition-colors line-clamp-1 text-center">
                      {cat.name}
                    </h3>
                    <span className="inline-flex items-center justify-center text-[9px] uppercase tracking-[0.2em] text-ivory-300 group-hover:text-ivory font-semibold">
                      Shop Ensemble <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 3. LATEST PRODUCTS ADDED (HORIZONTAL SCROLL SLIDER) */}
      <section className="w-full px-4 sm:px-6 lg:px-12 space-y-6 bg-ivory-200 border-y border-ivory-300 py-10">
        <div data-reveal="up" className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-ivory-300 pb-3 gap-4 text-center sm:text-left">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-xs uppercase tracking-[0.3em] text-gold font-bold">
              Fresh From Our Atelier
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl text-ink uppercase font-light">
              Latest Products Added
            </h2>
          </div>

          {/* Slider Arrows & View All */}
          <div className="flex items-center justify-center sm:justify-end space-x-3">
            <button
              onClick={scrollLeft}
              className="p-2.5 border border-gold/50 bg-ivory text-gold hover:bg-crimson hover:text-ivory hover:border-crimson transition-colors rounded-full shadow-sm cursor-pointer"
              title="Previous Products"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollRight}
              className="p-2.5 border border-gold/50 bg-ivory text-gold hover:bg-crimson hover:text-ivory hover:border-crimson transition-colors rounded-full shadow-sm cursor-pointer"
              title="Next Products"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <Link
              href="/shop"
              className="text-xs uppercase tracking-[0.2em] text-crimson font-bold hover:text-gold transition-colors pl-2"
            >
              View All 
            </Link>
          </div>
        </div>

        {/* 10-Product Horizontal Scroll Carousel */}
        <div
          ref={sliderRef}
          className="flex space-x-4 overflow-x-auto scrollbar-none scroll-smooth pb-4"
        >
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-[calc(50%-8px)] sm:w-[calc(33.33%-11px)] lg:w-[calc(20%-13px)] flex-shrink-0 animate-pulse space-y-3"
              >
                <div className="aspect-[3/4] bg-ivory-300 border border-gold/30 rounded-sm" />
                <div className="h-4 bg-ivory-300 w-3/4 rounded mx-auto" />
                <div className="h-3 bg-ivory-300 w-1/2 rounded mx-auto" />
              </div>
            ))
          ) : (
            displayLatest.map((product, index) => (
              <div
                key={product.id}
                data-reveal="up"
                style={{ transitionDelay: `${(index % 5) * 70}ms` }}
                className="w-[calc(50%-8px)] sm:w-[calc(33.33%-11px)] lg:w-[calc(20%-13px)] flex-shrink-0"
              >
                <ProductCard product={product} />
              </div>
            ))
          )}
        </div>
      </section>

      <StoryNarrative />

      {/* 5. SHOP BY LIFESTYLE TAGS SECTION */}
      <section className="w-full px-4 sm:px-6 lg:px-12 space-y-6 bg-ivory-200 border-y border-ivory-300 py-10">
        <div data-reveal="up" className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-ivory-300 pb-3 gap-4 text-center sm:text-left">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-xs uppercase tracking-[0.3em] text-gold font-bold">
              Curated Lifestyle Aesthetics
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl text-ink uppercase font-light">
              Shop By Lifestyle
            </h2>
          </div>

          {/* Slider Arrows */}
          <div className="flex items-center justify-center sm:justify-end space-x-3">
            <button
              onClick={scrollLeftLifestyle}
              className="p-2.5 border border-gold/50 bg-ivory text-gold hover:bg-crimson hover:text-ivory hover:border-crimson transition-colors rounded-full shadow-sm cursor-pointer"
              title="Previous Lifestyle Products"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollRightLifestyle}
              className="p-2.5 border border-gold/50 bg-ivory text-gold hover:bg-crimson hover:text-ivory hover:border-crimson transition-colors rounded-full shadow-sm cursor-pointer"
              title="Next Lifestyle Products"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lifestyle Tag Tabs */}
        <div className="flex justify-start sm:justify-center space-x-3 sm:space-x-4 overflow-x-auto scrollbar-none pb-2 text-xs uppercase tracking-[0.2em]">
          <button
            onClick={() => {
              setActiveTag("all");
              if (lifestyleSliderRef.current) lifestyleSliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
            }}
            className={`px-5 py-2.5 border transition-all cursor-pointer ${activeTag === "all"
              ? "bg-crimson text-ivory border-crimson font-bold shadow-md"
              : "bg-ivory border-ivory-300 text-ink-muted hover:text-ink hover:bg-ivory-300"
              }`}
          >
            All Lifestyles
          </button>
          {lifestyleTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => {
                setActiveTag(tag.name);
                if (lifestyleSliderRef.current) lifestyleSliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
              }}
              className={`px-5 py-2.5 border transition-all whitespace-nowrap cursor-pointer ${activeTag.toLowerCase() === tag.name.toLowerCase()
                ? "bg-crimson text-ivory border-crimson font-bold shadow-md"
                : "bg-ivory border-ivory-300 text-ink-muted hover:text-ink hover:bg-ivory-300"
                }`}
            >
              #{tag.name}
            </button>
          ))}
        </div>

        {/* Tag Filtered Horizontal Slider Carousel */}
        {isLoading ? (
          <div className="flex space-x-4 overflow-x-auto scrollbar-none scroll-smooth pb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-[calc(50%-8px)] sm:w-[calc(33.33%-11px)] lg:w-[calc(20%-13px)] flex-shrink-0 animate-pulse space-y-3"
              >
                <div className="aspect-[3/4] bg-ivory-300 border border-gold/30 rounded-sm" />
                <div className="h-4 bg-ivory-300 w-3/4 rounded mx-auto" />
                <div className="h-3 bg-ivory-300 w-1/2 rounded mx-auto" />
              </div>
            ))}
          </div>
        ) : lifestyleFilteredProducts.length === 0 ? (
          <div className="text-center py-12 text-ink-muted text-sm font-sans">
            No products found under #{activeTag}. Explore other lifestyle tags or view all products.
          </div>
        ) : (
          <div
            ref={lifestyleSliderRef}
            className="flex space-x-4 overflow-x-auto scrollbar-none scroll-smooth pb-4"
          >
            {lifestyleFilteredProducts.map((product, index) => (
              <div
                key={product.id}
                data-reveal="up"
                style={{ transitionDelay: `${(index % 5) * 70}ms` }}
                className="w-[calc(50%-8px)] sm:w-[calc(33.33%-11px)] lg:w-[calc(20%-13px)] flex-shrink-0"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>


      {/* 6. LUXURY TRUST & ESSENCE HALLMARK BAR (4 KEY PILLARS FROM TERMS & PRIVACY) */}
      <section className="w-full bg-[#2B0B14] border-y-2 border-gold/40 text-ivory py-8 sm:py-10 px-4 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#E5C378_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />

        <div className="relative z-10 w-full px-2 sm:px-6 lg:px-12 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Point 1: Terms of Service - No Return / No Replacement */}
          <Link
            href="/terms"
            data-reveal="up"
            className="bg-ivory/5 border border-gold/30 p-3.5 sm:p-6 text-center space-y-1.5 sm:space-y-2 group hover:border-gold hover:bg-ivory/10 transition-all shadow-md block"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full border border-gold bg-[#2B0B14] flex items-center justify-center text-gold mx-auto group-hover:scale-110 transition-transform shadow-inner">
              <ShieldAlert className="w-4 h-4 sm:w-6 sm:h-6 text-[#E5C378]" />
            </div>
            <h4 className="font-serif text-xs sm:text-base uppercase tracking-wider text-white font-normal">
              No Returns or Exchanges
            </h4>
            <p className="text-[9px] sm:text-[11px] text-[#E5C378] uppercase tracking-widest font-sans font-semibold">
              Strict Final Sale Policy
            </p>
            <span className="text-[8px] sm:text-[9px] text-ivory-300/80 block font-sans">
              Handcrafted Couture • Terms Apply
            </span>
          </Link>

          {/* Point 2: Terms of Service - Artisanal Craftsmanship */}
          <Link
            href="/shop"
            data-reveal="up"
            style={{ transitionDelay: "100ms" }}
            className="bg-ivory/5 border border-gold/30 p-3.5 sm:p-6 text-center space-y-1.5 sm:space-y-2 group hover:border-gold hover:bg-ivory/10 transition-all shadow-md block"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full border border-gold bg-[#2B0B14] flex items-center justify-center text-gold mx-auto group-hover:scale-110 transition-transform shadow-inner">
              <Award className="w-4 h-4 sm:w-6 sm:h-6 text-[#E5C378]" />
            </div>
            <h4 className="font-serif text-xs sm:text-base uppercase tracking-wider text-white font-normal">
              Artisanal Craftsmanship
            </h4>
            <p className="text-[9px] sm:text-[11px] text-[#E5C378] uppercase tracking-widest font-sans font-semibold">
              Designer Kurtis & Ethnic Sets
            </p>
            <span className="text-[8px] sm:text-[9px] text-ivory-300/80 block font-sans">
              100% Quality Audited Prior Dispatch
            </span>
          </Link>

          {/* Point 3: Privacy Policy - 100% Encrypted & Private */}
          <Link
            href="/privacy"
            data-reveal="up"
            style={{ transitionDelay: "200ms" }}
            className="bg-ivory/5 border border-gold/30 p-3.5 sm:p-6 text-center space-y-1.5 sm:space-y-2 group hover:border-gold hover:bg-ivory/10 transition-all shadow-md block"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full border border-gold bg-[#2B0B14] flex items-center justify-center text-gold mx-auto group-hover:scale-110 transition-transform shadow-inner">
              <Lock className="w-4 h-4 sm:w-6 sm:h-6 text-[#E5C378]" />
            </div>
            <h4 className="font-serif text-xs sm:text-base uppercase tracking-wider text-white font-normal">
              <span className="font-sans font-bold">100%</span> Secure & Private
            </h4>
            <p className="text-[9px] sm:text-[11px] text-[#E5C378] uppercase tracking-widest font-sans font-semibold">
              PCI-DSS Encrypted Razorpay
            </p>
            <span className="text-[8px] sm:text-[9px] text-ivory-300/80 block font-sans">
              Zero Third-Party Data Sharing
            </span>
          </Link>

          {/* Point 4: Terms of Service & Privacy - Tracked Dispatch & Concierge */}
          <Link
            href="/terms"
            data-reveal="up"
            style={{ transitionDelay: "300ms" }}
            className="bg-ivory/5 border border-gold/30 p-3.5 sm:p-6 text-center space-y-1.5 sm:space-y-2 group hover:border-gold hover:bg-ivory/10 transition-all shadow-md block"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full border border-gold bg-[#2B0B14] flex items-center justify-center text-gold mx-auto group-hover:scale-110 transition-transform shadow-inner">
              <Truck className="w-4 h-4 sm:w-6 sm:h-6 text-[#E5C378]" />
            </div>
            <h4 className="font-serif text-xs sm:text-base uppercase tracking-wider text-white font-normal">
              Pan-India Tracked Dispatch
            </h4>
            <p className="text-[9px] sm:text-[11px] text-[#E5C378] uppercase tracking-widest font-sans font-semibold">
              Inspected & Shipped With Care
            </p>
            <span className="text-[8px] sm:text-[9px] text-ivory-300/80 block font-sans">
              Support: kaavustyles@gmail.com
            </span>
          </Link>
        </div>
      </section>

      {/* 7. INSTAGRAM JOURNAL & GALLERY SECTION */}
      <section className="bg-ivory border-b border-ivory-300 py-12 space-y-8">
        <div data-reveal="up" className="w-full px-4 sm:px-6 lg:px-12 text-center space-y-3">
          <div className="flex items-center justify-center space-x-2 text-crimson">
            <Instagram className="w-5 h-5 text-gold" />
            <span className="text-xs uppercase tracking-[0.3em] font-bold">
              @kaavu_styles On Instagram
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl text-ink uppercase font-light">
            Follow Our Style Journal
          </h2>
          <p className="text-xs text-ink-muted max-w-md mx-auto">
            Tag #KaavuStyles on Instagram to be featured on our official gallery.
          </p>
        </div>

        {/* Instagram Grid or Official Follow Card */}
        {instagramPosts.length === 0 ? (
          <div data-reveal="up" className="max-w-xl mx-auto px-4">
            <a
              href="https://www.instagram.com/kaavu_styles?stkn=MWR6eWVtamh2cGZyag=="
              target="_blank"
              rel="noreferrer"
              className="group bg-ivory border border-gold/40 p-8 text-center block space-y-4 shadow-luxury hover:border-crimson transition-all"
            >
              <Instagram className="w-10 h-10 text-crimson mx-auto group-hover:scale-110 transition-transform" />
              <div className="space-y-1">
                <h3 className="font-serif text-xl uppercase text-ink">Connect With @kaavu_styles</h3>
                <p className="text-xs text-ink-muted">
                  Discover our latest saree drapes, artisanal kurtis, and flagship collections on Instagram.
                </p>
              </div>
              <span className="inline-block px-6 py-2.5 bg-crimson text-ivory text-xs uppercase tracking-[0.2em] font-bold group-hover:bg-crimson-800 transition-colors">
                Follow On Instagram →
              </span>
            </a>
          </div>
        ) : (
          <div className="w-full px-4 sm:px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {instagramPosts.map((post, index) => (
              <a
                key={post.id}
                data-reveal="up"
                style={{ transitionDelay: `${(index % 4) * 90}ms` }}
                href={post.postUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square bg-ink overflow-hidden border border-ivory-300 block hover-lift"
              >
                <Image
                  src={post.imageUrl}
                  alt={post.caption || "Instagram"}
                  fill
                  sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                  quality={75}
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90"
                />
                <div className="absolute inset-0 bg-[#2B0B14]/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-5 text-ivory">
                  <Instagram className="w-5 h-5 text-gold" />
                  <p className="text-xs line-clamp-3 font-sans leading-relaxed">
                    {post.caption}
                  </p>
                  <span className="text-[10px] uppercase tracking-widest text-gold font-bold">
                    View Post →
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </HomeMotion>
  );
}

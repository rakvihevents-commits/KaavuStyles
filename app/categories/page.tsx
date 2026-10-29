"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import CategorySkeleton from "@/components/CategorySkeleton";
import { useStore } from "@/context/StoreContext";
import { Sparkles, ChevronRight, ArrowRight, ShoppingBag } from "lucide-react";

export default function CategoriesPage() {
  const { categories, products, isLoading } = useStore();

  // Calculate product count for each category
  const getCategoryCount = (catObj: any) => {
    if (!catObj) return 0;
    return products.filter((p) => {
      if (p.categoryId && (p.categoryId === catObj.id || p.categoryId === catObj.slug)) return true;
      if (p.category && (p.category.toLowerCase() === catObj.name.toLowerCase() || p.category.toLowerCase() === catObj.slug.toLowerCase())) return true;
      return false;
    }).length;
  };

  return (
    <div className="w-full space-y-12 pb-16">
      {/* 1. FULL-WIDTH HERO HEADER (#2B0B14 VELVET BURGUNDY WITH RADIAL DOTS) */}
      <div className="relative w-full text-center space-y-3 bg-[#2B0B14] border-y-2 border-gold/40 py-16 px-4 shadow-2xl overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto space-y-3">
          <div className="flex items-center justify-center space-x-2 text-[#E5C378] mb-1">
            <Sparkles className="w-4 h-4 text-[#E5C378]" />
            <span className="text-xs uppercase tracking-[0.35em] text-[#E5C378] font-bold">
              The Kaavu Atelier
            </span>
            <Sparkles className="w-4 h-4 text-[#E5C378]" />
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl text-white uppercase font-light tracking-wide">
           Our Collections
          </h1>

          <div className="w-24 h-0.5 bg-gold mx-auto my-3" />

          <p className="text-xs sm:text-sm text-ivory-300 max-w-xl mx-auto font-sans leading-relaxed">
            Discover versatile co-ord sets, elegant kurtis, stylish salwar suits and western wears for every mood and moment. From office days to coffee dates, find your style with Kaavu Styles.
          </p>
        </div>

        {/* Radial dot background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#E5C378_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
      </div>

      {/* 2. CATEGORIES GRID */}
      <div className="w-full px-4 sm:px-6 lg:px-12 space-y-8">
        <div className="flex items-center justify-between border-b border-ivory-300 pb-4">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-gold font-bold">
              Curated Ensembles
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-ink uppercase font-light">
              Explore Our <span className="text-crimson italic font-normal">Collections</span>
            </h2>
          </div>
          <span className="text-xs text-ink-muted uppercase tracking-widest font-semibold">
            {isLoading ? "Loading collections…" : `${categories.length} Total Categories`}
          </span>
        </div>

        <div aria-busy={isLoading} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {isLoading ? Array.from({ length: 8 }, (_, index) => <CategorySkeleton key={index} />) : categories.length === 0 ? <p className="col-span-full py-12 text-center text-ink-muted">No collections available yet. Please check back soon.</p> : categories.map((category) => {
            const count = getCategoryCount(category);
            return (
              <Link prefetch={false}
                key={category.id}
                href={`/shop?category=${encodeURIComponent(category.slug || category.id)}`}
                className="group relative bg-ivory border-2 border-gold rounded-t-[999px] p-2 shadow-luxury hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col justify-between hover-lift"
              >
                {/* Category Royal Arch Image Box */}
                <div className="relative h-80 w-full bg-ink rounded-t-[990px] overflow-hidden">
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    className="object-cover opacity-90 group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/20 to-transparent" />
                </div>

                {/* Card Info Content with Prominent Visible Product Count Badge */}
                <div className="p-5 space-y-3 bg-ivory flex-1 flex flex-col justify-between text-center border-t border-ivory-200">
                  <div className="space-y-1.5 flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-gold font-bold">
                      Luxury Collections
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl uppercase text-ink group-hover:text-crimson transition-colors line-clamp-1 font-normal">
                      {category.name}
                    </h3>
                    
                    {/* PROMINENT VISIBLE PRODUCT COUNT BADGE */}
                    <div className="mt-1 inline-flex items-center space-x-1 px-3 py-1 bg-[#2B0B14] text-[#E5C378] border border-gold/40 text-[11px] font-extrabold uppercase tracking-widest rounded-full shadow-md">
                      <span>{count} {count === 1 ? "Creation" : "Creations Available"}</span>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-center space-x-1.5 text-xs font-bold uppercase tracking-[0.2em] text-crimson group-hover:text-gold transition-colors border-t border-ivory-200">
                    <span>Explore Collections</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. FOOTER SHOP ALL CALL TO ACTION */}
      <div className="w-full px-4 sm:px-6 lg:px-12 pt-6">
        <div className="bg-[#2B0B14] border-2 border-gold/40 p-8 sm:p-12 text-center text-white space-y-4 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto space-y-3">
            <ShoppingBag className="w-8 h-8 text-[#E5C378] mx-auto" />
            <h2 className="font-serif text-2xl sm:text-4xl uppercase tracking-wide">
              Looking for Something Specific?
            </h2>
            <p className="text-xs text-ivory-300">
              Browse our complete inventory with instant category filters, color options, and price sorting.
            </p>
            <Link prefetch={false}
              href="/shop"
              className="inline-flex items-center space-x-2 px-8 py-3.5 bg-crimson hover:bg-crimson-800 text-ivory border border-gold/40 text-xs uppercase tracking-[0.24em] font-bold transition-all shadow-md cursor-pointer mt-2"
            >
              <span>View All Products in Shop</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(#E5C378_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

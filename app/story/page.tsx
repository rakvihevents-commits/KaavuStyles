"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Heart, Compass } from "lucide-react";

export default function OurStoryPage() {
  return (
    <div className="space-y-16 sm:space-y-20 pb-24">
      {/* 1. HERO BANNER (#2B0B14 BURGUNDY BACKGROUND) */}
      <section className="relative bg-[#2B0B14] border-b-2 border-gold/40 text-ivory py-12 sm:py-16 px-4 text-center overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl mx-auto space-y-3">
          <div className="flex items-center justify-center space-x-2 text-[#E5C378]">
            <Sparkles className="w-4 h-4 text-[#E5C378]" />
            <span className="text-xs uppercase tracking-[0.35em] text-[#E5C378] font-bold">
              Kaavu Styless
            </span>
            <Sparkles className="w-4 h-4 text-[#E5C378]" />
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl uppercase font-light text-white tracking-wide">
            About Us
          </h1>

          <div className="w-20 h-0.5 bg-gold mx-auto my-2" />

          <p className="font-serif italic text-[#E5C378] text-base sm:text-xl tracking-wider">
            &ldquo;It Started With an Idea…&rdquo;
          </p>
        </div>

        {/* Subtle radial dot backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(#E5C378_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
      </section>

      {/* 2. MAIN STORY SHOWCASE LAYOUT */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Side: Elegant Arch Image Frame */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-t-[999px] border-2 border-gold p-2.5 bg-ivory-200 shadow-2xl overflow-hidden group">
            <div className="relative w-full h-full rounded-t-[990px] overflow-hidden">
              <Image
                src="/foundations-story.webp"
                alt="Kaavu Styless Journey"
                fill
                sizes="(min-width: 640px) 384px, 100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-crimson/30 via-transparent to-transparent" />
            </div>
          </div>
        </div>

        {/* Right Side: Exact Customer Copy & Story Narrative */}
        <div className="lg:col-span-7 space-y-6 text-ink pl-0 lg:pl-4">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.3em] text-gold font-bold">
              Our Journey
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl uppercase font-light leading-tight text-ink">
              It Started With <br />
              <em className="text-crimson font-normal">an Idea…</em>
            </h2>
            <div className="w-16 h-0.5 bg-gold my-3" />
          </div>

          <div className="space-y-4 text-sm sm:text-base text-ink-muted leading-relaxed font-sans">
            <p className="text-ink font-medium leading-relaxed">
              Sometimes, all it takes is one little idea and the courage to give it a chance.
            </p>

            <p className="leading-relaxed">
              Kaavu Styless is one such dream — something that started with a thought and slowly became something we wanted to bring to life.
            </p>

            <blockquote className="border-l-2 border-gold/70 pl-4 py-1.5 my-4 bg-ivory-100/60">
              <p className="font-serif text-lg sm:text-xl text-crimson italic leading-relaxed">
                &ldquo;We all have those outfits that make us feel a little more confident, a little more comfortable, and a little more ourselves. That’s exactly what we want Kaavu Styless to be about.&rdquo;
              </p>
            </blockquote>

            <p className="leading-relaxed text-ink font-medium">
              Our aim is to bring you styles that fit into your everyday life.
            </p>

            <p className="leading-relaxed">
              We’re learning, growing, and building this dream one step at a time. And having you here makes the journey even more special.
            </p>

            <div className="pt-2">
              <div className="inline-block p-4 bg-ivory-200 border border-gold/40 shadow-sm">
                <p className="font-serif text-base sm:text-lg text-crimson font-semibold tracking-wide">
                  Welcome to Kaavu Styless. We’re glad you’re here.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              href="/shop"
              className="px-8 py-3.5 bg-crimson hover:bg-crimson-800 text-ivory text-xs uppercase tracking-[0.24em] font-semibold transition-all shadow-luxury"
            >
              Explore Collections
            </Link>
            <Link
              href="/contact"
              className="text-xs uppercase tracking-[0.24em] text-gold border-b border-gold hover:text-crimson hover:border-crimson pb-1 transition-colors font-semibold"
            >
              Get In Touch
            </Link>
          </div>
        </div>
      </section>

      {/* 3. CORE PILLARS SECTION */}
      <section className="bg-ivory-200 border-y border-ivory-300 py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-center">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">
              The Kaavu Promise
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl uppercase font-light text-ink">
              Crafted For Everyday Elegance
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-8 bg-ivory border border-ivory-300 space-y-3 text-center shadow-sm hover:border-gold transition-colors">
              <div className="w-10 h-10 rounded-full border border-gold bg-[#2B0B14] text-[#E5C378] flex items-center justify-center mx-auto mb-2">
                <Heart className="w-5 h-5 text-[#E5C378]" />
              </div>
              <h4 className="font-serif text-lg uppercase text-ink font-normal">Confidence & Comfort</h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Outfits curated to make you feel a little more confident, effortless, and truly yourself every single day.
              </p>
            </div>

            <div className="p-8 bg-ivory border border-ivory-300 space-y-3 text-center shadow-sm hover:border-gold transition-colors">
              <div className="w-10 h-10 rounded-full border border-gold bg-[#2B0B14] text-[#E5C378] flex items-center justify-center mx-auto mb-2">
                <Compass className="w-5 h-5 text-[#E5C378]" />
              </div>
              <h4 className="font-serif text-lg uppercase text-ink font-normal">Everyday Fit</h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Designs and silhouettes chosen thoughtfully to integrate naturally into your routine, work, and celebrations.
              </p>
            </div>

            <div className="p-8 bg-ivory border border-ivory-300 space-y-3 text-center shadow-sm hover:border-gold transition-colors">
              <div className="w-10 h-10 rounded-full border border-gold bg-[#2B0B14] text-[#E5C378] flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-5 h-5 text-[#E5C378]" />
              </div>
              <h4 className="font-serif text-lg uppercase text-ink font-normal">Growing Step by Step</h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Learning and building this dream with care and devotion, cherishing every single step of having you with us.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

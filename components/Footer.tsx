"use client";

import siteIcon from "@/public/icon.webp";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { Instagram, Mail, Phone, MapPin, ExternalLink, Sparkles, ChevronRight } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  const { categories } = useStore();

  // Hide footer on Admin Panel routes
  if (pathname?.startsWith("/admin") || (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"))) {
    return null;
  }

  const instagramLink = "https://www.instagram.com/kaavu_styles?stkn=MWR6eWVtamh2cGZyag==";

  return (
    <footer className="bg-[#2B0B14] text-ivory border-t-2 border-gold/40 pt-16 pb-24 sm:pb-28 lg:pb-12 shadow-2xl">
      <div className="w-full px-4 sm:px-6 lg:px-12 space-y-12">
        {/* MAIN 4-COLUMN FOOTER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-14 border-b border-gold/30">
          
          {/* COLUMN 1: BRAND ESSENCE & STORY */}
          <div className="space-y-4">
            <Link prefetch={false} href="/" className="flex items-center space-x-3.5 group">
              <div className="relative w-11 h-11 rounded-full border-2 border-gold overflow-hidden flex-shrink-0 bg-ivory shadow-md group-hover:scale-105 transition-transform">
                <Image src={siteIcon.src} alt="Kaavu Styles" fill className="object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl sm:text-2xl font-normal tracking-[0.18em] text-white uppercase group-hover:text-[#E5C378] transition-colors">
                  Kaavu Styles
                </span>
                <span className="text-[9px] tracking-[0.28em] text-[#E5C378] uppercase font-sans -mt-0.5 font-bold">
                  For Every Version Of You
                </span>
              </div>
            </Link>

            <p className="text-xs text-ivory-300 leading-relaxed font-sans pt-1">
              We all have those outfits that make us feel a little more confident, a little more comfortable, and a little more ourselves. That’s exactly what we want Kaavu Styless to be about.
            </p>

            <div className="pt-2 flex items-center space-x-3">
              <a
                href={instagramLink}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full border border-gold/50 flex items-center justify-center text-[#E5C378] hover:bg-crimson hover:text-ivory hover:border-gold transition-all shadow-sm"
                title="Follow @kaavu_styles on Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:Kaavustyles@gmail.com"
                className="w-9 h-9 rounded-full border border-gold/50 flex items-center justify-center text-[#E5C378] hover:bg-crimson hover:text-ivory hover:border-gold transition-all shadow-sm"
                title="Email Kaavustyles@gmail.com"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* COLUMN 2: QUICK NAVIGATION */}
          <div className="space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-[#E5C378] border-b border-gold/30 pb-2">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs uppercase tracking-[0.18em] font-sans">
              <li>
                <Link prefetch={false} href="/" className="text-ivory-200 hover:text-[#E5C378] transition-colors flex items-center space-x-1.5 group">
                  <ChevronRight className="w-3 h-3 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/shop" className="text-ivory-200 hover:text-[#E5C378] transition-colors flex items-center space-x-1.5 group">
                  <ChevronRight className="w-3 h-3 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>Shop Collections</span>
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/categories" className="text-ivory-200 hover:text-[#E5C378] transition-colors flex items-center space-x-1.5 group">
                  <ChevronRight className="w-3 h-3 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>All Categories</span>
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/about" className="text-ivory-200 hover:text-[#E5C378] transition-colors flex items-center space-x-1.5 group">
                  <ChevronRight className="w-3 h-3 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/story" className="text-ivory-200 hover:text-[#E5C378] transition-colors flex items-center space-x-1.5 group">
                  <ChevronRight className="w-3 h-3 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>Our Story</span>
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/contact" className="text-ivory-200 hover:text-[#E5C378] transition-colors flex items-center space-x-1.5 group">
                  <ChevronRight className="w-3 h-3 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>Contact Us</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: CATEGORIES & COLLECTIONS */}
          <div className="space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-[#E5C378] border-b border-gold/30 pb-2">
              Categories
            </h4>
            <ul className="space-y-2.5 text-xs uppercase tracking-[0.18em] font-sans">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link prefetch={false}
                    href={`/shop?category=${encodeURIComponent(cat.slug || cat.id)}`}
                    className="text-ivory-200 hover:text-[#E5C378] transition-colors flex items-center space-x-1.5 group"
                  >
                    <ChevronRight className="w-3 h-3 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>{cat.name}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link prefetch={false} href="/catory" className="text-[#E5C378] font-bold hover:underline flex items-center space-x-1 pt-1">
                  <span>View All Categories →</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: POLICIES, MY ORDERS & BOUTIQUE LOCATION */}
          <div className="space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-[#E5C378] border-b border-gold/30 pb-2">
              Boutique & Policies
            </h4>
            <ul className="space-y-2.5 text-xs text-ivory-200 tracking-wider font-sans">
              <li>
                <Link prefetch={false} href="/terms" className="hover:text-[#E5C378] transition-colors flex items-center space-x-1.5 uppercase tracking-[0.15em]">
                  <ChevronRight className="w-3 h-3 text-gold" />
                  <span>Terms & Conditions</span>
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/privacy" className="hover:text-[#E5C378] transition-colors flex items-center space-x-1.5 uppercase tracking-[0.15em]">
                  <ChevronRight className="w-3 h-3 text-gold" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/orders" className="hover:text-[#E5C378] transition-colors flex items-center space-x-1.5 uppercase tracking-[0.15em]">
                  <ChevronRight className="w-3 h-3 text-gold" />
                  <span>Track My Orders</span>
                </Link>
              </li>
              <li className="pt-2 border-t border-gold/20 flex items-start space-x-2 text-ivory-300">
                <MapPin className="w-4 h-4 text-[#E5C378] flex-shrink-0 mt-0.5" />
                <span>Location: Bengaluru, Karnataka, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT & RAKVIH CREDIT */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-ivory-300 uppercase tracking-[0.18em] space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>© {new Date().getFullYear()} Kaavu StylesS. All Rights Reserved.</span>
          </div>

          <div className="flex items-center space-x-6">

            <a
              href="https://rakvih.in/"
              target="_blank"
              rel="noreferrer"
              className="text-[#E5C378] font-bold hover:text-white transition-colors flex items-center space-x-1"
            >
              <span>Designed And Developed by Rakvih</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { ExternalLink, Shield, LogOut, KeyRound } from "lucide-react";

export default function AdminHeader({ title }: { title: string }) {
  const { currentUser, logout } = useStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const section = pathname?.split("/")[2] || "dashboard";
  const mobileTitles: Record<string, string> = {
    dashboard: "Dashboard",
    categories: "Categories",
    products: "Products",
    inventory: "Inventory",
    orders: "Orders",
    users: "Registered Users",
    coupons: "Coupons",
    banners: "Banners",
    attributes: "Tags, sizes & colors",
    instagram: "Instagram",
    settings: "Admin Security",
    login: "Admin login",
  };
  const mobileTitle = section === "products" && pathname?.endsWith("/new") ? "Add product" : section === "products" && pathname?.endsWith("/edit") ? "Edit product" : mobileTitles[section] || title;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSignOut = () => {
    logout();
    if (typeof window !== "undefined") {
      localStorage.removeItem("ks_admin_user");
      try {
        const savedUser = localStorage.getItem("ks_user");
        if (savedUser && JSON.parse(savedUser).role === "admin") {
          localStorage.removeItem("ks_user");
        }
      } catch {}
    }
    router.replace("/admin/login");
  };

  return (
    <header className="bg-ivory border-b border-ivory-300 min-h-[72px] py-3 lg:py-4 pl-16 pr-3 sm:pr-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-3 sticky top-0 z-30 shadow-sm">
      <div className="min-w-0 flex-1">
        <h1 className="font-serif text-xl lg:text-2xl text-ink leading-tight lg:uppercase lg:tracking-wide">
          <span className="block truncate lg:hidden" title={title}>{mobileTitle}</span>
          <span className="hidden lg:block">{title}</span>
        </h1>
        <p className="text-[10px] text-gold font-sans mt-1 leading-tight lg:uppercase lg:tracking-[0.2em] lg:font-semibold">
          <span className="lg:hidden">Kaavu Styles · Admin</span>
          <span className="hidden lg:inline">Kaavu Styles Control Center</span>
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link prefetch={false}
          href="/"
          target="_blank"
          aria-label="Open live storefront"
          className="flex items-center justify-center gap-1.5 min-h-10 min-w-10 px-2.5 rounded-lg border border-ivory-300 lg:border-0 text-xs uppercase tracking-wider text-ink hover:text-crimson transition-colors"
        >
          <span className="hidden sm:inline">Live Site</span>
          <ExternalLink className="w-3.5 h-3.5 text-gold" />
        </Link>

        <Link prefetch={false}
          href="/admin/settings"
          title="Admin Security & Password Settings"
          className="hidden sm:flex items-center space-x-2 bg-ivory hover:bg-ivory-200 border border-ivory-300 hover:border-gold px-3 py-1.5 rounded transition-all group"
        >
          <KeyRound className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
          <span suppressHydrationWarning className="text-xs text-ink font-medium group-hover:text-crimson">
            Security &amp; Login
          </span>
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          title="Sign Out of Admin"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-crimson" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}

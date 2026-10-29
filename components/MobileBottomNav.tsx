"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { Home, Store, Heart, ShoppingBag, Package } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cart, wishlist, currentUser, openCartDrawer } = useStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hide mobile bottom nav on Admin pages
  if (pathname?.startsWith("/admin") || (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"))) {
    return null;
  }

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#2B0B14] border-t-2 border-gold/40 shadow-2xl px-2 py-2 flex items-center justify-around text-ivory lg:hidden backdrop-blur-md">
      {/* 1. HOME */}
      <Link prefetch={false}
        href="/"
        className={`flex flex-col items-center justify-center space-y-0.5 px-2 py-1 transition-all ${
          pathname === "/" ? "text-[#E5C378] font-bold" : "text-ivory-300 hover:text-white"
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[9px] uppercase tracking-wider font-sans">Home</span>
      </Link>

      {/* 2. SHOP */}
      <Link prefetch={false}
        href="/shop"
        className={`flex flex-col items-center justify-center space-y-0.5 px-2 py-1 transition-all ${
          pathname === "/shop" ? "text-[#E5C378] font-bold" : "text-ivory-300 hover:text-white"
        }`}
      >
        <Store className="w-5 h-5" />
        <span className="text-[9px] uppercase tracking-wider font-sans">Shop</span>
      </Link>

      {/* 3. WISHLIST */}
      <Link prefetch={false}
        href="/wishlist"
        className={`relative flex flex-col items-center justify-center space-y-0.5 px-2 py-1 transition-all ${
          pathname === "/wishlist" ? "text-[#E5C378] font-bold" : "text-ivory-300 hover:text-white"
        }`}
      >
        <div className="relative">
          <Heart className="w-5 h-5" />
          {isMounted && wishlist.length > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-crimson text-ivory text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-gold">
              {wishlist.length}
            </span>
          )}
        </div>
        <span className="text-[9px] uppercase tracking-wider font-sans">Wishlist</span>
      </Link>

      {/* 4. CART */}
      <button
        onClick={openCartDrawer}
        className="relative flex flex-col items-center justify-center space-y-0.5 px-2 py-1 text-ivory-300 hover:text-[#E5C378] transition-all cursor-pointer"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 text-[#E5C378]" />
          {isMounted && cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-gold text-ink text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold border border-ivory">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[9px] uppercase tracking-wider font-sans">Bag</span>
      </button>

      {/* 5. MY ORDERS (CONDITIONALLY RENDERED ONLY AFTER MOUNT & LOGIN!) */}
      {isMounted && currentUser && (
        <Link prefetch={false}
          href="/orders"
          className={`flex flex-col items-center justify-center space-y-0.5 px-2 py-1 transition-all ${
            pathname === "/orders" ? "text-[#E5C378] font-bold" : "text-ivory-300 hover:text-white"
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider font-sans">Orders</span>
        </Link>
      )}
    </div>
  );
}

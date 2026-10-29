"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ProductSearch from "@/components/ProductSearch";
import { usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import {
  ShoppingBag,
  Heart,
  Menu,
  X,
  Sparkles,
  Phone,
  Package,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { getCartItemCount, wishlist, openCartDrawer, currentUser, logout, openAuthModal, coupons } = useStore();
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const cartCount = getCartItemCount();

  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [couponClock, setCouponClock] = useState(0);

  useEffect(() => {
    let lastPosition = Math.max(0, window.scrollY);
    setHeaderHidden(false);
    const handleScroll = () => {
      const position = Math.max(0, window.scrollY);
      if (window.matchMedia("(min-width: 1024px)").matches || position < 80 || mobileMenuOpen || mobileProfileOpen || profileDropdownOpen) {
        setHeaderHidden(false);
        lastPosition = position;
        return;
      }
      if (Math.abs(position - lastPosition) < 12) return;
      setHeaderHidden(position > lastPosition);
      lastPosition = position;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [pathname, mobileMenuOpen, mobileProfileOpen, profileDropdownOpen]);

  const isAdminPage = pathname?.startsWith("/admin") || (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const refreshCouponClock = () => setCouponClock(Date.now());
    refreshCouponClock();
    const interval = window.setInterval(refreshCouponClock, 10_000);
    window.addEventListener("focus", refreshCouponClock);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshCouponClock);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  // Match the conditions used when a customer applies a coupon.
  const navbarCoupons = coupons.filter((coupon) => {
    if (!coupon.isActive || !coupon.showInNavbar || !couponClock) return false;
    if (coupon.validFrom && !(Date.parse(coupon.validFrom) <= couponClock)) return false;
    if (coupon.validUntil && !(Date.parse(coupon.validUntil) >= couponClock)) return false;
    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) return false;
    return true;
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setMobileProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isAdminPage) return null;

  return (
    <header onFocusCapture={() => setHeaderHidden(false)} className={`sticky top-0 z-50 shrink-0 bg-ivory shadow-luxury border-b border-gold/30 transition-transform duration-300 motion-reduce:transition-none lg:translate-y-0 ${headerHidden ? "-translate-y-full" : "translate-y-0"}`}>
      {/* 1. TOP ANNOUNCEMENT BAR (DYNAMIC SCROLLING MARQUEE) */}
      {isMounted && (
        <div className="bg-[#2B0B14] text-ivory py-1.5 overflow-hidden text-[11px] font-sans tracking-wide border-b border-gold/30">
          <div className="animate-marquee whitespace-nowrap flex items-center space-x-6 sm:space-x-8 font-medium" style={{ animationDuration: "50s" }}>
            {[1, 2, 3, 4, 5, 6].map((group) => (
              <React.Fragment key={group}>
                {navbarCoupons.length > 0 ? (
                  navbarCoupons.map((c) => (
                    <React.Fragment key={`${group}-${c.id}`}>
                      <div className="flex items-center space-x-2.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#E5C378] flex-shrink-0 animate-pulse" />
                        <span className="text-[#E5C378] font-medium">
                          {c.description || `Enjoy Discount on Orders Above ₹${c.minOrderValue}`} — Use coupon Code: {c.code}
                        </span>
                      </div>
                      <span className="text-[#E5C378]/60">•</span>
                    </React.Fragment>
                  ))
                ) : (
                  <React.Fragment key={`${group}-welcome`}>
                    <div className="flex items-center space-x-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#E5C378] flex-shrink-0 animate-pulse" />
                      <span className="text-[#E5C378] font-medium">
                        Welcome to Kaavu Styles
                      </span>
                    </div>
                    <span className="text-[#E5C378]/60">•</span>
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[#E5C378] font-medium">
                        Artisanal Handcrafted Couture & Designer Kurtis
                      </span>
                    </div>
                    <span className="text-[#E5C378]/60">•</span>
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[#E5C378] font-medium">
                        Free Express Delivery Across India
                      </span>
                    </div>
                    <span className="text-[#E5C378]/60">•</span>
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[#E5C378] font-medium">
                        For Every Version Of You
                      </span>
                    </div>
                    <span className="text-[#E5C378]/60">•</span>
                  </React.Fragment>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* 2. MAIN NAVIGATION ROW */}
      <div className="w-full px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* BRAND LOGO */}
          <Link prefetch={false} href="/" className="flex min-w-0 items-center space-x-2.5 sm:space-x-3 group">
            <div className="relative w-8 h-8 sm:w-9.5 sm:h-9.5 rounded-full overflow-hidden border-2 border-gold shadow-sm bg-ivory flex items-center justify-center group-hover:scale-105 transition-transform">
              <Image
                src="/icon.webp"
                alt="Kaavu Styles"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-serif text-sm sm:text-xl font-normal tracking-[0.12em] sm:tracking-[0.16em] text-ink uppercase group-hover:text-burgundy transition-colors">
                Kaavu Styles
              </span>
              <span className="block truncate text-[8px] sm:text-[9px] tracking-[0.2em] uppercase text-gold font-sans -mt-0.5">
                For Every Version Of You
              </span>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION TABS */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-medium tracking-[0.2em] uppercase text-ink">
            <Link prefetch={false}
              href="/"
              className={`hover:text-burgundy transition-colors ${pathname === "/" ? "text-burgundy font-bold border-b-2 border-gold pb-1" : ""
                }`}
            >
              Home
            </Link>
            <Link prefetch={false}
              href="/catory"
              className={`hover:text-burgundy transition-colors ${pathname === "/catory" || pathname === "/categories" ? "text-burgundy font-bold border-b-2 border-gold pb-1" : ""
                }`}
            >
              Categories
            </Link>
            <Link prefetch={false}
              href="/shop"
              className={`hover:text-burgundy transition-colors ${pathname === "/shop" ? "text-burgundy font-bold border-b-2 border-gold pb-1" : ""
                }`}
            >
              Shop Collections
            </Link>

            <Link prefetch={false}
              href="/story"
              className={`hover:text-burgundy transition-colors ${pathname === "/story" || pathname === "/about" ? "text-burgundy font-bold border-b-2 border-gold pb-1" : ""
                }`}
            >
              Our Story
            </Link>
            <Link prefetch={false}
              href="/contact"
              className={`hover:text-burgundy transition-colors ${pathname === "/contact" ? "text-burgundy font-bold border-b-2 border-gold pb-1" : ""
                }`}
            >
              Contact
            </Link>
          </nav>

          {/* ACTION ICONS: WISHLIST, CART ICON, PROFILE DROPDOWN */}
          <div className="hidden lg:flex items-center space-x-5">
            <ProductSearch />
            {/* Wishlist Icon */}
            <Link prefetch={false}
              href="/wishlist"
              className="relative p-2 text-ink hover:text-burgundy transition-colors"
              title="My Wishlist"
            >
              <Heart className="w-5 h-5 text-burgundy hover:scale-110 transition-transform" />
              {isMounted && wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-crimson text-ivory text-[10px] rounded-full flex items-center justify-center font-sans font-bold shadow-sm">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Shopping Cart Icon */}
            <button
              onClick={openCartDrawer}
              className="relative p-2.5 bg-burgundy hover:bg-burgundy-600 text-ivory rounded-full transition-all shadow-md hover:scale-105 group border border-gold/40 cursor-pointer"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-gold text-ink text-[11px] font-extrabold rounded-full flex items-center justify-center shadow-md border border-ivory">
                {isMounted ? cartCount : 0}
              </span>
            </button>

            {/* Premium Desktop Profile Button */}
            <div className="relative" ref={dropdownRef}>
              {isMounted && currentUser ? (
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2.5 px-4 py-1.5 border-2 border-gold bg-ivory-200 hover:bg-gold hover:text-ivory transition-all text-ink text-xs uppercase tracking-wider font-bold rounded-full shadow-sm cursor-pointer group"
                  title="My Account"
                >
                  <div className="w-5 h-5 rounded-full bg-burgundy text-gold font-extrabold flex items-center justify-center text-[10px] group-hover:bg-ivory group-hover:text-burgundy">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-serif font-bold max-w-[120px] truncate">{currentUser.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gold group-hover:text-ivory transition-transform duration-200 ${profileDropdownOpen ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="flex items-center space-x-2 px-4 py-2 border-2 border-gold bg-burgundy hover:bg-burgundy-600 text-ivory transition-all text-xs uppercase tracking-widest font-bold rounded-full shadow-md cursor-pointer group"
                  title="Sign In / Register"
                >
                  <UserIcon className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
                  <span>Login</span>
                </button>
              )}

              {/* Dropdown Floating Menu */}
              {profileDropdownOpen && currentUser && (
                <div className="absolute right-0 mt-2 w-56 bg-ivory border-2 border-gold shadow-2xl z-50 p-2 space-y-1 animate-fadeIn">
                  {/* Account Header */}
                  <div className="px-3 py-2 border-b border-ivory-300 bg-ivory-200">
                    <p className="font-serif text-sm font-semibold text-burgundy uppercase truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-ink-muted truncate font-sans">
                      {currentUser.email}
                    </p>
                  </div>

                  {/* Dropdown Links */}
                  <div className="py-1 space-y-0.5 text-xs font-sans uppercase tracking-wider">
                    <Link prefetch={false}
                      href="/orders"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-3 py-2 text-ink hover:bg-crimson hover:text-ivory transition-colors font-medium"
                    >
                      <Package className="w-4 h-4 text-gold" />
                      <span>My Orders</span>
                    </Link>

                    {currentUser.role === "admin" && (
                      <Link prefetch={false}
                        href="/admin/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 text-gold font-bold hover:bg-gold hover:text-ivory transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <div className="pt-1 border-t border-ivory-300">
                      <button
                        onClick={() => {
                          logout();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-crimson hover:bg-crimson hover:text-ivory transition-colors font-bold text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MOBILE ACTIONS: DIRECT LOGIN BUTTON OR PROFILE ICON WITH NAME */}
          <div className="flex shrink-0 items-center space-x-1.5 sm:space-x-2.5 lg:hidden" ref={mobileDropdownRef}>
            <ProductSearch />
            {isMounted && currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setMobileProfileOpen(!mobileProfileOpen)}
                  aria-label="Open profile menu" aria-expanded={mobileProfileOpen}
                  className="flex items-center gap-1 p-2 bg-burgundy text-ivory border border-gold rounded-full shadow-sm"
                >
                  <UserIcon className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                  
                  <ChevronDown className={`w-3 h-3 text-gold transition-transform duration-200 ${mobileProfileOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Mobile Profile Dropdown */}
                {mobileProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-ivory border-2 border-gold shadow-2xl z-50 p-2 space-y-1 animate-fadeIn">
                    <div className="px-3 py-1.5 border-b border-ivory-300 bg-ivory-200 text-[11px]">
                      <p className="font-serif font-bold text-burgundy uppercase truncate">{currentUser.name}</p>
                      <p className="text-[9px] text-ink-muted truncate font-mono">{currentUser.email}</p>
                    </div>
                    <Link prefetch={false}
                      href="/orders"
                      onClick={() => setMobileProfileOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-ink hover:bg-crimson hover:text-ivory transition-colors text-xs font-medium uppercase tracking-wider"
                    >
                      <Package className="w-3.5 h-3.5 text-gold" />
                      <span>My Orders</span>
                    </Link>
                    {currentUser.role === "admin" && (
                      <Link prefetch={false}
                        href="/admin/dashboard"
                        onClick={() => setMobileProfileOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 text-gold font-bold hover:bg-gold hover:text-ivory transition-colors text-xs uppercase tracking-wider"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setMobileProfileOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-crimson hover:bg-crimson hover:text-ivory transition-colors text-xs font-bold text-left uppercase tracking-wider"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <button type="button" aria-label="Open profile menu" aria-expanded={mobileProfileOpen} onClick={() => setMobileProfileOpen(!mobileProfileOpen)} className="flex items-center gap-1 p-2 bg-burgundy text-ivory border border-gold rounded-full shadow-sm">
                  <UserIcon className="w-4 h-4 text-gold" />
                  <ChevronDown className={`w-3 h-3 text-gold transition-transform ${mobileProfileOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileProfileOpen && <div className="absolute right-0 mt-2 w-48 bg-ivory border border-gold shadow-xl p-2 z-50">
                  <p className="px-3 py-2 font-serif text-lg">Welcome to Kaavu</p>
                  <button type="button" onClick={() => { setMobileProfileOpen(false); openAuthModal(); }} className="w-full text-left px-3 py-3 text-xs text-crimson hover:bg-ivory-200">Sign in / Register</button>
                </div>}
              </div>
            )}
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              onClick={() => {
                setMobileProfileOpen(false);
                setMobileMenuOpen((open) => !open);
              }}
              className="rounded-full border border-gold bg-burgundy p-2 text-gold shadow-sm hover:bg-burgundy-600"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm lg:hidden" onClick={(event) => { if (event.target === event.currentTarget) setMobileMenuOpen(false); }}>
          <div id="mobile-navigation-drawer" className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-ivory shadow-2xl p-6 flex flex-col justify-between border-l-2 border-gold animate-slideLeft">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-ivory-300">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative border border-gold">
                    <Image src="/icon.webp" alt="Logo" fill className="object-cover" />
                  </div>
                  <span className="font-serif text-lg text-burgundy font-medium uppercase tracking-widest">
                    Kaavu Styles
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1 text-ink hover:text-burgundy"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Auth Status Banner */}
              <div className="py-4 border-b border-ivory-300">
                {currentUser ? (
                  <div className="bg-ivory-200 p-3 border border-gold/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-burgundy uppercase block">
                          {currentUser.name}
                        </span>
                        <span className="text-[10px] text-ink-muted block">{currentUser.email}</span>
                      </div>
                      {currentUser.role === "admin" && (
                        <span className="text-[9px] bg-gold text-ivory px-2 py-0.5 font-bold uppercase rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal();
                    }}
                    className="w-full py-2.5 bg-burgundy text-ivory text-xs uppercase font-bold tracking-widest text-center flex items-center justify-center space-x-2"
                  >
                    <UserIcon className="w-4 h-4 text-gold" />
                    <span>Sign In / Register</span>
                  </button>
                )}
              </div>

              <nav className="flex flex-col space-y-5 pt-6 font-serif text-xl text-ink">
                <Link prefetch={false}
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-burgundy transition-colors"
                >
                  Home
                </Link>
                <Link prefetch={false}
                  href="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-burgundy transition-colors"
                >
                  Shop Collections
                </Link>

                {currentUser && (
                  <Link prefetch={false}
                    href="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-burgundy transition-colors flex items-center justify-between"
                  >
                    <span>My Orders</span>
                    <Package className="w-5 h-5 text-gold" />
                  </Link>
                )}

                <Link prefetch={false}
                  href="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-burgundy transition-colors flex items-center justify-between"
                >
                  <span>My Wishlist</span>
                  {wishlist.length > 0 && (
                    <span className="text-xs bg-burgundy text-ivory px-2 py-0.5 rounded-full font-sans font-bold">
                      {wishlist.length}
                    </span>
                  )}
                </Link>

                {currentUser?.role === "admin" && (
                  <Link prefetch={false}
                    href="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gold font-bold hover:text-burgundy transition-colors flex items-center space-x-2"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}

                <Link prefetch={false}
                  href="/story"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-burgundy transition-colors"
                >
                  Our Story
                </Link>
                <Link prefetch={false}
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-burgundy transition-colors"
                >
                  Contact Us
                </Link>
              </nav>
            </div>

            {currentUser && (
              <div className="pt-4 border-t border-ivory-300">
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 bg-crimson text-ivory text-xs uppercase tracking-widest font-bold text-center flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

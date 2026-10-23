"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/utils";
import { X, Trash2, Plus, Minus, ShoppingBag, Lock, ShieldCheck, Ticket, Tag, CheckCircle } from "lucide-react";
import CheckoutModal from "@/components/CheckoutModal";
import { productCardUrl } from "@/lib/productImages";

export default function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    isCartDrawerOpen,
    closeCartDrawer,
    updateCartQty,
    removeFromCart,
    getCartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    currentUser,
    openAuthModal,
    ipAddress,
  } = useStore();

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ success: boolean; text: string } | null>(null);

  if (!isCartDrawerOpen) return null;

  const subtotal = getCartTotal();
  const discount = getDiscountAmount();
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const grandTotal = discountedSubtotal;

  const handleApplyCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyCoupon(couponInput);
    setCouponMsg({ success: res.success, text: res.message });
    if (res.success) {
      setCouponInput("");
    }
  };

  const handleProceedToCheckout = () => {
    if (!currentUser) {
      closeCartDrawer();
      openAuthModal();
    } else {
      closeCartDrawer();
      router.push("/checkout");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCartDrawer}
        className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-out Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-ivory shadow-2xl flex flex-col justify-between border-l border-gold animate-slideLeft">
        {/* Drawer Header */}
        <div className="p-6 border-b border-ivory-300 flex items-center justify-between bg-ivory-100">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-crimson" />
            <h2 className="font-serif text-2xl text-ink uppercase tracking-[0.18em]">
              Shopping Bag
            </h2>
          </div>
          <button
            onClick={closeCartDrawer}
            className="p-2 text-ink hover:text-crimson transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* IP Session info badge */}
        <div className="bg-ivory-200 px-6 py-2 border-b border-ivory-300 flex items-center justify-between text-[10px] text-ink-muted uppercase tracking-[0.16em]">
          <span className="flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 text-gold mr-1" />
            Guest IP Session Active
          </span>
          <span className="font-mono text-gold font-semibold">{ipAddress}</span>
        </div>

        {/* Drawer Body - Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <ShoppingBag className="w-12 h-12 text-ink-muted/40 mx-auto" />
              <p className="font-serif text-xl text-ink uppercase tracking-wide">
                Your bag is empty
              </p>
              <p className="text-xs text-ink-muted max-w-xs mx-auto">
                Explore our Royal Sarees, Kurtis, Lehengas, and Indo-Western couture collections.
              </p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${idx}`}
                className="flex space-x-4 border-b border-ivory-300 pb-6"
              >
                {/* Product Thumbnail */}
                <div className="relative w-20 h-24 bg-ivory-200 flex-shrink-0 overflow-hidden border border-ivory-300">
                  <Image
                    src={productCardUrl(item.product.images[0] || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=400")}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-base text-ink leading-tight line-clamp-2">
                      {item.product.name}
                    </h3>
                    <div className="text-[10px] text-gold uppercase tracking-widest mt-1 space-x-2">
                      <span>Size: {item.selectedSize}</span>
                      <span>•</span>
                      <span>Color: {item.selectedColor}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-ivory-300 bg-ivory-50">
                      <button
                        onClick={() =>
                          updateCartQty(
                            item.product.id,
                            item.selectedSize,
                            item.selectedColor,
                            item.quantity - 1
                          )
                        }
                        className="p-1.5 text-ink hover:text-crimson"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-xs font-semibold text-ink">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateCartQty(
                            item.product.id,
                            item.selectedSize,
                            item.selectedColor,
                            item.quantity + 1
                          )
                        }
                        className="p-1.5 text-ink hover:text-crimson"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price & Remove */}
                    <div className="text-right">
                      <p className="text-xs font-bold text-crimson">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                      <button
                        onClick={() =>
                          removeFromCart(
                            item.product.id,
                            item.selectedSize,
                            item.selectedColor
                          )
                        }
                        className="text-[10px] text-ink-muted hover:text-crimson flex items-center space-x-1 ml-auto mt-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-ivory-300 bg-ivory-100 space-y-4">
            {/* APPLY COUPON SECTION */}
            {/*  <div className="bg-white p-3 border border-gold/40 space-y-2">
              <div className="flex items-center space-x-1.5 text-ink font-bold text-[11px] uppercase tracking-wider">
                <Ticket className="w-3.5 h-3.5 text-crimson" />
                <span>Apply Promo Coupon</span>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 p-2 border border-emerald-300 text-xs">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold font-mono">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{appliedCoupon.code}</span>
                    <span className="text-[10px] text-emerald-700">(-{formatPrice(discount)})</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-[10px] text-crimson hover:underline font-bold uppercase tracking-wider"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCouponSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon Code (e.g. KAAVU10)"
                    className="flex-1 bg-ivory-50 border border-ivory-300 p-2 text-xs font-mono font-bold uppercase text-ink outline-none focus:border-gold"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-crimson hover:bg-crimson-800 text-ivory text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponMsg && !appliedCoupon && (
                <p className={`text-[10px] font-semibold ${couponMsg.success ? "text-emerald-700" : "text-crimson"}`}>
                  {couponMsg.text}
                </p>
              )}
            </div>  */}

            <div className="flex items-center justify-between uppercase tracking-wider">
              <span className="text-xs font-bold text-ink">Total</span>
              <span className="font-serif text-2xl text-crimson font-bold">
                {formatPrice(grandTotal)}
              </span>
            </div>

            {!currentUser && (
              <div className="flex items-center space-x-2 text-[11px] text-amber-800 bg-amber-50 p-2.5 border border-amber-200 rounded">
                <Lock className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>Login is required before placing an order checkout.</span>
              </div>
            )}

            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 bg-crimson hover:bg-crimson-800 text-ivory text-xs uppercase tracking-[0.24em] font-semibold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{currentUser ? "Proceed to Checkout" : "Login to Checkout"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
        />
      )}
    </>
  );
}

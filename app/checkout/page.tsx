"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/utils";
import { payWithRazorpay } from "@/lib/razorpay-checkout";
import { productCardUrl } from "@/lib/productImages";
import {
  ShieldCheck,
  MapPin,
  Phone,
  User as UserIcon,
  Building,
  Navigation,
    CheckCircle2,
  Ticket,
  CheckCircle,
  ShoppingBag,
  ArrowLeft,
  Package,
  Plus,
  BookmarkCheck,
  Lock,
} from "lucide-react";

export interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  address: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
];

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    getCartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    acceptPaidOrder,
    currentUser,
    openAuthModal,
    ipAddress,
  } = useStore();

  const [isMounted, setIsMounted] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Telangana");
  const [postalCode, setPostalCode] = useState("");
  const [saveAddressLocally, setSaveAddressLocally] = useState(true);

  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load Saved Addresses on Mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ks_saved_addresses");
        if (saved) {
          const parsed: SavedAddress[] = JSON.parse(saved);
          setSavedAddresses(parsed);
          if (parsed.length > 0) {
            const def = parsed[0];
            setSelectedAddressId(def.id);
            setName(def.name);
            setPhone(def.phone);
            setAddress(def.address);
            setLandmark(def.landmark || "");
            setCity(def.city);
            setState(def.state);
            setPostalCode(def.postalCode);
          }
        }
      } catch (e) {
        console.warn("Could not load ks_saved_addresses:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser?.email) setEmail(currentUser.email);
    if (currentUser?.name && !name) setName(currentUser.name);
  }, [currentUser, name]);

  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setName(addr.name);
    setPhone(addr.phone);
    setAddress(addr.address);
    setLandmark(addr.landmark || "");
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
  };

  const handleAddNewAddressClick = () => {
    setSelectedAddressId("new");
    setName(currentUser?.name || "");
    setPhone("");
    setAddress("");
    setLandmark("");
    setCity("");
    setState("Telangana");
    setPostalCode("");
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || placing) return;

    if (saveAddressLocally && address && city && postalCode) {
      try {
        const newAddr: SavedAddress = {
          id: "addr-" + Date.now(),
          name,
          phone,
          address,
          landmark,
          city,
          state,
          postalCode,
        };
        const updatedList = [newAddr, ...savedAddresses.filter((a) => a.address !== address)];
        setSavedAddresses(updatedList);
        localStorage.setItem("ks_saved_addresses", JSON.stringify(updatedList));
      } catch (err) {
        console.warn("Could not save address to localStorage:", err);
      }
    }

    const fullShippingAddress = `${address}${landmark ? `, Near ${landmark}` : ""}, ${city}, ${state}`;

    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      size: item.selectedSize,
      color: item.selectedColor,
      image: item.product.images[0] || "",
    }));

    setPlacing(true); setOrderError("");
    try {
    const newOrder = await payWithRazorpay({
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      shippingAddress: fullShippingAddress,
      city,
      postalCode,
      couponCode: appliedCoupon?.code,
      status: "Pending",
      items: orderItems,
      ipAddress,
    });

    acceptPaidOrder(newOrder);
    setPlacedOrder(newOrder);

    // Dispatch direct email notification to kaavustyles@gmail.com and customer
    try {
      void fetch("/api/orders/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder }),
      });
    } catch (notifyErr) {
      console.warn("Could not dispatch order notification email:", notifyErr);
    }
    } catch (error) { setOrderError(error instanceof Error ? error.message : "Payment could not be completed."); } finally { setPlacing(false); }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#FBF8F3] flex items-center justify-center p-8">
        <p className="text-sm font-semibold text-ink-muted">Loading Secure Checkout Page...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF8F3] py-8 px-4 sm:px-6 lg:px-12 text-ink font-sans">
      {/* Top Header Navigation Bar */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          href="/shop"
          className="flex items-center space-x-2 text-xs uppercase tracking-wider font-bold text-ink hover:text-crimson transition-colors bg-white px-4 py-2 border border-gold/40 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-gold" />
          <span>Back to Collections</span>
        </Link>

        <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-burgundy font-bold bg-ivory-200 px-4 py-2 border border-gold/40 shadow-sm">
          <ShieldCheck className="w-4.5 h-4.5 text-gold" />
          <span>Kaavu Styless Official 256-Bit SSL Secure Checkout</span>
        </div>
      </div>

      {placedOrder ? (
        /* Order Confirmed View Box */
        <div className="max-w-3xl mx-auto bg-white border-2 border-gold shadow-2xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-ink uppercase tracking-wide">
              Order Successfully Confirmed!
            </h1>
            <p className="text-sm text-gold uppercase tracking-[0.2em] font-extrabold mt-1">
              Official Order Reference: #{placedOrder.orderNumber}
            </p>
          </div>

          <div className="bg-ivory-100 p-6 border-2 border-gold/40 text-left text-xs space-y-3">
            <p className="font-bold text-burgundy uppercase tracking-wider text-xs border-b border-gold/30 pb-2 flex justify-between items-center">
              <span>Doorstep Delivery Address:</span>
              <span className="text-emerald-700 font-mono text-[10px]">PAID ({placedOrder.status})</span>
            </p>
            <p className="text-ink font-bold text-sm">{placedOrder.customerName} (Phone: {placedOrder.customerPhone})</p>
            <p className="text-ink-muted leading-relaxed text-xs">{placedOrder.shippingAddress}</p>
            <p className="text-ink-muted font-mono text-xs">PIN Code: {placedOrder.postalCode}</p>
            <div className="pt-3 border-t border-gold/30 flex justify-between items-center">
              <span className="font-bold text-ink uppercase tracking-wider text-xs">Grand Total Amount:</span>
              <span className="font-serif text-2xl text-crimson font-extrabold">{formatPrice(placedOrder.totalAmount)}</span>
            </div>
          </div>

          <p className="text-xs text-ink-muted max-w-md mx-auto">
            Thank you for shopping with Kaavu Styless. Order details have been dispatched to <span className="font-semibold text-ink">{placedOrder.customerEmail}</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/orders"
              className="w-full sm:w-auto px-8 py-3.5 bg-burgundy hover:bg-burgundy-600 text-ivory text-xs uppercase tracking-[0.2em] font-bold shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Package className="w-4 h-4 text-gold" />
              <span>View My Orders</span>
            </Link>
            <Link
              href="/shop"
              className="w-full sm:w-auto px-8 py-3.5 bg-gold hover:bg-amber-600 text-ink text-xs uppercase tracking-[0.2em] font-bold shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      ) : cart.length === 0 ? (
        /* Empty Cart State */
        <div className="max-w-xl mx-auto bg-white border-2 border-gold p-10 text-center space-y-6 shadow-2xl">
          <ShoppingBag className="w-16 h-16 text-gold/40 mx-auto" />
          <h2 className="font-serif text-2xl uppercase text-ink">Your Shopping Bag Is Empty</h2>
          <p className="text-xs text-ink-muted">
            Please add items from our Ethnic Wear, Sarees, and Kurti collections before checking out.
          </p>
          <Link
            href="/shop"
            className="inline-block px-8 py-3.5 bg-crimson text-ivory text-xs uppercase tracking-[0.2em] font-bold shadow-md"
          >
            Explore Collections Now
          </Link>
        </div>
      ) : (
        /* Standalone Checkout Page Rectangle Box Layout */
        <div className="max-w-6xl mx-auto bg-white border-2 border-gold shadow-2xl overflow-hidden p-6 sm:p-10">
          <div className="border-b-2 border-gold/40 pb-5 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-[#2B0B14] text-ivory -mx-6 -mt-6 sm:-mx-10 sm:-mt-10 p-6 sm:p-8">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-light uppercase tracking-[0.16em]">
                Kaavu StylesS CHECKOUT
              </h1>
              <p className="text-xs text-gold uppercase tracking-[0.22em] font-sans mt-1">
                Express Doorstep Delivery Order Form
              </p>
            </div>
            {!currentUser && (
              <button
                onClick={openAuthModal}
                className="px-4 py-2 bg-gold text-ink text-xs uppercase tracking-wider font-extrabold flex items-center space-x-1.5 shadow cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Login for Saved Details</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* LEFT COLUMN: DOORSTEP SHIPPING ADDRESS & PAYMENT (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              {/* SAVED ADDRESS SELECTOR */}
              {savedAddresses.length > 0 && (
                <div className="bg-ivory-100 p-4 border border-gold/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-burgundy flex items-center space-x-1.5">
                      <BookmarkCheck className="w-4 h-4 text-gold" />
                      <span>Select From Saved Delivery Addresses</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddNewAddressClick}
                      className="text-[10px] uppercase font-bold text-crimson hover:underline flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Enter New Address.</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectAddress(addr)}
                        className={`p-3 border text-xs cursor-pointer transition-all ${
                          selectedAddressId === addr.id
                            ? "border-crimson bg-crimson/5 shadow-sm"
                            : "border-ivory-300 bg-white hover:border-gold"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-ink">
                          <span>{addr.name}</span>
                          {selectedAddressId === addr.id && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-crimson" />
                          )}
                        </div>
                        <p className="text-[11px] text-ink-muted truncate mt-0.5">{addr.phone}</p>
                        <p className="text-[11px] text-ink-muted line-clamp-2 mt-0.5">{addr.address}, {addr.city}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADDRESS FORM HEADER */}
              <div className="border-b border-gold/30 pb-2">
                <h3 className="font-serif text-xl uppercase text-ink flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-crimson" />
                  <span>1. Doorstep Delivery Address</span>
                </h3>
                <p className="text-xs text-ink-muted">
                  Please provide your complete shipping address for accurate courier delivery.
                </p>
              </div>

              {/* FULL NAME & PHONE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ink mb-1">
                    Full Name <span className="text-crimson">*</span>
                  </label>
                  <div className="flex items-center border border-ivory-300 bg-ivory-50 p-3 focus-within:border-gold">
                    <UserIcon className="w-4 h-4 text-gold mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent text-xs text-ink outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ink mb-1">
                    Phone Number (10 Digits) <span className="text-crimson">*</span>
                  </label>
                  <div className="flex items-center border border-ivory-300 bg-ivory-50 p-3 focus-within:border-gold">
                    <Phone className="w-4 h-4 text-gold mr-2 flex-shrink-0" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-transparent text-xs text-ink outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* STREET ADDRESS */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink mb-1">
                  Flat, House No., Building Name & Street Address <span className="text-crimson">*</span>
                </label>
                <div className="flex items-start border border-ivory-300 bg-ivory-50 p-3 focus-within:border-gold">
                  <Building className="w-4 h-4 text-gold mr-2 mt-0.5 flex-shrink-0" />
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Flat 402, Royal Residency, Road No. 12, Jubilee Hills"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-transparent text-xs text-ink outline-none resize-none"
                  />
                </div>
              </div>

              {/* LANDMARK & CITY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ink mb-1">
                    Landmark / Nearby Area (Optional)
                  </label>
                  <div className="flex items-center border border-ivory-300 bg-ivory-50 p-3 focus-within:border-gold">
                    <Navigation className="w-4 h-4 text-gold mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="e.g. Near Metro Station / Temple"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full bg-transparent text-xs text-ink outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ink mb-1">
                    City / Town <span className="text-crimson">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bengaluru"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-ivory-300 bg-ivory-50 p-3 text-xs text-ink outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* STATE & POSTAL CODE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ink mb-1">
                    State <span className="text-crimson">*</span>
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full border border-ivory-300 bg-ivory-50 p-3 text-xs text-ink outline-none focus:border-gold"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ink mb-1">
                    PIN Code / Postal Code <span className="text-crimson">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500033"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full border border-ivory-300 bg-ivory-50 p-3 text-xs font-mono font-bold text-ink outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* SAVE ADDRESS CHECKBOX */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="saveAddressCheckPage"
                  checked={saveAddressLocally}
                  onChange={(e) => setSaveAddressLocally(e.target.checked)}
                  className="w-4 h-4 accent-crimson cursor-pointer"
                />
                <label htmlFor="saveAddressCheckPage" className="text-xs text-ink font-medium cursor-pointer">
                  Save this address for fast 1-click checkout in future orders
                </label>
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER ITEMS RECTANGLE SUMMARY (5 COLS) */}
            <div className="lg:col-span-5 bg-ivory-100 p-6 border-2 border-gold/40 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="border-b border-gold/30 pb-3 flex items-center justify-between">
                  <h3 className="font-serif text-lg uppercase text-burgundy font-bold">
                    Order Summary ({cart.length} items)
                  </h3>
                  <Link href="/shop" className="text-[10px] uppercase font-bold text-crimson hover:underline">
                    Edit Items
                  </Link>
                </div>

                {/* CART ITEMS LIST RECTANGLE */}
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-ivory-300">
                  {cart.map((item, idx) => (
                    <div key={idx} className="pt-3 flex space-x-3 text-xs">
                      <div className="relative w-14 h-16 bg-ivory-200 border border-gold/30 flex-shrink-0 overflow-hidden">
                        <Image
                          src={productCardUrl(item.product.images[0] || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=300")}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <h4 className="font-serif text-xs font-semibold text-ink leading-tight line-clamp-1">
                          {item.product.name}
                        </h4>
                        <p className="text-[10px] text-ink-muted font-mono">
                          Qty: {item.quantity} × {formatPrice(item.product.price)}
                        </p>
                        <p className="text-[9px] text-gold uppercase tracking-wider">
                          {item.selectedSize} • {item.selectedColor}
                        </p>
                      </div>
                      <span className="font-bold text-crimson text-xs">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* COUPON SECTION */}
               {/*  <div className="bg-white p-3.5 border border-gold/40 space-y-2">
                  <div className="flex items-center space-x-1.5 text-ink font-bold text-[11px] uppercase tracking-wider">
                    <Ticket className="w-3.5 h-3.5 text-crimson" />
                    <span>Apply Promo Coupon Code</span>
                  </div>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 p-2 border border-emerald-300 text-xs">
                      <div className="flex items-center space-x-2 text-emerald-800 font-bold font-mono">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>{appliedCoupon.code}</span>
                        <span className="text-[10px] text-emerald-700">(-{formatPrice(discount)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-[10px] text-crimson hover:underline font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter Coupon Code"
                        className="flex-1 bg-ivory-50 border border-ivory-300 p-2 text-xs font-mono font-bold uppercase text-ink outline-none focus:border-gold"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCouponSubmit}
                        className="px-4 py-2 bg-crimson hover:bg-crimson-800 text-ivory text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {couponMsg && !appliedCoupon && (
                    <p className={`text-[10px] font-semibold ${couponMsg.success ? "text-emerald-700" : "text-crimson"}`}>
                      {couponMsg.text}
                    </p>
                  )}
                </div>  */}

                {/* PRICE BREAKDOWN RECTANGLE */}
                <div className="bg-white p-4 border border-gold/40 space-y-2 text-xs">


                  <div className="flex justify-between items-center">
                    <span className="font-bold text-ink uppercase tracking-wider">Total Amount:</span>
                    <span className="font-serif text-2xl text-crimson font-extrabold">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* PLACE ORDER BUTTON */}
              {orderError && <p role="alert" className="text-sm text-crimson">{orderError}</p>}
              <button
                type="submit" disabled={placing}
                className="w-full py-4 bg-crimson hover:bg-crimson-800 text-ivory font-sans text-xs uppercase tracking-[0.24em] font-extrabold transition-all shadow-xl cursor-pointer border-2 border-gold"
              >
                {placing ? "Processing payment…" : `Pay ${formatPrice(grandTotal)} & Place Order`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

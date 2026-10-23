"use client";

import React, { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import AdminListCard from "@/components/AdminListCard";
import { useStore } from "@/context/StoreContext";
import { Coupon } from "@/lib/mockData";
import { formatPrice } from "@/lib/utils";
import {
  Plus,
  Trash2,
  X,
  Ticket,
  Pencil,
  CheckCircle,
  Sparkles,
  Percent,
  DollarSign,
  Calendar,
  ShieldCheck,
  Tag,
  Copy,
  Check,
} from "lucide-react";

function formatCouponDate(dateStr?: string | null): string {
  if (!dateStr) return "Never";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export default function AdminCouponsPage() {
  const { coupons, couponsError, addCoupon, updateCoupon, deleteCoupon, isLoading } = useStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Form states matching prompt specifications exactly
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number | "">(20);
  const [maxDiscount, setMaxDiscount] = useState<number | "">("");
  const [minOrderValue, setMinOrderValue] = useState<number | "">(0);
  const [usageLimit, setUsageLimit] = useState<number | "">("");
  const [validFrom, setValidFrom] = useState("2026-10-08T16:50");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showInNavbar, setShowInNavbar] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [codeError, setCodeError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyCouponId, setBusyCouponId] = useState<string | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);

  const changeCoupon = async (id: string, fields: Partial<Coupon>) => {
    setActionError("");
    setBusyCouponId(id);
    try { await updateCoupon(id, fields); }
    catch (error) { setActionError(error instanceof Error ? error.message : "Could not update coupon."); }
    finally { setBusyCouponId(null); }
  };

  const removeSavedCoupon = async (id: string) => {
    setActionError("");
    setBusyCouponId(id);
    try { await deleteCoupon(id); }
    catch (error) { setActionError(error instanceof Error ? error.message : "Could not delete coupon."); }
    finally { setBusyCouponId(null); }
  };

  const handleCopyCode = (codeToCopy: string) => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(codeToCopy);
      setCopiedCode(codeToCopy);
      setTimeout(() => {
        setCopiedCode(null);
      }, 2000);
    }
  };

  const handleOpenAdd = () => {
    setActionError("");
    setEditingCouponId(null);
    setCode("");
    setDescription("");
    setDiscountType("percentage");
    setDiscountValue(20);
    setMaxDiscount("");
    setMinOrderValue(0);
    setUsageLimit("");
    setValidFrom(new Date().toISOString().slice(0, 16));
    setValidUntil("");
    setIsActive(true);
    setShowInNavbar(false);
    setCodeError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setActionError("");
    setEditingCouponId(c.id);
    setCode(c.code);
    setDescription(c.description || "");
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMaxDiscount(c.maxDiscount ?? "");
    setMinOrderValue(c.minOrderValue);
    setUsageLimit(c.usageLimit ?? "");
    setValidFrom(c.validFrom ? c.validFrom.slice(0, 16) : new Date().toISOString().slice(0, 16));
    setValidUntil(c.validUntil ? c.validUntil.slice(0, 16) : "");
    setIsActive(c.isActive);
    setShowInNavbar(c.showInNavbar ?? false);
    setCodeError("");
    setIsModalOpen(true);
  };

  const handleCodeChange = (val: string) => {
    // Letters, numbers, - and _ only
    const sanitized = val.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    setCode(sanitized);
    if (val !== sanitized) {
      setCodeError("Letters, numbers, - and _ only.");
    } else {
      setCodeError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingCoupon) return;
    if (!code) {
      setCodeError("Coupon code is required.");
      return;
    }

    const payload = {
      code,
      description,
      discountType,
      discountValue: Number(discountValue) || 0,
      maxDiscount: maxDiscount !== "" ? Number(maxDiscount) : null,
      minOrderValue: Number(minOrderValue) || 0,
      usageLimit: usageLimit !== "" ? Number(usageLimit) : null,
      validFrom: validFrom || new Date().toISOString(),
      validUntil: validUntil ? validUntil : null,
      isActive,
      showInNavbar,
    };

    setActionError("");
    setSavingCoupon(true);
    try {
      if (editingCouponId) await updateCoupon(editingCouponId, payload);
      else await addCoupon(payload);
      setIsModalOpen(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not save coupon.");
    } finally {
      setSavingCoupon(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-ivory-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader title="Coupons & Discount Offers Management" />

        <main className="p-6 sm:p-8 space-y-6">
          {actionError && <p role="alert" className="rounded border border-crimson/30 bg-crimson/5 p-3 text-sm text-crimson">{actionError}</p>}
          {couponsError && <p role="alert" className="rounded border border-crimson/30 bg-crimson/5 p-3 text-sm text-crimson">{couponsError}</p>}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-ivory p-5 border border-ivory-300 shadow-sm">
            <div>
              <h2 className="font-serif text-xl text-ink uppercase flex items-center space-x-2">
                <Ticket className="w-5 h-5 text-crimson" />
                <span suppressHydrationWarning>Store Coupons <span className="font-sans font-bold">({isMounted ? coupons.length : 0})</span></span>
              </h2>
              <p className="text-xs text-ink-muted mt-1">
                Manage promo codes, percentage discounts, fixed amount caps, minimum order rules & expiration dates.
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              disabled={isLoading}
              className="px-6 py-3.5 bg-crimson hover:bg-crimson-800 text-ivory text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Coupon</span>
            </button>
          </div>

          {/* Coupons Listing Table */}
          <div className="bg-ivory border border-ivory-300 overflow-hidden shadow-sm">
            <div className="lg:hidden space-y-3 p-3">
{!isMounted || isLoading ? <p className="p-6 text-center text-ink-muted">Loading coupons…</p> : coupons.length === 0 ? <p className="p-6 text-center text-ink-muted">No coupons yet.</p> : coupons.map(c => <AdminListCard key={c.id} title={c.code} subtitle={c.description || 'Discount offer'} badge={c.isActive ? 'Active' : 'Inactive'}>
<p className="text-sm text-ink-muted">{c.description}</p><div className="grid grid-cols-2 gap-3"><div className="rounded-lg bg-white border border-ivory-300 p-3"><p className="text-xs text-ink-muted">Discount</p><p className="mt-1 font-medium text-crimson">{c.discountType === 'percentage' ? `${c.discountValue}%` : formatPrice(c.discountValue)}</p></div><div className="rounded-lg bg-white border border-ivory-300 p-3"><p className="text-xs text-ink-muted">Minimum order</p><p className="mt-1 font-medium">{formatPrice(c.minOrderValue)}</p></div></div>
<p className="text-xs text-ink-muted">Used {c.timesUsed}{c.usageLimit ? ` / ${c.usageLimit}` : ' · Unlimited'} · Max discount: {c.maxDiscount ? formatPrice(c.maxDiscount) : 'No cap'}</p><p className="text-xs text-ink-muted">Valid until: {c.validUntil ? formatCouponDate(c.validUntil) : 'No expiry'}</p>
<div className="flex justify-between items-center gap-3"><span className="text-xs">Show in header</span><button disabled={busyCouponId === c.id} role="switch" aria-checked={c.showInNavbar || false} aria-label={`Show ${c.code} in header`} onClick={() => changeCoupon(c.id,{showInNavbar:!c.showInNavbar})} className={`rounded-full px-4 py-2 text-xs ${c.showInNavbar ? 'bg-crimson text-ivory' : 'bg-ivory-200 text-ink-muted'}`}>{c.showInNavbar ? 'On' : 'Off'}</button></div>
<div className="flex gap-2"><button onClick={() => handleOpenEdit(c)} className="flex-1 rounded-lg bg-crimson text-ivory py-3 text-xs">Edit coupon</button><button disabled={busyCouponId === c.id} onClick={() => changeCoupon(c.id,{isActive:!c.isActive})} className="border border-ivory-300 rounded-lg px-3 text-xs">{c.isActive ? 'Disable' : 'Enable'}</button><button disabled={busyCouponId === c.id} onClick={() => removeSavedCoupon(c.id)} className="text-crimson px-2 text-xs">Delete</button></div>
</AdminListCard>)}
</div><div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[760px] lg:min-w-0 table-fixed text-left text-xs border-collapse">
                <colgroup>{[13, 18, 9, 8, 9, 7, 14, 7, 7, 8].map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
                <thead>
                  <tr className="bg-ink text-ivory uppercase tracking-[0.05em] text-[9px]">
                    <th className="px-2 py-3 border-b border-gold/40">Coupon Code</th>
                    <th className="px-2 py-3 border-b border-gold/40">Description</th>
                    <th className="px-2 py-3 border-b border-gold/40">Discount</th>
                    <th className="px-2 py-3 border-b border-gold/40">Min Order</th>
                    <th className="px-2 py-3 border-b border-gold/40">Max Discount</th>
                    <th className="px-2 py-3 border-b border-gold/40">Usage</th>
                    <th className="px-2 py-3 border-b border-gold/40">Validity</th>
                    <th className="px-2 py-3 border-b border-gold/40">Top Marquee</th>
                    <th className="px-2 py-3 border-b border-gold/40">Status</th>
                    <th className="px-2 py-3 border-b border-gold/40 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-300">
                  {!isMounted || isLoading ? (
                    <tr>
                      <td data-label="" colSpan={10} className="p-4 sm:p-8 text-center text-ink-muted text-xs font-semibold">
                        Loading Coupons...
                      </td>
                    </tr>
                  ) : coupons.length === 0 ? (
                    <tr>
                      <td data-label="" colSpan={10} className="p-4 sm:p-8 text-center text-ink-muted text-xs">
                        No coupon codes created yet. Click "Add Coupon" above to create one.
                      </td>
                    </tr>
                  ) : (
                    coupons.map((c) => (
                      <tr key={c.id} className="hover:bg-ivory-100/70 transition-colors">
                        <td data-label="Coupon Code" className="px-2 py-3 font-mono font-bold text-crimson text-xs">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="bg-crimson/10 min-w-0 truncate px-1.5 py-1 border border-crimson/30 rounded inline-block">
                              {c.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(c.code)}
                              className="p-1.5 text-ink-muted hover:text-crimson hover:bg-ivory-200 border border-ivory-300 rounded transition-all cursor-pointer flex items-center space-x-1"
                              aria-label={`Copy ${c.code}`} title="Copy Coupon Code"
                            >
                              {copiedCode === c.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 animate-fadeIn" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-ink-muted hover:text-ink" />
                              )}
                            </button>
                            {copiedCode === c.code && (
                              <span className="text-[10px] text-emerald-700 font-sans font-extrabold uppercase tracking-wider animate-fadeIn">
                                Copied!
                              </span>
                            )}
                          </div>
                        </td>
                        <td data-label="Description" className="px-2 py-3 text-ink font-medium">
                          <span className="block truncate" title={c.description || undefined}>{c.description || "—"}</span>
                        </td>
                        <td data-label="Discount" className="px-2 py-3 font-semibold text-ink">
                          {c.discountType === "percentage" ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                              {c.discountValue}% OFF
                            </span>
                          ) : (
                            <span className="text-amber-800 bg-amber-50 px-2 py-0.5 border border-amber-200">
                              {formatPrice(c.discountValue)} OFF
                            </span>
                          )}
                        </td>
                        <td data-label="Min Order" className="px-2 py-3 text-ink-muted font-mono">
                          {c.minOrderValue > 0 ? formatPrice(c.minOrderValue) : "₹0 (No min)"}
                        </td>
                        <td data-label="Max Discount" className="px-2 py-3 text-ink-muted font-mono">
                          {c.maxDiscount ? formatPrice(c.maxDiscount) : "No Cap"}
                        </td>
                        <td data-label="Usage" className="px-2 py-3 text-ink">
                          <span className="font-semibold">{c.timesUsed}</span>
                          <span className="text-ink-muted text-[10px]">
                            {c.usageLimit ? ` / ${c.usageLimit}` : " (Unlimited)"}
                          </span>
                        </td>
                        <td data-label="Validity" className="px-2 py-3 text-[10px] text-ink-muted space-y-0.5" suppressHydrationWarning>
                          <div>From: <span className="font-mono text-ink" suppressHydrationWarning>{c.validFrom ? formatCouponDate(c.validFrom) : "Now"}</span></div>
                          <div>Until: <span className="font-mono text-ink" suppressHydrationWarning>{c.validUntil ? formatCouponDate(c.validUntil) : "Never"}</span></div>
                        </td>
                        <td data-label="Top Marquee" className="px-2 py-3">
                          <button
                            type="button"
                            disabled={busyCouponId === c.id}
                            onClick={() => changeCoupon(c.id, { showInNavbar: !c.showInNavbar })}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              c.showInNavbar
                                ? "bg-amber-100 text-amber-900 border border-amber-400 font-extrabold shadow-sm"
                                : "bg-ivory-200 text-ink-muted border border-ivory-300 opacity-70 hover:opacity-100"
                            }`}
                            role="switch" aria-checked={c.showInNavbar ?? false} aria-label={`Show ${c.code} in header`}
                            title="Turn header offer on or off"
                          >
                            <span>{c.showInNavbar ? "On" : "Off"}</span>
                          </button>
                        </td>
                        <td data-label="Status" className="px-2 py-3">
                          <button
                            disabled={busyCouponId === c.id}
                            onClick={() => changeCoupon(c.id, { isActive: !c.isActive })}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              c.isActive
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-rose-100 text-rose-800 border border-rose-300"
                            }`}
                          >
                            {c.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td data-label="Actions" className="px-2 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 bg-ink text-ivory hover:bg-gold hover:text-ink transition-colors inline-block cursor-pointer"
                            title="Edit Coupon"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={busyCouponId === c.id}
                            onClick={() => removeSavedCoupon(c.id)}
                            className="p-1.5 text-crimson hover:bg-crimson hover:text-ivory border border-crimson/30 transition-colors inline-block cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* SLEEK WIDESCREEN RECTANGULAR COUPON CONFIGURATOR MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-ivory border-2 border-gold shadow-2xl rounded-none my-auto overflow-hidden animate-fadeIn">
            {/* Rectangular Header */}
            <div className="bg-ink text-ivory px-6 py-4 flex items-center justify-between border-b-2 border-gold">
              <div>
                <span className="text-[10px] text-gold uppercase tracking-[0.3em] font-semibold block">
                  COUPON CONFIGURATOR
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-ivory uppercase">
                  {editingCouponId ? `Edit Coupon Code: ${code}` : "Add New Coupon Code"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-none bg-ivory/10 hover:bg-crimson text-ivory transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {actionError && <p role="alert" className="rounded border border-crimson/30 bg-crimson/5 p-3 text-sm text-crimson">{actionError}</p>}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Controls Column (7 Columns) */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* COUPON CODE */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-ink mb-1">
                        COUPON CODE *
                      </label>
                      <input
                        type="text"
                        required
                        value={code}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="e.g. SAVE20"
                        className="w-full border border-ivory-300 bg-white p-3 font-mono font-bold text-sm text-crimson uppercase tracking-widest focus:border-gold outline-none shadow-inner"
                      />
                      <p className="text-[10px] text-ink-muted mt-1">Letters, numbers, - and _ only.</p>
                      {codeError && <p className="text-[10px] text-crimson font-semibold mt-1">{codeError}</p>}
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-ink mb-1">
                        DESCRIPTION / INTERNAL NOTE
                      </label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Internal note — e.g. Diwali sale"
                        className="w-full border border-ivory-300 bg-white p-3 text-xs text-ink focus:border-gold outline-none shadow-inner"
                      />
                    </div>

                    {/* DISCOUNT TYPE */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-ink mb-1">
                        DISCOUNT TYPE
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setDiscountType("percentage")}
                          className={`py-2.5 px-4 border text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                            discountType === "percentage"
                              ? "bg-crimson text-ivory border-crimson shadow-md"
                              : "bg-white text-ink border-ivory-300 hover:border-ink"
                          }`}
                        >
                      
                          <span>Percentage (%)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType("fixed")}
                          className={`py-2.5 px-4 border text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                            discountType === "fixed"
                              ? "bg-crimson text-ivory border-crimson shadow-md"
                              : "bg-white text-ink border-ivory-300 hover:border-ink"
                          }`}
                        >
                          
                          <span>Fixed Amount (₹)</span>
                        </button>
                      </div>
                    </div>

                    {/* PERCENT OFF / DISCOUNT VALUE */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-ink mb-1">
                        {discountType === "percentage" ? "PERCENT OFF (%)" : "DISCOUNT AMOUNT (₹)"} *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder={discountType === "percentage" ? "20" : "500"}
                        className="w-full border border-ivory-300 bg-white p-3 text-xs font-bold text-ink focus:border-gold outline-none shadow-inner"
                      />
                    </div>

                    {/* MAX DISCOUNT (₹) & MIN ORDER VALUE (₹) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink mb-1">
                          MAX DISCOUNT (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={maxDiscount}
                          onChange={(e) => setMaxDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="Optional cap"
                          className="w-full border border-ivory-300 bg-white p-3 text-xs text-ink focus:border-gold outline-none shadow-inner"
                        />
                        <p className="text-[10px] text-ink-muted mt-1">Optional cap</p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink mb-1">
                          MIN ORDER VALUE (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={minOrderValue}
                          onChange={(e) => setMinOrderValue(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="0"
                          className="w-full border border-ivory-300 bg-white p-3 text-xs text-ink focus:border-gold outline-none shadow-inner"
                        />
                      </div>
                    </div>

                    {/* USAGE LIMIT */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-ink mb-1">
                        USAGE LIMIT
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={usageLimit}
                        onChange={(e) => setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Blank = unlimited"
                        className="w-full border border-ivory-300 bg-white p-3 text-xs text-ink focus:border-gold outline-none shadow-inner"
                      />
                      <p className="text-[10px] text-ink-muted mt-1">Blank = unlimited</p>
                    </div>

                    {/* VALID FROM & VALID UNTIL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink mb-1">
                          VALID FROM
                        </label>
                        <input
                          type="datetime-local"
                          value={validFrom}
                          onChange={(e) => setValidFrom(e.target.value)}
                          className="w-full border border-ivory-300 bg-white p-2.5 text-xs text-ink focus:border-gold outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink mb-1">
                          VALID UNTIL
                        </label>
                        <input
                          type="datetime-local"
                          value={validUntil}
                          onChange={(e) => setValidUntil(e.target.value)}
                          className="w-full border border-ivory-300 bg-white p-2.5 text-xs text-ink focus:border-gold outline-none"
                        />
                        <p className="text-[10px] text-ink-muted mt-1">Blank = never expires.</p>
                      </div>
                    </div>

                    {/* PREFERENCE TOGGLES */}
                    <div className="pt-2 space-y-2 border-t border-ivory-200">
                      <label className="flex items-center space-x-2 cursor-pointer bg-amber-50 p-2.5 border border-amber-300">
                        <input
                          type="checkbox"
                          checked={showInNavbar}
                          onChange={(e) => setShowInNavbar(e.target.checked)}
                          className="w-4 h-4 accent-amber-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                          ★ Show Coupon text in Top Navbar Scrolling Marquee
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="w-4 h-4 accent-crimson cursor-pointer"
                        />
                        <span className="text-xs font-bold uppercase tracking-wider text-ink">
                          Enable & Activate Coupon Code Immediately
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Right Real-time Rectangular Ticket Preview Column (5 Columns) */}
                  <div className="lg:col-span-5 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-ink mb-1">
                        Live Rectangular Coupon Card Preview
                      </label>
                      <div className="relative w-full bg-ink text-ivory border-2 border-gold p-6 shadow-xl space-y-4 rounded-none overflow-hidden">
                        <div className="flex justify-between items-start border-b border-gold/40 pb-3">
                          <div>
                            <span className="text-[9px] text-gold uppercase tracking-[0.24em] font-bold block">
                              STOREFRONT REDEMPTION
                            </span>
                            <span className="font-mono text-xl text-crimson-100 font-extrabold uppercase tracking-widest bg-crimson px-3 py-1 mt-1 inline-block border border-gold/40 shadow">
                              {code || "YOURCODE"}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 bg-gold text-ink text-[9px] font-extrabold uppercase tracking-widest">
                            {discountType === "percentage" ? `${discountValue || 0}% OFF` : `₹${discountValue || 0} OFF`}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <p className="text-ivory-300 italic text-[11px]">
                            "{description || "No internal description entered"}"
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-ivory-400 pt-2 border-t border-ivory/10">
                            <div>
                              Min Order: <span className="text-gold font-bold">{minOrderValue ? `₹${minOrderValue}` : "₹0"}</span>
                            </div>
                            <div>
                              Max Cap: <span className="text-gold font-bold">{maxDiscount ? `₹${maxDiscount}` : "Unlimited"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Top Marquee Preview Banner */}
                        <div className="pt-3 border-t border-gold/40 flex items-center justify-between text-[10px]">
                          <span className="text-ivory-400 font-semibold">Marquee Display:</span>
                          {showInNavbar ? (
                            <span className="px-2 py-0.5 bg-amber-500 text-ink font-bold text-[9px] uppercase tracking-wider flex items-center space-x-1">
                              <Sparkles className="w-3 h-3" />
                              <span>Active in Navbar</span>
                            </span>
                          ) : (
                            <span className="text-ivory-500 text-[9px] uppercase font-semibold">
                              Hidden from Navbar
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-ivory-200 p-4 border border-ivory-300 space-y-2 text-[11px] text-ink-muted">
                      <div className="flex items-center space-x-1.5 font-bold text-ink">
                        <ShieldCheck className="w-4 h-4 text-gold" />
                        <span>Validation Checklist</span>
                      </div>
                      <ul className="space-y-1 list-disc list-inside text-[10px]">
                        <li>Code enforces UPPERCASE formatted strings.</li>
                        <li>Discount applies automatically during cart checkout.</li>
                        <li>Marquee items cycle continuously across the top bar.</li>
                      </ul>
                    </div>
                  </div>

                </div>

                {/* Bottom Action Row */}
                <div className="pt-4 border-t border-ivory-300 flex items-center justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 border border-ink text-ink hover:bg-ink hover:text-ivory text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCoupon}
                    className="px-8 py-3 bg-crimson hover:bg-crimson-800 text-ivory text-xs uppercase tracking-[0.2em] font-semibold shadow-lg transition-colors cursor-pointer"
                  >
                    <span>{savingCoupon ? "Saving…" : editingCouponId ? "Save Coupon Changes" : "SAVE COUPON"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

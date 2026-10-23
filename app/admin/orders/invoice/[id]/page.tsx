"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/utils";
import { isSupabaseConfigured, mapDbOrderToOrder } from "@/lib/supabase";
import type { Order } from "@/lib/mockData";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Printer, Shield, Mail, Phone, MapPin } from "lucide-react";

function numberToWords(num: number): string {
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? "and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + (n % 1000 !== 0 ? inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + (n % 100000 !== 0 ? inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + "Crore " + (n % 10000000 !== 0 ? inWords(n % 10000000) : "");
  }

  const rounded = Math.round(num);
  if (rounded === 0) return "Zero Rupees Only";
  return "Rupees " + inWords(rounded).trim() + " Only";
}

export default function AdminOrderInvoicePage() {
  const params = useParams();
  const { orders } = useStore();
  const [isMounted, setIsMounted] = useState(false);
  const [savedOrder, setSavedOrder] = useState<Order | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [paperSize, setPaperSize] = useState<"4x6" | "a4">("4x6");
  const orderId = params?.id as string;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      cancelled = true;
      controller.abort();
      setLoadError("Loading took too long. Please retry to load your invoice.");
      setLoadingInvoice(false);
    }, 12000);
    setSavedOrder(null);
    setLoadError("");
    setLoadingInvoice(true);
    async function loadInvoice() {
      try {
        if (!isSupabaseConfigured || !orderId) return;
        const response = await fetch('/api/admin/orders/' + encodeURIComponent(orderId), { signal: controller.signal, cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load invoice.");
        const data = result.order;
        if (!cancelled && data) setSavedOrder(mapDbOrderToOrder(data));
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Could not load this invoice. Please retry.");
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoadingInvoice(false);
      }
    }
    void loadInvoice();
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [orderId, retry]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const order = savedOrder || orders.find((o) => o.id === orderId || o.orderNumber === orderId);

  const handlePrintOrDownload = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (!isMounted || (!order && loadingInvoice)) {
    return (
      <div className="min-h-screen bg-[#FBF8F3] flex items-center justify-center p-8">
        <p className="text-sm font-semibold text-ink-muted">Loading invoice…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FBF8F3] flex flex-col items-center justify-center p-8 space-y-4">
        <h2 className="font-serif text-2xl text-ink uppercase">{loadError ? "Invoice unavailable" : "Order Invoice Not Found"}</h2>
        <p className="text-xs text-ink-muted" role={loadError ? "alert" : undefined}>{loadError || `No matching order record found for ID #${orderId}.`}</p>
        {loadError && <button type="button" onClick={() => setRetry(value => value + 1)} className="px-6 py-2.5 border border-gold text-xs font-semibold">Retry loading invoice</button>}
        <Link
          href="/admin/orders"
          className="px-6 py-2.5 bg-crimson text-ivory text-xs uppercase tracking-wider font-semibold"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF8F3] p-3 sm:p-6 md:p-10 print:p-0 print:bg-white print:min-h-0">
      {/* Dynamic Print Styles for 4x6 (101x152mm) vs A4 */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${paperSize === "4x6" ? "101mm 152mm" : "A4 portrait"};
            margin: ${paperSize === "4x6" ? "3mm" : "8mm"};
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Top Action Header Bar (Hidden in Print View) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <Link
          href="/admin/orders"
          className="flex items-center space-x-2 text-xs uppercase tracking-wider font-bold text-ink hover:text-crimson transition-colors bg-ivory px-4 py-2 border border-ivory-300 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-gold" />
          <span>Back to Orders List</span>
        </Link>

        {/* Paper Size Format Selector (4x6 Thermal vs A4) */}
        <div className="flex items-center bg-ivory p-1 border border-ivory-300 shadow-sm rounded-none">
          <button
            type="button"
            onClick={() => setPaperSize("4x6")}
            className={`px-3 py-1.5 text-xs uppercase font-bold tracking-wider transition-all cursor-pointer ${
              paperSize === "4x6"
                ? "bg-[#2B0B14] text-[#E5C378] border border-gold shadow-sm"
                : "text-ink hover:text-crimson"
            }`}
          >
            4&quot; × 6&quot; Thermal (101×152mm)
          </button>
          <button
            type="button"
            onClick={() => setPaperSize("a4")}
            className={`px-3 py-1.5 text-xs uppercase font-bold tracking-wider transition-all cursor-pointer ${
              paperSize === "a4"
                ? "bg-[#2B0B14] text-[#E5C378] border border-gold shadow-sm"
                : "text-ink hover:text-crimson"
            }`}
          >
            A4 Standard Sheet
          </button>
        </div>

        <button
          type="button"
          onClick={handlePrintOrDownload}
          className="w-full sm:w-auto px-6 py-2.5 bg-gold hover:bg-amber-600 text-ink text-xs uppercase tracking-[0.16em] font-extrabold flex items-center justify-center space-x-2 border-2 border-gold shadow-lg transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4 text-ink" />
          <span>{paperSize === "4x6" ? "Print 4×6 Thermal Label" : "Print A4 Invoice"}</span>
        </button>
      </div>

      {/* =========================================================================
          VIEW A: 4" × 6" THERMAL INVOICE LABEL (101mm × 152mm)
          ========================================================================= */}
      {paperSize === "4x6" ? (
        <div className="w-full max-w-[420px] mx-auto bg-white border-2 border-black p-3 space-y-2 text-black font-sans shadow-xl print:border-2 print:border-black print:p-2 print:w-[95mm] print:max-w-[95mm] print:shadow-none print:m-0">
          
          {/* 1. Thermal Header (Brand + Invoice Number) */}
          <div className="border-b-2 border-black pb-2 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="relative w-10 h-10 rounded-full border border-black overflow-hidden flex-shrink-0 bg-white">
                <Image
                  src="/icon.webp"
                  alt="Kaavu Styles Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <h1 className="font-serif font-black text-lg tracking-wider uppercase leading-tight text-black">
                  Kaavu Styles
                </h1>
                <p className="text-[9px] font-bold uppercase tracking-widest text-black">
                  For Every Version Of You
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-black text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                Retail Invoice
              </span>
              <p className="font-bold text-xs pt-0.5 text-black">
                INV-{order.orderNumber}
              </p>
              <p className="text-[9px] text-gray-700">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "—"}
              </p>
            </div>
          </div>

          {/* 2. Customer & Delivery Address Box */}
          <div className="border border-black p-2 bg-gray-50 print:bg-white text-[11px] leading-tight space-y-1">
            <div className="flex justify-between items-start border-b border-black/30 pb-1">
              <div>
                <span className="text-[8.5px] uppercase font-bold tracking-wider text-gray-700 block">Deliver To / Consignee:</span>
                <span className="font-bold text-xs text-black block">{order.customerName}</span>
              </div>
              <div className="text-right">
                <span className="text-[8.5px] uppercase font-bold tracking-wider text-gray-700 block">Phone:</span>
                <span className="font-bold text-[10px] text-black block">{order.customerPhone}</span>
              </div>
            </div>
            <p className="text-[10px] text-black pt-0.5">
              <span className="font-bold">Address:</span> {order.shippingAddress}, {order.city} - {order.postalCode}
            </p>
            <div className="flex justify-between items-center pt-1 border-t border-black/30 text-[9px] text-gray-800">
              <span className="truncate max-w-[200px]">{order.customerEmail}</span>
            </div>
          </div>

          {/* 3. Itemized Products Table (Compact for Thermal Output) */}
          <div className="border border-black overflow-hidden">
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="bg-black text-white uppercase text-[8.5px] font-bold tracking-wider">
                  <th className="py-1 px-1 border-r border-gray-600 text-center w-5">#</th>
                  <th className="py-1 px-1.5 border-r border-gray-600">Item Description</th>
                  <th className="py-1 px-1 border-r border-gray-600 text-center w-14">Variant</th>
                  <th className="py-1 px-1 border-r border-gray-600 text-center w-7">Qty</th>
                  <th className="py-1 px-1.5 text-right w-16">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/30 font-sans">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="leading-tight">
                    <td className="py-1 px-1 border-r border-black/30 text-center font-bold text-black">{idx + 1}</td>
                    <td className="py-1 px-1.5 border-r border-black/30 font-bold text-black truncate max-w-[130px]">
                      {item.name}
                    </td>
                    <td className="py-1 px-1 border-r border-black/30 text-center text-[9px] text-black">
                      {item.size || "S"} / {item.color || "Std"}
                    </td>
                    <td className="py-1 px-1 border-r border-black/30 text-center font-bold text-black">{item.quantity}</td>
                    <td className="py-1 px-1.5 text-right font-black text-black">{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. Total & Payment Information */}
          <div className="border border-black p-2 bg-gray-50 print:bg-white text-[11px] space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-extrabold uppercase tracking-wider text-xs text-black">Total Paid Amount:</span>
              <span className="font-black text-base text-black">{formatPrice(order.totalAmount)}</span>
            </div>
            <p className="text-[9px] italic text-gray-800">
              Amount in Words: {numberToWords(order.totalAmount)}
            </p>
            <div className="flex justify-between items-center pt-1 border-t border-black/30 text-[9.5px]">
              <div>
                <span className="text-gray-700">Payment: </span>
                <span className="font-black uppercase text-black">
                  {(order.paymentStatus === "Paid" || (!order.paymentStatus && (order.razorpayPaymentId || order.paymentId))) ? "PAID" : order.paymentStatus || "PENDING"}
                </span>
              </div>
              <div className="font-mono text-[9px] text-gray-900 truncate max-w-[170px]">
                Ref: {order.razorpayPaymentId || order.paymentId || "Prepaid Online"}
              </div>
            </div>
          </div>

          {/* 5. Return Policy & Thermal Order Barcode / Footer */}
          <div className="border border-black p-2 text-[9px] text-black space-y-1 leading-snug">
            <div className="flex justify-between items-center border-b border-black/30 pb-1">
              <div>
                <p className="font-black uppercase tracking-wider text-[9px]">Strict No Return & Replacement Policy</p>
                <p className="text-[8px] text-gray-700">Artisanal garments are final sale. Professional dry clean only.</p>
              </div>
              <div className="text-right font-mono font-bold text-[10px] tracking-widest border border-black px-1.5 py-0.5 bg-white">
                *{order.orderNumber}*
              </div>
            </div>
            <div className="flex justify-between items-center pt-0.5 text-[8.5px] text-gray-700">
              <span>kaavustyles@gmail.com</span>
              <span className="font-bold uppercase text-black">Kaavu Styles • Bengaluru, India</span>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW B: STANDARD A4 LUXURY SHEET INVOICE
            ========================================================================= */
        <div className="max-w-4xl mx-auto bg-white border-2 border-gold shadow-2xl p-6 sm:p-10 space-y-6 text-black font-sans print:border-2 print:border-black print:p-6 print:w-full print:max-w-none print:shadow-none">
          
          {/* Brand Invoice Top Header Box */}
          <div className="border-b-2 border-gold pb-6 print:border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-gold shadow-md bg-ivory flex-shrink-0 print:border-black">
                <Image
                  src="/icon.webp"
                  alt="Kaavu Styles Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="space-y-0.5">
                <h1 className="font-serif text-2xl sm:text-3xl font-extrabold uppercase tracking-[0.12em] text-ink print:text-black">
                  Kaavu Styles
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold print:text-black">
                  For Every Version Of You
                </p>
                <p className="text-[11px] text-gray-700 font-sans pt-0.5">
                  Luxury Ethnic Wear & Couture Studio
                </p>
              </div>
            </div>

            <div className="text-right space-y-1 w-full sm:w-auto bg-[#FAF5EC] p-3.5 border border-gold/40 print:bg-gray-100 print:border-black">
              <div className="inline-block bg-[#2B0B14] text-gold px-3 py-1 font-bold text-xs uppercase tracking-widest border border-gold/40 print:bg-black print:text-white print:border-black">
                RETAIL INVOICE
              </div>
              <p className="font-sans text-sm font-extrabold text-crimson print:text-black pt-1">
                Invoice #: <span>INV-{order.orderNumber}</span>
              </p>
              <p className="text-[11px] font-sans text-gray-800">
                Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "—"}
              </p>
            </div>
          </div>

          {/* Customer & Shipping Information Equal Width Box Grid */}
          <div className="border-2 border-gold grid grid-cols-1 sm:grid-cols-2 text-xs divide-y sm:divide-y-0 sm:divide-x-2 divide-gold print:border-black print:divide-black">
            <div className="p-4 space-y-1.5 bg-[#FAF8F5] print:bg-white">
              <p className="font-extrabold uppercase text-[10px] tracking-wider text-crimson print:text-black border-b border-gold/40 pb-1 print:border-black flex items-center space-x-1">
                <span>Billed To (Buyer Information)</span>
              </p>
              <p className="font-serif font-bold text-sm text-ink print:text-black pt-1">{order.customerName}</p>
              <p className="text-gray-800 font-sans text-[11px] flex items-center">
                <Mail className="w-3.5 h-3.5 text-gold mr-1.5 flex-shrink-0 print:hidden" />
                <span>{order.customerEmail}</span>
              </p>
              <p className="text-gray-800 font-sans text-[11px] flex items-center">
                <Phone className="w-3.5 h-3.5 text-gold mr-1.5 flex-shrink-0 print:hidden" />
                <span>Phone: {order.customerPhone}</span>
              </p>
            </div>

            <div className="p-4 space-y-1.5 bg-[#FAF8F5] print:bg-white">
              <p className="font-extrabold uppercase text-[10px] tracking-wider text-crimson print:text-black border-b border-gold/40 pb-1 print:border-black flex items-center space-x-1">
                <span>Shipped To (Consignee Destination)</span>
              </p>
              <p className="font-serif font-bold text-sm text-ink print:text-black pt-1">{order.customerName}</p>
              <p className="text-gray-800 text-[11px] flex items-start">
                <MapPin className="w-3.5 h-3.5 text-gold mr-1.5 flex-shrink-0 mt-0.5 print:hidden" />
                <span>{order.shippingAddress}, {order.city} - {order.postalCode}</span>
              </p>
              <p className="text-gray-800 font-sans text-[10px] pt-0.5">
                Fulfillment Status: <span className="font-bold text-crimson print:text-black uppercase">{order.status}</span>
              </p>
              <div className="pt-2 border-t border-gold/40 print:border-black text-[10px]">
                <p className="text-gray-800">
                  <span className="font-semibold text-gray-700">Payment: </span>
                  <span className="font-bold text-emerald-800 print:text-black uppercase mr-2">
                    {(order.paymentStatus === "Paid" || (!order.paymentStatus && (order.razorpayPaymentId || order.paymentId))) ? "PAID" : order.paymentStatus || "PENDING"}
                  </span>
                  <span className="font-sans text-gray-900 font-semibold">{order.razorpayPaymentId || order.paymentId || "—"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Itemized Invoice Table Box */}
          <div className="border-2 border-gold print:border-black overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-gold bg-[#2B0B14] text-gold uppercase text-[10px] font-extrabold tracking-wider print:bg-black print:text-white print:border-black">
                  <th className="p-3 border-r border-gold/40 print:border-gray-500 w-10 text-center">S.No</th>
                  <th className="p-3 border-r border-gold/40 print:border-gray-500">Item Description</th>
                  <th className="p-3 border-r border-gold/40 print:border-gray-500 w-28">Variant</th>
                  <th className="p-3 border-r border-gold/40 print:border-gray-500 w-12 text-center">Qty</th>
                  <th className="p-3 border-r border-gold/40 print:border-gray-500 w-20 text-right">Rate (₹)</th>
                  <th className="p-3 text-right w-24">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/30 print:divide-black font-sans">
                {order.items.map((item, idx) => {
                  const lineTotal = item.price * item.quantity;

                  return (
                    <tr key={idx} className="text-[11px] hover:bg-[#FAF8F5]">
                      <td className="p-3 border-r border-gold/30 print:border-black text-center font-sans font-bold">{idx + 1}</td>
                      <td className="p-3 border-r border-gold/30 print:border-black font-serif font-bold text-ink print:text-black">
                        {item.name}
                      </td>
                      <td className="p-3 border-r border-gold/30 print:border-black text-gray-800 text-[10px]">
                        Size: <span className="font-semibold text-black">{item.size || "S"}</span> • Color: <span className="font-semibold text-black">{item.color || "Std"}</span>
                      </td>
                      <td className="p-3 border-r border-gold/30 print:border-black text-center font-sans font-bold">{item.quantity}</td>
                      <td className="p-3 border-r border-gold/30 print:border-black text-right font-sans font-semibold">{formatPrice(item.price)}</td>
                      <td className="p-3 text-right font-sans font-extrabold text-crimson print:text-black">
                        {formatPrice(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Order Total & Amount in Words Box */}
          <div className="border-2 border-gold grid grid-cols-1 sm:grid-cols-2 text-xs divide-y sm:divide-y-0 sm:divide-x-2 divide-gold print:border-black print:divide-black">
            <div className="p-5 space-y-3 bg-[#FAF8F5] print:bg-white">
              <div>
                <p className="font-extrabold uppercase text-[10px] tracking-wider text-crimson print:text-black border-b border-gold/30 pb-1 print:border-black">
                  Amount in Words:
                </p>
                <p className="font-serif font-bold text-sm italic text-ink print:text-black pt-1">
                  {numberToWords(order.totalAmount)}
                </p>
              </div>
              <div className="pt-2 border-t border-gold/30 text-[10px] text-gray-700 space-y-0.5 print:border-gray-400">
                <p className="font-bold text-ink print:text-black uppercase flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5 text-gold inline mr-1 print:hidden" />
                  <span>Kaavu Styles Handcrafted Quality Assurance</span>
                </p>
                <p>Each luxury garment is handcrafted and undergoes a 100% quality inspection prior to shipment.</p>
              </div>
            </div>

            <div className="p-5 space-y-2 bg-white">
              <div className="flex justify-between text-sm font-extrabold text-ink pt-1 print:text-black">
                <span>TOTAL:</span>
                <span className="font-sans text-xl font-bold text-crimson print:text-black">{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="pt-2 border-t border-gold/30 print:border-black space-y-1 font-sans text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment:</span>
                  <span className="font-bold text-emerald-800 uppercase">
                    {(order.paymentStatus === "Paid" || (!order.paymentStatus && (order.razorpayPaymentId || order.paymentId))) ? "PAID" : order.paymentStatus || "PENDING"}
                  </span>
                </div>
                <div className="flex justify-between items-center font-sans text-[10px]">
                  <span className="text-gray-600 font-sans">Payment ID:</span>
                  <span className="font-bold text-black">{order.razorpayPaymentId || order.paymentId || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms, Guarantee & Authorized Signatory Box */}
          <div className="p-4 border-2 border-gold grid grid-cols-1 sm:grid-cols-3 text-[10px] text-gray-800 gap-4 print:border-black">
            <div className="sm:col-span-2 space-y-1.5">
              <p className="font-extrabold uppercase text-ink print:text-black tracking-wider text-[11px] border-b border-gold/40 pb-1 print:border-black">
                Terms & Conditions (Official Store Policy):
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[10px] text-gray-700 leading-relaxed font-sans">
                <li>
                  <strong className="text-ink print:text-black font-sans">Strict No Return & No Replacement Policy:</strong> All sales are strictly final. In accordance with luxury couture standards, handcrafted garments, designer kurtis, and bespoke sets cannot be returned, exchanged for alternate sizes/colors, or refunded under any circumstances.
                </li>
                <li>
                  <strong className="text-ink print:text-black font-sans">Non-Cancellable Orders & Immediate Processing:</strong> Orders cannot be cancelled or modified once placed. Shipping address adjustments must be submitted within 3 hours via <span className="text-crimson font-medium">kaavustyles@gmail.com</span> prior to courier dispatch.
                </li>
                <li>
                  <strong className="text-ink print:text-black font-sans">Artisan Craftsmanship Care & Jurisdiction:</strong> Professional dry clean only. Natural variations in artisanal weaving and embroidery are intrinsic hallmarks of craftsmanship, not defects. All transactions subject to Bengaluru jurisdiction only.
                </li>
              </ol>
            </div>

            <div className="text-right flex flex-col justify-between items-end space-y-4 pt-1 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:border-gold/40 sm:pl-4 print:border-black">
              <div>
                <p className="font-bold text-ink uppercase text-[11px] print:text-black">For Kaavu Styles</p>
                <p className="text-[9px] text-gray-500 font-sans">Retail Atelier Unit</p>
              </div>
              <div className="pt-6 border-t-2 border-gold w-40 text-center font-sans font-bold text-[10px] uppercase text-black print:border-black">
                Authorised Signatory
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

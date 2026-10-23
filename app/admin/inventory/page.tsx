"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { useStore } from "@/context/StoreContext";
import VariantStockFields from "@/components/VariantStockFields";
import { productCardUrl } from "@/lib/productImages";
import { variantInventory } from "@/lib/inventory";
import type { Product } from "@/lib/mockData";

function InventoryRow({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<Product["variantStock"] | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const quantities = draft || product.variantStock || {};
  const sizeNames = product.sizes.length ? product.sizes : ["Standard"];
  async function save() {
    setSaving(true); setMessage("");
    const totals = variantInventory(product.sizes, product.colors, quantities);
    try { await updateProduct(product.id, totals); setDraft(null); setMessage("Saved"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save stock."); }
    finally { setSaving(false); }
  }
  return <div className="bg-white rounded-xl border border-ivory-300 overflow-hidden shadow-sm">
    <button type="button" aria-expanded={expanded} aria-controls={`inventory-${product.id}`} onClick={() => setExpanded(!expanded)} className="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left hover:bg-ivory-50 transition-colors">
      <div className="relative w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-ivory-200">{product.images[0] && <Image src={productCardUrl(product.images[0])} alt="" fill sizes="48px" className="object-cover" />}</div>
      <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><h2 className="font-medium text-sm sm:text-base line-clamp-2">{product.name}</h2><ChevronDown className={`w-4 h-4 shrink-0 text-gold transition-transform ${expanded ? "rotate-180" : ""}`} /></div><p className="text-xs text-ink-muted mt-1 truncate">{product.category} · {product.sizes.length ? `${product.sizes.length} sizes` : "General stock"}</p></div>
      <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${product.stock === 0 ? "bg-rose-50 text-rose-700" : product.stock <= 5 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>{product.stock} units</span>
    </button>
    {expanded && <div id={`inventory-${product.id}`} className="border-t border-ivory-300 bg-ivory-50/50 p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap justify-between gap-2"><p className="text-[10px] text-ink-muted font-mono break-all">ID: {product.id}</p><Link href={`/admin/products/${product.id}/edit`} className="text-xs text-crimson hover:underline">Edit product details →</Link></div>
      {!product.variantStock && <p className="text-xs text-amber-800">Currently {product.stock} units are shared. Enter the actual quantity for every size and color before saving; unfilled combinations become zero.</p>}
      <VariantStockFields sizes={product.sizes} colors={product.colors} values={quantities} onChange={setDraft} disabled={saving} />
      <div className="flex flex-wrap items-center gap-3"><button disabled={saving || !draft} onClick={save} className="bg-crimson text-ivory rounded-lg px-5 py-2.5 text-xs disabled:opacity-50">{saving ? "Saving…" : "Save stock"}</button>{draft && <button onClick={() => { setDraft(null); setMessage(""); }} className="text-xs px-3 py-2.5">Cancel</button>}{message && <p role="status" className="text-xs text-crimson">{message}</p>}</div>
    </div>}
  </div>;
}
export default function InventoryPage() {
  const { products, isLoading } = useStore();
  const [search, setSearch] = useState("");
  const filtered = products.filter(product => `${product.name} ${product.id}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="flex min-h-screen bg-ivory-100"><AdminSidebar /><div className="flex-1 min-w-0"><AdminHeader title="Inventory" /><main className="p-5 sm:p-8 max-w-6xl mx-auto space-y-5"><h1 className="font-serif text-3xl">Stock by size & color</h1><p className="text-sm text-ink-muted">Review and update quantities. Checkout deducts only the selected size and color.</p><input aria-label="Search inventory" placeholder="Search product name or ID" value={search} onChange={event => setSearch(event.target.value)} className="w-full border border-ivory-300 rounded-lg p-3 bg-white text-sm" />{isLoading ? <p>Loading inventory…</p> : filtered.length ? filtered.map(product => <InventoryRow key={product.id} product={product} />) : <p>No products found.</p>}</main></div></div>;
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Search, X, ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/mockData";
import ProductDetailModal from "@/components/ProductDetailModal";
import { productCardUrl } from "@/lib/productImages";

export default function ProductSearch({ bottomNav = false }: { bottomNav?: boolean }) {
  const { products, lifestyleTags, isLoading } = useStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const normalized = query.trim().toLowerCase().replace(/^#/, "");
  const results = products.filter(product => {
    const matchesQuery = !normalized || product.name.toLowerCase().includes(normalized) || product.lifestyleTags.some(value => value.toLowerCase().includes(normalized));
    return matchesQuery && (!tag || product.lifestyleTags.some(value => value.toLowerCase() === tag.toLowerCase()));
  });

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    input.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.current?.close();
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button type="button" aria-label="Search products" aria-haspopup="dialog" onClick={() => { setQuery(""); setTag(""); setOpen(true); }} className={bottomNav ? "flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-ivory-300 hover:text-gold-light" : "p-2 text-ink hover:text-crimson transition-colors"}>
        <Search className="w-5 h-5" />
        {bottomNav && <span className="text-[9px] uppercase tracking-wider">Search</span>}
      </button>
      <dialog ref={dialog} aria-labelledby={`${id}-title`} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false); } }} className="fixed left-1/2 top-1/2 right-auto bottom-auto -translate-x-1/2 -translate-y-1/2 m-0 w-[calc(100%-2rem)] max-w-3xl max-h-[85dvh] overflow-y-auto bg-ivory text-ink p-0 border border-gold/40 shadow-2xl backdrop:bg-ink/60 backdrop:backdrop-blur-sm">
        <div className="sticky top-0 bg-ivory z-10 p-5 sm:p-7 border-b border-ivory-300">
          <div className="flex items-center justify-between mb-4">
            <h2 id={`${id}-title`} className="font-serif text-2xl sm:text-3xl">Find your next favourite</h2>
            <button type="button" aria-label="Close search" onClick={() => setOpen(false)} className="p-2 hover:bg-ivory-200"><X className="w-5 h-5" /></button>
          </div>
          <label htmlFor={`${id}-query`} className="sr-only">Search by product name or lifestyle tag</label>
          <div className="flex items-center gap-3 border border-gold/50 bg-white px-3">
            <Search className="w-4 h-4 text-gold shrink-0" />
            <input id={`${id}-query`} ref={input} value={query} onChange={event => setQuery(event.target.value)} placeholder="Product name or lifestyle tag…" className="w-full min-w-0 bg-transparent py-3 text-sm outline-none" />
            {query && <button type="button" aria-label="Clear search" onClick={() => { setQuery(""); input.current?.focus(); }} className="p-2"><X className="w-4 h-4" /></button>}
          </div>
          <div className="flex gap-2 overflow-x-auto pt-4 pb-1" aria-label="Filter by lifestyle">
            {["", ...lifestyleTags.map(value => value.name)].map(value => <button type="button" key={value} aria-pressed={tag === value} onClick={() => setTag(value)} className={`shrink-0 border px-3 py-1.5 text-xs ${tag === value ? "bg-crimson border-crimson text-ivory" : "border-ivory-300 hover:border-gold"}`}>{value ? `#${value}` : "All lifestyles"}</button>)}
          </div>
        </div>
        <div className="p-5 sm:p-7">
          <p role="status" className="text-xs text-ink-muted mb-4">{isLoading ? "Loading products…" : `${results.length} product${results.length === 1 ? "" : "s"} found`}</p>
          {!isLoading && results.length === 0 && <p className="py-8 text-center text-sm text-ink-muted">No matches. Try another product name or lifestyle tag.</p>}
          {!isLoading && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{results.map(product => <button key={product.id} type="button" onClick={() => { setOpen(false); setSelected(product); }} className="flex items-center gap-4 p-3 border border-ivory-300 text-left hover:border-gold hover:bg-ivory-200 transition-colors">
            <div className="relative w-16 h-20 shrink-0 bg-ivory-200">{product.images[0] && <Image src={productCardUrl(product.images[0])} alt="" fill sizes="64px" className="object-cover" />}</div>
            <div className="min-w-0 flex-1"><h3 className="font-serif text-lg leading-tight line-clamp-2">{product.name}</h3><p className="text-[10px] text-ink-muted mt-1 line-clamp-1">{product.lifestyleTags.map(value => `#${value}`).join(" · ")}</p><p className="text-sm text-crimson mt-2">{formatPrice(product.price)}</p></div><ArrowRight className="w-4 h-4 shrink-0 text-gold" />
          </button>)}</div>}
        </div>
      </dialog>
      {selected && <ProductDetailModal product={selected} isOpen onClose={() => setSelected(null)} />}
    </>
  );
}

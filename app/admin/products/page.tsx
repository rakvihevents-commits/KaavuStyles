"use client";

import React, { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import AdminListCard from "@/components/AdminListCard";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import { productCardUrl } from "@/lib/productImages";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit, Search, ChevronDown } from "lucide-react";

export default function AdminProductsPage() {
  const router = useRouter();
  const { products, categories, deleteProduct } = useStore();
  const [search, setSearch] = useState("");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedStockFilter, setSelectedStockFilter] = useState("all");
  const [isMounted, setIsMounted] = useState(false);
  
  

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Stock Metrics
  const totalProductsCount = products.length;
  const inStockCount = products.filter((p) => p.stock > 5).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.name + " " + p.id).toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      selectedCategoryFilter === "all" ||
      p.category.toLowerCase() === selectedCategoryFilter.toLowerCase() ||
      p.categoryId === selectedCategoryFilter;
    const matchesStock =
      selectedStockFilter === "all" ||
      (selectedStockFilter === "in_stock" && p.stock > 5) ||
      (selectedStockFilter === "low_stock" && p.stock > 0 && p.stock <= 5) ||
      (selectedStockFilter === "out_of_stock" && p.stock <= 0);

    return matchesSearch && matchesCat && matchesStock;
  });

  return (
    <div className="flex min-h-screen bg-ivory-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader title="Products & Stock Management" />

        <main className="p-4 sm:p-8 space-y-6">
          {/* Stock Metrics Count Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-ivory border border-ivory-300 p-4 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-ink-muted">Total Products</span>
              <p className="font-sans text-2xl font-bold text-ink" suppressHydrationWarning>
                {isMounted ? totalProductsCount : 0}
              </p>
              <span className="text-[9px] text-gold uppercase font-bold">Catalog Total</span>
            </div>
            <div className="bg-emerald-50/50 border border-emerald-200 p-4 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-800">In Stock (&gt;5)</span>
              <p className="font-sans text-2xl font-bold text-emerald-700" suppressHydrationWarning>
                {isMounted ? inStockCount : 0}
              </p>
              <span className="text-[9px] text-emerald-600 uppercase font-bold">Healthy Stock</span>
            </div>
            <div className="bg-amber-50/50 border border-amber-200 p-4 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-amber-800">Low Stock (1-5)</span>
              <p className="font-sans text-2xl font-bold text-amber-700" suppressHydrationWarning>
                {isMounted ? lowStockCount : 0}
              </p>
              <span className="text-[9px] text-amber-600 uppercase font-bold">Needs Reorder</span>
            </div>
            <div className="bg-rose-50/50 border border-rose-200 p-4 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-rose-800">Sold out (0)</span>
              <p className="font-sans text-2xl font-bold text-crimson" suppressHydrationWarning>
                {isMounted ? outOfStockCount : 0}
              </p>
              <span className="text-[9px] text-rose-600 uppercase font-bold">Unavailable</span>
            </div>
          </div>

          {/* Top Bar with Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-ivory p-4 border border-ivory-300">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
              {/* Search input */}
              <div className="relative flex-1 border border-ivory-300 rounded bg-ivory-50 p-2 flex items-center">
                <Search className="w-4 h-4 text-gold mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search products by title or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-ink outline-none"
                />
              </div>

              {/* Category Filter Dropdown */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="border border-ivory-300 rounded bg-ivory p-2.5 text-xs text-ink uppercase tracking-wider outline-none focus:border-gold font-semibold"
              >
                <option value="all">All Categories ({products.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Stock Filter Dropdown */}
              <select
                value={selectedStockFilter}
                onChange={(e) => setSelectedStockFilter(e.target.value)}
                className="border border-ivory-300 rounded bg-ivory p-2.5 text-xs text-ink uppercase tracking-wider outline-none focus:border-gold font-semibold"
              >
                <option value="all">All Stock Statuses ({products.length})</option>
                <option value="in_stock">In Stock ({inStockCount})</option>
                <option value="low_stock">Low Stock ({lowStockCount})</option>
                <option value="out_of_stock">Out of Stock ({outOfStockCount})</option>
              </select>
            </div>

            <button
              onClick={() => router.push("/admin/products/new")}
              className="px-6 py-3 bg-crimson hover:bg-crimson-800 text-ivory text-xs uppercase tracking-[0.2em] font-semibold flex items-center space-x-2 shadow-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-ivory border border-ivory-300 shadow-sm overflow-hidden">
            <div className="p-3 bg-ivory-200/60 border-b border-ivory-300 flex flex-col sm:flex-row gap-3 justify-between sm:items-center text-xs font-semibold text-ink">
              <span>Showing {filteredProducts.length} of {products.length} products</span>
              {(selectedStockFilter !== "all" || selectedCategoryFilter !== "all" || search) && (
                <button
                  onClick={() => {
                    setSelectedStockFilter("all");
                    setSelectedCategoryFilter("all");
                    setSearch("");
                  }}
                  className="text-[10px] text-crimson hover:underline uppercase font-bold"
                >
                  Clear Filters
                </button>
              )}
            </div>
            <div className="lg:hidden space-y-3 p-3">
                  {!isMounted ? <p className="p-6 text-center text-ink-muted">Loading products…</p> : filteredProducts.length === 0 ? <p className="p-6 text-center text-ink-muted">No products match your filters.</p> : filteredProducts.map(p => <AdminListCard key={p.id} title={p.name} subtitle={p.category} badge={`${p.stock} units`} image={<div className="relative w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-ivory-200"><Image src={productCardUrl(p.images[0])} alt="" fill sizes="48px" className="object-cover" /></div>}>
<div className="flex items-center justify-between"><span className="text-ink-muted">Price</span><span className="font-medium text-crimson">{formatPrice(p.price)}</span></div>
<p className="text-[10px] text-ink-muted font-mono break-all">ID: {p.id}</p>
<div><p className="text-xs text-ink-muted mb-2">Stock by size</p><div className="flex flex-wrap gap-2">{p.sizes.length ? p.sizes.map(size => <span key={size} className="bg-white border border-ivory-300 rounded-lg px-3 py-2 text-xs">{size}: {p.sizeStock ? p.sizeStock[size] ?? 0 : "Shared"}</span>) : <span className="text-xs">General stock: {p.stock}</span>}</div></div>
<div><p className="text-xs text-ink-muted mb-2">Colors</p><div className="flex flex-wrap gap-2">{p.colors.map(color => <span key={color} className="text-xs bg-white border border-ivory-300 rounded-lg px-2 py-1">{color}</span>)}</div></div>
<div className="flex gap-2 pt-2"><button onClick={() => router.push(`/admin/products/${p.id}/edit`)} className="flex-1 bg-crimson text-ivory rounded-lg py-3 text-xs">Edit product</button><button onClick={() => deleteProduct(p.id)} className="px-4 border border-crimson/20 text-crimson rounded-lg text-xs">Delete</button></div>
</AdminListCard>)}
</div><div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[760px] table-fixed text-left text-xs">
                <colgroup>{[9, 29, 17, 11, 15, 10, 9].map((width, index) => <col key={index} style={{width: `${width}%`}} />)}</colgroup><thead>
                  <tr className="border-b border-ivory-300 uppercase tracking-wider text-[10px] text-ink-muted bg-ivory-50">
                    <th className="py-4 px-3">Image</th>
                    <th className="py-4 px-3">Product Name</th>
                    <th className="py-4 px-3">Category</th>
                    <th className="py-4 px-3">Price</th>
                    <th className="py-4 px-3">Stock Status</th>
                    <th className="py-4 px-3">Tags</th>
                    <th className="py-4 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200">{filteredProducts.length === 0 && <tr><td data-label="" colSpan={7} className="py-12 text-center text-ink-muted">No products match your filters.</td></tr>}
                  {filteredProducts.map((p) => (
                    <React.Fragment key={p.id}><tr className="hover:bg-ivory-50">
                      <td data-label="Image" className="py-4 px-3">
                        <div className="relative w-12 h-16 bg-ivory-200 border border-ivory-300 overflow-hidden">
                          <Image
                            src={productCardUrl(p.images[0] || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=400")}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </td>
                      <td data-label="Product Name" className="py-4 px-3">
                        <button type="button" aria-expanded={expandedProduct === p.id} onClick={() => setExpandedProduct(expandedProduct === p.id ? null : p.id)} className="flex items-center gap-2 text-sm text-ink font-medium text-left">
                          {p.name}<ChevronDown className={`w-4 h-4 shrink-0 text-gold transition-transform ${expandedProduct === p.id ? "rotate-180" : ""}`} /></button>
                        <span className="text-[10px] text-ink-muted font-sans line-clamp-1">
                          {p.id}
                        </span>
                      </td>
                      <td data-label="Category" className="py-4 px-3 text-ink-muted">
                        <span className="block truncate max-w-full" title={p.category}>
                          {p.category}
                        </span>
                      </td>
                      <td data-label="Price" className="py-4 px-3 font-semibold text-crimson">
                        {formatPrice(p.price)}
                      </td>
                      <td data-label="Stock Status" className="py-4 px-3">
                        {p.stock <= 0 ? (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 text-[10px] rounded-full font-medium whitespace-nowrap">
                            Out of Stock
                          </span>
                        ) : p.stock <= 5 ? (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] rounded font-bold uppercase tracking-wider">
                            Low · {p.stock}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] rounded font-bold uppercase tracking-wider">
                            {p.stock} available
                          </span>
                        )}
                      </td>
                      <td data-label="Tags" className="py-4 px-3">
                        <div className="flex flex-wrap gap-1">
                          {p.lifestyleTags.map((t) => (
                            <span key={t} className="text-[9px] bg-ivory-200 px-1.5 py-0.5 border">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td data-label="Actions" className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => router.push(`/admin/products/${p.id}/edit`)}
                            className="p-1.5 text-ink hover:text-crimson border border-ivory-300 rounded"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="p-1.5 text-crimson hover:bg-crimson/10 border border-crimson/30 rounded"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
{expandedProduct === p.id && <tr className="bg-ivory-50"><td data-label="" colSpan={7} className="px-6 py-5"><div className="flex flex-wrap gap-8"><div><p className="text-[10px] uppercase tracking-wider text-ink-muted mb-2">Stock by size</p><div className="flex flex-wrap gap-2">{p.sizes.length ? p.sizes.map(size => <span key={size} className="bg-white border border-ivory-300 rounded-lg px-3 py-2">{size}: {p.sizeStock ? p.sizeStock[size] ?? 0 : "Shared"}</span>) : <span>{p.stock} units · General stock</span>}</div></div><div><p className="text-[10px] uppercase tracking-wider text-ink-muted mb-2">Color photos</p><div className="flex flex-wrap gap-2">{p.colors.map(color => <span key={color} className="bg-white border border-ivory-300 rounded-lg px-3 py-2">{color} · {p.colorImages?.[color]?.length || 0} photos</span>)}</div></div></div></td></tr>}
</React.Fragment>))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

    </div>
  );
}

"use client";

import React, { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import ImageUploader from "@/components/ImageUploader";
import { useStore } from "@/context/StoreContext";
import { uploadSingleImage } from "@/lib/storageUpload";
import Image from "next/image";
import { Plus, Trash2, X } from "lucide-react";
import { slugify } from "@/lib/utils";

export default function AdminCategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [categoryImages, setCategoryImages] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setError("");
    try {
      const finalImageUrl = categoryImages[0]
        ? await uploadSingleImage(categoryImages[0], "categories")
        : "";

      if (editingId) {
        await updateCategory(editingId, {
          name,
          slug: slugify(name),
          imageUrl: finalImageUrl,
        });
      } else {
        await addCategory({
          name,
          slug: slugify(name),
          imageUrl: finalImageUrl || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800",
        });
      }
      setName("");
      setCategoryImages([]);
      setIsModalOpen(false);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save category."); }
  };

  return (
    <div className="flex min-h-screen bg-ivory-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader title="Category Management" />

        <main className="p-4 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center bg-ivory p-4 border border-ivory-300">
            <div>
              <h2 className="font-serif text-xl text-ink uppercase" suppressHydrationWarning>Active Categories <span className="font-sans font-bold">({categories.length})</span></h2>
              <p className="text-xs text-ink-muted">Manage product categories displayed on storefront</p>
            </div>
            <button
              onClick={() => {
                setEditingId(null); setError("");
                setName("");
                setCategoryImages(["https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800"]);
                setIsModalOpen(true);
              }}
              className="px-6 py-3 bg-crimson hover:bg-crimson-800 text-ivory text-xs uppercase tracking-[0.2em] font-semibold flex items-center space-x-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-ivory border border-ivory-300 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div className="relative h-48 w-full bg-ivory-200">
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 text-ivory">
                    <span className="text-[10px] text-gold uppercase tracking-widest block font-sans">
                      Category Slug: /{cat.slug}
                    </span>
                    <h3 className="font-serif text-2xl uppercase font-light">{cat.name}</h3>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between border-t border-ivory-300 bg-ivory-50">
                  <span className="text-[10px] text-ink-muted font-mono truncate max-w-[100px]">{cat.id}</span><button onClick={() => { setEditingId(cat.id); setName(cat.name); setCategoryImages([cat.imageUrl]); setError(""); setIsModalOpen(true); }} className="text-xs px-3 py-2 bg-crimson text-ivory rounded-lg">Edit</button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="text-xs text-crimson hover:underline flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Category</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-ivory rounded-none border border-gold shadow-2xl p-6 space-y-6 max-h-[90dvh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center border-b border-ivory-300 pb-3">
              <h3 className="font-serif text-2xl text-ink uppercase">{editingId ? "Edit category" : "Add new category"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-ink hover:text-crimson">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">{error && <p role="alert" className="text-crimson">{error}</p>}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Royal Sarees, Designer Kurtis..."
                  className="w-full border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none"
                />
              </div>

              {/* Image File Uploader (Uploads to Supabase Storage images/categories) */}
              <ImageUploader
                images={categoryImages}
                onChange={setCategoryImages}
                single={true}
                label="Category Cover Image File"
                folder="categories"
                imageSlot="category"
                hidePreview
              />

              <button
                type="submit"
                className="w-full py-3.5 bg-crimson text-ivory text-xs uppercase tracking-[0.24em] font-semibold shadow-md mt-2"
              >
                Save Category to Supabase
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

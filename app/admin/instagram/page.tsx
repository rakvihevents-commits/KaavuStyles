"use client";

import React, { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import ImageUploader from "@/components/ImageUploader";
import { useStore } from "@/context/StoreContext";
import { uploadSingleImage } from "@/lib/storageUpload";
import Image from "next/image";
import { Plus, Trash2, Instagram, ExternalLink, X } from "lucide-react";

export default function AdminInstagramPage() {
  const { instagramPosts, addInstagramPost, deleteInstagramPost } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [postUrl, setPostUrl] = useState("https://instagram.com");
  const [igImages, setIgImages] = useState<string[]>([]);
  const [caption, setCaption] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (igImages.length === 0) return;

    try {
      const finalImageUrl = await uploadSingleImage(igImages[0], "instagram");
      await addInstagramPost(postUrl, finalImageUrl, caption);
      setPostUrl("https://instagram.com");
      setIgImages([]);
      setCaption("");
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Failed to upload Instagram image: " + (err?.message || err));
    }
  };

  return (
    <div className="flex min-h-screen bg-ivory-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader title="Instagram Feed & Links Configuration" />

        <main className="p-4 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center bg-ivory p-4 border border-ivory-300">
            <div>
              <h2 className="font-serif text-xl text-ink uppercase">Instagram Posts Feed <span className="font-sans font-bold">({instagramPosts.length})</span></h2>
              <p className="text-xs text-ink-muted">Manage Instagram post URLs, image previews, and captions for homepage feed.</p>
            </div>
            <button
              onClick={() => {
                setPostUrl("https://instagram.com/kaavu_styles");
                setIgImages([]);
                setCaption("");
                setIsModalOpen(true);
              }}
              className="px-6 py-3 bg-crimson hover:bg-crimson-800 text-ivory text-xs uppercase tracking-[0.2em] font-semibold flex items-center space-x-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Instagram Post</span>
            </button>
          </div>

          {instagramPosts.length === 0 ? (
            <div className="bg-ivory border border-ivory-300 p-12 text-center space-y-4">
              <Instagram className="w-12 h-12 text-gold mx-auto opacity-50" />
              <h3 className="font-serif text-lg text-ink uppercase">No Instagram Posts Added</h3>
              <p className="text-xs text-ink-muted max-w-md mx-auto">
                Click the "Add Instagram Post" button above to upload photos and add links to your official @kaavu_styles Instagram posts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {instagramPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-ivory border border-ivory-300 overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full bg-ink">
                    <Image
                      src={post.imageUrl}
                      alt="Instagram Post"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2 p-1.5 bg-ivory/80 rounded-full text-crimson">
                      <Instagram className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-4 space-y-2 text-xs">
                    <p className="text-ink-muted line-clamp-2 text-[11px] font-sans">
                      {post.caption || "No caption provided"}
                    </p>
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] uppercase font-semibold text-gold hover:text-crimson flex items-center space-x-1"
                    >
                      <span>View Post Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-3 bg-ivory-200 border-t border-ivory-300 flex justify-end">
                    <button
                      onClick={() => deleteInstagramPost(post.id)}
                      className="text-xs text-crimson hover:underline flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-ivory rounded-none border border-gold shadow-2xl p-5 sm:p-6 space-y-6 max-h-[90dvh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center border-b border-ivory-300 pb-3">
              <h3 className="font-serif text-2xl text-ink uppercase">Add Instagram Post</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-ink hover:text-crimson">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Instagram Post Link / URL
                </label>
                <input
                  type="text"
                  required
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="https://instagram.com/p/..."
                  className="w-full border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none"
                />
              </div>

              {/* Image File Uploader (Uploads to Supabase Storage images/instagram) */}
              <ImageUploader
                images={igImages}
                onChange={setIgImages}
                single={true}
                label="Instagram Photo File"
                folder="instagram"
                imageSlot="instagram"
              />

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Post Caption & Hashtags
                </label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Timeless Kanjeevaram elegance... #KaavuStyles"
                  className="w-full border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-crimson text-ivory text-xs uppercase tracking-[0.24em] font-semibold shadow-md mt-2"
              >
                Save Instagram Link to Supabase
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

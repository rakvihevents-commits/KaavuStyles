"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { Shield, Lock, Mail, ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(""); setIsSubmitting(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: cleanEmail, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Admin sign-in failed.");
      login(cleanEmail, "admin", "Admin User");
      router.push("/admin/dashboard");
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Admin sign-in failed."); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-ink flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-ivory rounded-none border-2 border-gold shadow-2xl overflow-hidden p-8 space-y-6 animate-fadeIn">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-gold shadow-md bg-white">
            <Image src="/icon.webp" alt="Kaavu Styles" fill className="object-cover" priority />
          </div>
          <h1 className="font-serif text-3xl text-ink uppercase tracking-wider font-normal">
            Kaavu Styles
          </h1>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gold font-sans font-semibold">
            Admin & Seller Portal Login
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-crimson/10 border border-crimson/40 rounded text-xs text-crimson flex items-center space-x-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-crimson" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted mb-1.5">
              Admin Email Address
            </label>
            <div className="flex items-center border border-ivory-300 rounded bg-white p-2.5 focus-within:border-gold transition-colors">
              <Mail className="w-4 h-4 text-gold mr-2.5 flex-shrink-0" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="admin@kaavustyle.com"
                className="w-full bg-transparent text-xs text-ink outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted mb-1.5">
              Admin Security Password
            </label>
            <div className="relative flex items-center border border-ivory-300 rounded bg-white p-2.5 focus-within:border-gold transition-colors">
              <Lock className="w-4 h-4 text-gold mr-2.5 flex-shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="••••••••"
                className="w-full bg-transparent text-xs text-ink outline-none pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 text-ink-muted hover:text-gold p-1 transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-crimson hover:bg-burgundy text-ivory text-xs uppercase tracking-[0.24em] font-semibold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
          >
            <Shield className="w-4 h-4" />
            <span>{isSubmitting ? "Authenticating..." : "Sign In to Admin Portal"}</span>
          </button>
        </form>

        <div className="pt-2 border-t border-ivory-300 text-center">
          <a
            href="/"
            className="inline-flex items-center text-xs text-ink-muted hover:text-crimson transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Back to Customer Storefront</span>
          </a>
        </div>
      </div>
    </div>
  );
}

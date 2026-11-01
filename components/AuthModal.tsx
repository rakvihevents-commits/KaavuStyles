"use client";

import siteIcon from "@/public/icon.webp";
import React, { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { X, Lock, Mail, User as UserIcon, Shield, CheckCircle2, Phone, Sparkles, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function AuthModal({ checkoutNotice = false }: { checkoutNotice?: boolean }) {
  const { isAuthModalOpen, closeAuthModal, login, registerUser } = useStore();
  const [tab, setTab] = useState<"login" | "register">("login");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (tab === "register") {
      setSuccessMsg("Account created successfully! Logging you in...");
      registerUser(name, email, phone);
      setTimeout(() => {
        login(email, "customer", name, phone);
        setSuccessMsg("");
      }, 1000);
    } else {
      login(email, "customer");
    }
  };



  return (
    <div className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-ivory rounded-none border-2 border-gold shadow-2xl overflow-hidden animate-fadeIn my-8 flex flex-col md:flex-row">
        {/* Close Button - Top Right of Modal */}
        <button
          onClick={closeAuthModal}
          className="absolute top-3 right-3 p-2 text-ink hover:text-crimson transition-colors z-20 cursor-pointer bg-ivory/80 rounded-full md:bg-transparent"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Left Landscape Side Banner (#2B0B14 VELVET BURGUNDY) */}
        <div className="w-full md:w-5/12 bg-[#2B0B14] p-6 md:p-8 flex flex-col items-center justify-center text-center relative border-b md:border-b-0 md:border-r border-gold/40 text-white min-h-[300px] md:min-h-full">
          {/* Subtle background glow & radial dot overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#E5C378_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

          <div className="relative z-10 w-full flex flex-col items-center justify-center text-center my-auto space-y-4">
            <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-gold shadow-lg bg-ivory">
              <Image src={siteIcon.src} alt="Kaavu Styless Mark" fill className="object-cover" />
            </div>

            <div className="space-y-1 text-center">
              <h3 className="font-serif text-2xl md:text-3xl text-white uppercase tracking-[0.2em] font-normal text-center">
                Kaavu Styless
              </h3>
              <p className="text-[10px] tracking-[0.28em] text-[#E5C378] uppercase font-sans font-bold text-center">
                For Every Version Of You
              </p>
            </div>

            <div className="w-16 h-[1px] bg-gold/50 mx-auto" />

            <div className="space-y-2.5 text-[11px] text-ivory/90 text-center font-light tracking-wide px-2 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center space-x-2 text-center">
                <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
                <span className="text-center">Handcrafted Royal Sarees & Indo-Western Couture</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-center">
                <Shield className="w-4 h-4 text-gold flex-shrink-0" />
                <span className="text-center">Express Dispatch & Safe Cash-On-Delivery</span>
              </div>
            </div>

            {checkoutNotice && (
              <div className="mt-2 p-2.5 bg-crimson/40 border border-gold/40 text-ivory text-[11px] rounded leading-relaxed text-center w-full">
                ⚠️ Please sign in or register an account to complete your order checkout.
              </div>
            )}
          </div>
        </div>

        {/* Right Form Pane */}
        <div className="w-full md:w-7/12 bg-ivory p-6 md:p-8 flex flex-col justify-between">
          <div>
            {/* Luxury Segment Pill Tab Switcher */}
            <div className="p-1.5 bg-ivory-200 border border-gold/40 rounded-full flex items-center mb-6 shadow-inner">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold uppercase tracking-[0.18em] transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 ${
                  tab === "login"
                    ? "bg-[#2B0B14] text-[#E5C378] shadow-md border border-gold/40"
                    : "text-ink-muted hover:text-ink hover:bg-ivory-300/60"
                }`}
              >
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("register")}
                className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold uppercase tracking-[0.18em] transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 ${
                  tab === "register"
                    ? "bg-[#2B0B14] text-[#E5C378] shadow-md border border-gold/40"
                    : "text-ink-muted hover:text-ink hover:bg-ivory-300/60"
                }`}
              >
                <span>New Account</span>
              </button>
            </div>

            {/* Success Notification */}
            {successMsg && (
              <div className="mb-4 flex items-center space-x-2 text-xs text-emerald-800 bg-emerald-50 p-3 border border-emerald-300 rounded font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === "register" && (
                <>
                  {/* Full Name */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-1">
                      Full Name
                    </label>
                    <div className="relative flex items-center border border-ivory-300 bg-ivory-50 focus-within:border-gold">
                      <UserIcon className="w-4 h-4 text-gold ml-3 flex-shrink-0" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Priya Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2.5 bg-transparent text-xs text-ink outline-none"
                      />
                    </div>
                  </div>

                  {/* Phone Number for Registration */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-1">
                      Phone Number
                    </label>
                    <div className="relative flex items-center border border-ivory-300 bg-ivory-50 focus-within:border-gold">
                      <Phone className="w-4 h-4 text-gold ml-3 flex-shrink-0" />
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full p-2.5 bg-transparent text-xs text-ink outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-1">
                  Email Address
                </label>
                <div className="relative flex items-center border border-ivory-300 bg-ivory-50 focus-within:border-gold">
                  <Mail className="w-4 h-4 text-gold ml-3 flex-shrink-0" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-transparent text-xs text-ink outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-1">
                  Password
                </label>
                <div className="relative flex items-center border border-ivory-300 bg-ivory-50 focus-within:border-gold">
                  <Lock className="w-4 h-4 text-gold ml-3 flex-shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 bg-transparent text-xs text-ink outline-none pr-9"
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
                className="w-full py-3.5 bg-crimson hover:bg-crimson-800 text-ivory font-sans text-xs uppercase tracking-[0.24em] font-bold transition-all shadow-md mt-2 border border-gold/40 cursor-pointer"
              >
                {tab === "login" ? "Sign In to Account" : "Create My Account"}
              </button>
            </form>
          </div>


        </div>
      </div>
    </div>
  );
}

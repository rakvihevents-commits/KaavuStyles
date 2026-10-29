"use client";

import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { useStore } from "@/context/StoreContext";
import {
  ShieldCheck,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
  LogOut,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
  const { currentUser, login, logout } = useStore();
  const router = useRouter();

  // State
  const [currentEmail, setCurrentEmail] = useState("");
  const [activePassword, setActivePassword] = useState("");
  const [showActivePassword, setShowActivePassword] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch current credentials info
  useEffect(() => {
    let isMounted = true;
    async function fetchCredentials() {
      try {
        const res = await fetch("/api/admin/credentials");
        const data = await res.json();
        if (res.ok && isMounted) {
          const emailVal = data.primaryEmail || currentUser?.email || "admin@kaavustyle.com";
          setCurrentEmail(emailVal);
          setNewEmail(emailVal);
          if (data.currentPassword) {
            setActivePassword(data.currentPassword);
          }
        } else if (isMounted) {
          const emailVal = currentUser?.email || "admin@kaavustyle.com";
          setCurrentEmail(emailVal);
          setNewEmail(emailVal);
          setActivePassword("");
        }
      } catch (e) {
        if (isMounted) {
          const emailVal = currentUser?.email || "admin@kaavustyle.com";
          setCurrentEmail(emailVal);
          setNewEmail(emailVal);
          setActivePassword("");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchCredentials();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Validations
    if (!currentPassword) {
      setErrorMessage("Please enter your current admin password to authorize changes.");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    const emailChanged = newEmail.trim().toLowerCase() !== currentEmail.toLowerCase();
    const passwordChanged = Boolean(newPassword.trim());

    if (!emailChanged && !passwordChanged) {
      setErrorMessage("No changes detected. Please specify a new email or new password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newEmail: emailChanged ? newEmail.trim() : undefined,
          newPassword: passwordChanged ? newPassword.trim() : undefined,
          confirmPassword: passwordChanged ? confirmPassword.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update admin credentials.");
      }

      const updatedEmail = data.primaryEmail || (emailChanged ? newEmail.trim().toLowerCase() : currentEmail);
      const updatedPass = data.currentPassword || (passwordChanged ? newPassword.trim() : activePassword);

      setCurrentEmail(updatedEmail);
      setActivePassword(updatedPass);

      setSuccessMessage(
        `Admin credentials successfully updated! ${
          passwordChanged ? "Password updated. " : ""
        }${emailChanged ? `Email updated to ${updatedEmail}.` : ""}`
      );

      // Update local storage and context user if email changed
      if (emailChanged) {
        login(updatedEmail, "admin", "Admin User");
        if (typeof window !== "undefined") {
          try {
            const adminUserObj = { email: updatedEmail, role: "admin", name: "Admin User" };
            localStorage.setItem("ks_admin_user", JSON.stringify(adminUserObj));
            localStorage.setItem("ks_user", JSON.stringify(adminUserObj));
          } catch {}
        }
      }

      // Reset password input fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestSignOut = () => {
    logout();
    if (typeof window !== "undefined") {
      localStorage.removeItem("ks_admin_user");
      try {
        const savedUser = localStorage.getItem("ks_user");
        if (savedUser && JSON.parse(savedUser).role === "admin") {
          localStorage.removeItem("ks_user");
        }
      } catch {}
    }
    router.replace("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-ivory-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader title="Admin Security & Profile" />

        <main className="p-4 sm:p-8 space-y-6 max-w-5xl">
          {/* Top Banner Notice */}
          <div className="bg-[#2B0B14] border-2 border-gold/40 p-6 shadow-xl relative overflow-hidden text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative z-10 space-y-1">
              <div className="flex items-center space-x-2 text-[#E5C378]">
                <ShieldCheck className="w-5 h-5 text-[#E5C378]" />
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold">
                  Security Control Center
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-white uppercase font-light">
                Admin Email & Password Settings
              </h2>
              <p className="text-xs text-ivory-300 max-w-xl">
                Update your administrator login email and security password. Changes reflect immediately across your entire system.
              </p>
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(#E5C378_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
          </div>

          {/* Feedback alerts */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 flex items-center space-x-3 shadow-sm animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div className="font-medium">{successMessage}</div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-crimson/10 border border-crimson/40 rounded text-xs text-crimson flex items-center space-x-3 shadow-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-crimson flex-shrink-0" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column (2 spans) */}
            <div className="lg:col-span-2 bg-ivory border border-ivory-300 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="border-b border-ivory-200 pb-4">
                <h3 className="font-serif text-xl text-ink uppercase">Update Credentials</h3>
                <p className="text-xs text-ink-muted mt-1">
                  Enter your current password to authorize changes to your admin email or password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Email Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gold border-b border-ivory-200 pb-1.5 flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Admin Email Address</span>
                  </h4>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-ink">
                      Login Email Address
                    </label>
                    <div className="flex items-center border border-ivory-300 rounded bg-white p-2.5 focus-within:border-gold transition-colors">
                      <Mail className="w-4 h-4 text-gold mr-2.5 flex-shrink-0" />
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="admin@kaavustyle.com"
                        className="w-full bg-transparent text-xs text-ink outline-none"
                      />
                    </div>
                    {/* DYNAMIC CURRENTLY ACTIVE EMAIL */}
                    <div className="text-[11px] text-ink-muted pt-1 flex items-center space-x-1.5">
                      <span>Currently active email:</span>
                      <strong className="text-ink font-semibold">{currentEmail || "Loading..."}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Password Section */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gold border-b border-ivory-200 pb-1.5 flex items-center space-x-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Change Admin Password</span>
                  </h4>

                  {/* Current Password (Required) */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-ink">
                      Current Admin Password <span className="text-crimson">* (Required)</span>
                    </label>
                    <div className="relative flex items-center border border-ivory-300 rounded bg-white p-2.5 focus-within:border-gold transition-colors">
                      <Lock className="w-4 h-4 text-gold mr-2.5 flex-shrink-0" />
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password to verify identity"
                        className="w-full bg-transparent text-xs text-ink outline-none pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-2.5 text-ink-muted hover:text-gold p-1 transition-colors cursor-pointer"
                        title={showCurrentPass ? "Hide password" : "Show password"}
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* DYNAMIC CURRENTLY ACTIVE PASSWORD (Shows whatever is currently set!) */}
                    <div className="flex items-center space-x-2 pt-1 text-[11px] text-ink-muted">
                      <span>Currently active password:</span>
                      <span className="font-mono font-bold text-ink bg-ivory-200 px-2 py-0.5 rounded border border-ivory-300">
                        {showActivePassword ? (activePassword || "••••••••") : "••••••••"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowActivePassword(!showActivePassword)}
                        className="text-gold hover:text-ink text-[10px] font-semibold uppercase tracking-wider underline cursor-pointer"
                      >
                        {showActivePassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-ink">
                        New Password (Optional)
                      </label>
                      <div className="relative flex items-center border border-ivory-300 rounded bg-white p-2.5 focus-within:border-gold transition-colors">
                        <Lock className="w-4 h-4 text-gold mr-2.5 flex-shrink-0" />
                        <input
                          type={showNewPass ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full bg-transparent text-xs text-ink outline-none pr-8"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-2.5 text-ink-muted hover:text-gold p-1 transition-colors cursor-pointer"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-ink">
                        Confirm New Password
                      </label>
                      <div className="relative flex items-center border border-ivory-300 rounded bg-white p-2.5 focus-within:border-gold transition-colors">
                        <Lock className="w-4 h-4 text-gold mr-2.5 flex-shrink-0" />
                        <input
                          type={showConfirmPass ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full bg-transparent text-xs text-ink outline-none pr-8"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-2.5 text-ink-muted hover:text-gold p-1 transition-colors cursor-pointer"
                        >
                          {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-ivory-200 flex items-center justify-between">
                  <span className="text-[11px] text-ink-muted">
                    Instant sync &bull; active immediately
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="px-6 py-3 bg-crimson hover:bg-crimson-800 text-ivory text-xs uppercase tracking-[0.2em] font-semibold transition-all shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSubmitting ? "Updating..." : "Save Credentials"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Info / Sidebar Cards (1 span) */}
            <div className="space-y-6">
              {/* Account Status Card */}
              <div className="bg-ivory border border-ivory-300 p-6 space-y-4 shadow-sm">
                <div className="flex items-center space-x-2 text-gold">
                  <UserCheck className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-[0.2em] font-bold">Active Account Overview</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-ivory-200">
                    <span className="text-ink-muted">Role</span>
                    <span className="font-semibold text-crimson uppercase">Super Admin / Seller</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-ivory-200">
                    <span className="text-ink-muted">Active Email</span>
                    <span className="font-mono text-[11px] text-ink font-semibold truncate max-w-[150px]" title={currentEmail}>
                      {currentEmail || "admin@kaavustyle.com"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-ivory-200">
                    <span className="text-ink-muted">Active Password</span>
                    <div className="flex items-center space-x-1.5 font-mono text-[11px] text-ink">
                      <span className="font-bold">{showActivePassword ? activePassword : "••••••••"}</span>
                      <button
                        type="button"
                        onClick={() => setShowActivePassword(!showActivePassword)}
                        className="text-gold hover:text-ink text-[10px] uppercase font-semibold underline cursor-pointer ml-1"
                      >
                        {showActivePassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between py-1 border-b border-ivory-200">
                    <span className="text-ink-muted">Session Length</span>
                    <span className="font-semibold text-ink">8 Hours</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTestSignOut}
                    className="w-full py-2.5 border border-crimson/40 text-crimson hover:bg-crimson hover:text-ivory text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center space-x-2 cursor-pointer rounded"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out & Test Login</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

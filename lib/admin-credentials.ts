import "server-only";
import fs from "fs";
import path from "path";
import { timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";

const CREDENTIALS_FILE = path.join(process.cwd(), "lib", "admin-credentials-store.json");
const ENV_FILE = path.join(process.cwd(), ".env.local");

export interface AdminCredentials {
  primaryEmail: string;
  emails: string[];
  password: string;
  updatedAt?: string;
  source?: "supabase" | "env" | "file";
}

// Server-only Supabase Service Role client (bypasses RLS for secure admin operations)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getAdminCredentials(): Promise<AdminCredentials> {
  // 1. Try reading from Supabase admin_credentials table first (Production & Live)
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("admin_credentials")
        .select("email, password, updated_at")
        .eq("id", "primary")
        .maybeSingle();

      if (error) throw error;

      if (data && data.email && data.password) {
        const emails = [data.email.trim().toLowerCase()];
        if (!emails.includes("admin@kaavustyle.com")) emails.push("admin@kaavustyle.com");
        if (!emails.includes("kaavustyles@gmail.com")) emails.push("kaavustyles@gmail.com");

        return {
          primaryEmail: data.email.trim().toLowerCase(),
          emails,
          password: data.password,
          updatedAt: data.updated_at,
          source: "supabase",
        };
      }
    } catch (e) {
      throw new Error("Unable to load admin credentials. Please try again later.");
    }
  }

  // 2. Fallback to local JSON file if exists
  let fileCredentials: { primaryEmail?: string; emails?: string[]; password?: string; updatedAt?: string } | null = null;
  if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
      const raw = fs.readFileSync(CREDENTIALS_FILE, "utf8");
      fileCredentials = JSON.parse(raw);
    } catch {}
  }

  // 3. Fallback to environment variables
  const envPassword = process.env.ADMIN_LOGIN_PASSWORD;
  const envEmails = process.env.ADMIN_LOGIN_EMAILS;

  const password = fileCredentials?.password || envPassword || "Kaavu@admin123";
  let emails = fileCredentials?.emails;
  if (!emails || !emails.length) {
    emails = (envEmails || "admin@kaavustyle.com,kaavustyles@gmail.com")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }

  if (!emails.includes("admin@kaavustyle.com") && !fileCredentials?.primaryEmail) {
    emails.push("admin@kaavustyle.com");
  }

  const primaryEmail = fileCredentials?.primaryEmail || emails[0] || "admin@kaavustyle.com";

  return {
    primaryEmail,
    emails,
    password,
    updatedAt: fileCredentials?.updatedAt,
    source: fileCredentials ? "file" : "env",
  };
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return false;
  }
  const current = await getAdminCredentials();
  const cleanEmail = email.trim().toLowerCase();

  const isEmailValid =
    current.emails.includes(cleanEmail) ||
    cleanEmail === current.primaryEmail.toLowerCase();
  if (!isEmailValid) return false;

  const currBuf = Buffer.from(current.password);
  const provBuf = Buffer.from(password);
  const isPasswordValid =
    currBuf.length === provBuf.length && timingSafeEqual(currBuf, provBuf);

  return isPasswordValid;
}

export async function updateAdminCredentials(params: {
  currentPassword: string;
  newEmail?: string;
  newPassword?: string;
}): Promise<{ success: boolean; error?: string; source?: string }> {
  const current = await getAdminCredentials();

  // 1. Verify current password
  const currBuf = Buffer.from(current.password);
  const provBuf = Buffer.from(params.currentPassword || "");
  const isMatch =
    currBuf.length === provBuf.length && timingSafeEqual(currBuf, provBuf);

  if (!isMatch) {
    return { success: false, error: "Current admin password is incorrect." };
  }

  // 2. Validate and prepare new password
  let finalPassword = current.password;
  if (params.newPassword && params.newPassword.trim()) {
    const trimmedPass = params.newPassword.trim();
    if (trimmedPass.length < 6) {
      return { success: false, error: "New password must be at least 6 characters long." };
    }
    finalPassword = trimmedPass;
  }

  // 3. Validate and prepare new email
  let finalPrimaryEmail = current.primaryEmail;
  let finalEmails = [...current.emails];
  if (params.newEmail && params.newEmail.trim()) {
    const cleanNewEmail = params.newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanNewEmail)) {
      return { success: false, error: "Please enter a valid admin email address." };
    }
    finalPrimaryEmail = cleanNewEmail;
    if (!finalEmails.includes(cleanNewEmail)) {
      finalEmails = [cleanNewEmail, ...finalEmails];
    }
  }

  const now = new Date().toISOString();
  let savedToSupabase = false;

  // 4. Save to Supabase admin_credentials table (Live production sync)
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { error: upsertErr } = await supabase.from("admin_credentials").upsert({
        id: "primary",
        email: finalPrimaryEmail,
        password: finalPassword,
        updated_at: now,
      });
      if (!upsertErr) {
        savedToSupabase = true;
      } else {
        return { success: false, error: "Could not save admin credentials. Please try again." };
      }
    } catch (e) {
      return { success: false, error: "Could not save admin credentials. Please try again." };
    }
  }

  // 5. Save to local JSON store
  try {
    const newCredentials = {
      primaryEmail: finalPrimaryEmail,
      emails: finalEmails,
      password: finalPassword,
      updatedAt: now,
    };
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(newCredentials, null, 2), "utf8");
  } catch (err) {
    if (!savedToSupabase) {
      return { success: false, error: "Could not save admin credentials. Please try again." };
    }
  }

  // 6. Update .env.local file on disk (for localhost persistence)
  try {
    if (fs.existsSync(ENV_FILE)) {
      let envContent = fs.readFileSync(ENV_FILE, "utf8");
      const emailLine = `ADMIN_LOGIN_EMAILS="${finalEmails.join(",")}"`;
      const passLine = `ADMIN_LOGIN_PASSWORD="${finalPassword}"`;

      if (/^ADMIN_LOGIN_EMAILS=.*/m.test(envContent)) {
        envContent = envContent.replace(/^ADMIN_LOGIN_EMAILS=.*/m, emailLine);
      } else {
        envContent += `\n${emailLine}`;
      }

      if (/^ADMIN_LOGIN_PASSWORD=.*/m.test(envContent)) {
        envContent = envContent.replace(/^ADMIN_LOGIN_PASSWORD=.*/m, passLine);
      } else {
        envContent += `\n${passLine}`;
      }

      fs.writeFileSync(ENV_FILE, envContent, "utf8");
    }
  } catch (err) {
    console.warn("Could not update .env.local:", err);
  }

  // 7. Update running process.env
  process.env.ADMIN_LOGIN_EMAILS = finalEmails.join(",");
  process.env.ADMIN_LOGIN_PASSWORD = finalPassword;

  return {
    success: true,
    source: savedToSupabase ? "supabase" : "local",
  };
}

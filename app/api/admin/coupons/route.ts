import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { paymentDb } from "@/lib/razorpay-server";
import { mapDbCouponToCoupon } from "@/lib/supabase";
import type { Coupon } from "@/lib/mockData";

export const runtime = "nodejs";

function couponValues(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") throw new Error("Coupon details are required.");
  const coupon = value as Partial<Coupon>;
  const code = typeof coupon.code === "string" ? coupon.code.trim().toUpperCase() : "";
  if (!/^[A-Z0-9_-]{1,40}$/.test(code)) throw new Error("Enter a valid coupon code.");
  if (coupon.discountType !== "percentage" && coupon.discountType !== "fixed") throw new Error("Choose a valid discount type.");
  const discountValue = Number(coupon.discountValue);
  const minOrderValue = Number(coupon.minOrderValue);
  const maxDiscount = coupon.maxDiscount == null ? null : Number(coupon.maxDiscount);
  const usageLimit = coupon.usageLimit == null ? null : Number(coupon.usageLimit);
  if (!Number.isFinite(discountValue) || discountValue <= 0 || (coupon.discountType === "percentage" && discountValue > 100)) throw new Error("Enter a valid discount value.");
  if (!Number.isFinite(minOrderValue) || minOrderValue < 0) throw new Error("Enter a valid minimum order value.");
  if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) throw new Error("Enter a valid maximum discount.");
  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) throw new Error("Enter a valid usage limit.");
  const validFrom = typeof coupon.validFrom === "string" && Number.isFinite(Date.parse(coupon.validFrom)) ? new Date(coupon.validFrom).toISOString() : null;
  const validUntil = coupon.validUntil && Number.isFinite(Date.parse(coupon.validUntil)) ? new Date(coupon.validUntil).toISOString() : null;
  if (!validFrom) throw new Error("Enter a valid start date.");
  if (coupon.validUntil && !validUntil) throw new Error("Enter a valid end date.");
  if (validUntil && Date.parse(validUntil) <= Date.parse(validFrom)) throw new Error("End date must be after start date.");
  return {
    code,
    description: typeof coupon.description === "string" ? coupon.description.trim().slice(0, 500) : "",
    discount_type: coupon.discountType,
    discount_value: discountValue,
    max_discount: maxDiscount,
    min_order_value: minOrderValue,
    usage_limit: usageLimit,
    valid_from: validFrom,
    valid_until: validUntil,
    is_active: coupon.isActive === true,
    show_in_navbar: coupon.showInNavbar === true,
  };
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const values = couponValues((await request.json()).coupon);
    const { data, error } = await paymentDb().from("coupons").insert(values).select("*").single();
    if (error) throw error;
    return NextResponse.json({ coupon: mapDbCouponToCoupon(data) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create coupon." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) throw new Error("Coupon ID is required.");
    const values = body.coupon ? couponValues(body.coupon) : body.fields;
    const patch = body.coupon ? values : {} as Record<string, unknown>;
    if (!body.coupon) {
      if (typeof values?.isActive === "boolean") patch.is_active = values.isActive;
      if (typeof values?.showInNavbar === "boolean") patch.show_in_navbar = values.showInNavbar;
      if (!Object.keys(patch).length) throw new Error("No coupon changes were provided.");
    }
    const { data, error } = await paymentDb().from("coupons").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ coupon: mapDbCouponToCoupon(data) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update coupon." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    const { id } = await request.json();
    if (typeof id !== "string" || !id) throw new Error("Coupon ID is required.");
    const { data, error } = await paymentDb().from("coupons").delete().eq("id", id).select("id").single();
    if (error) throw error;
    return NextResponse.json({ deletedId: data.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete coupon." }, { status: 400 });
  }
}

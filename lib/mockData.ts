export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  categoryId: string;
  stock: number;
  sizeStock?: Record<string, number>;
  variantStock?: Record<string, Record<string, number>>;
  colorImages?: Record<string, string[]>;
  sizes: string[];
  colors: string[];
  lifestyleTags: string[];
  images: string[];
  isLatest: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  mobileImageUrl?: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  orderNum: number;
  textAlign?: "left" | "center" | "right";
  textColor?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  postalCode: string;
  totalAmount: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  items: OrderItem[];
  ipAddress?: string;
  razorpayPaymentId?: string;
  paymentId?: string;
  paymentStatus?: "Paid" | "Pending" | "Failed";
  shiprocket?: {
    status: "Creating" | "Created" | "Cancelled" | "Mismatch" | "NeedsReview" | "Failed";
    orderId?: number;
    shipmentId?: number;
    weight: number;
    length: number;
    width: number;
    height: number;
    pickupLocation: string;
    deliveryState: string;
    createdAt?: string;
    reference?: string;
    attemptNumber?: number;
    checkedAt?: string;
    remoteStatus?: string;
    awb?: string;
    error?: string;
    history?: unknown[];
  };
  createdAt: string;
}

export interface LifestyleTag {
  id: string;
  name: string;
  slug: string;
}

export interface SizeOption {
  id: string;
  name: string;
  code: string;
}

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface InstagramPost {
  id: string;
  postUrl: string;
  imageUrl: string;
  caption: string;
  orderNum: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "customer";
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: "admin" | "customer";
  createdAt: string;
  orderCount?: number;
  totalSpent?: number;
  lastOrderDate?: string;
}

export const INITIAL_REGISTERED_USERS: RegisteredUser[] = [
  {
    id: "usr-1",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+91 98450 12345",
    role: "customer",
    createdAt: "2026-09-15T10:30:00.000Z",
  },
  {
    id: "usr-2",
    name: "Ananya Rao",
    email: "ananya.rao@example.com",
    phone: "+91 98765 43210",
    role: "customer",
    createdAt: "2026-09-20T14:15:00.000Z",
  },
  {
    id: "usr-3",
    name: "Deepika Patel",
    email: "deepika.patel@example.com",
    phone: "+91 91234 56789",
    role: "customer",
    createdAt: "2026-10-02T11:45:00.000Z",
  },
];

// Clean Default Categories
export const INITIAL_CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "Royal Sarees",
    slug: "sarees",
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800",
  },
  {
    id: "cat-2",
    name: "Designer Kurtis",
    slug: "kurtis",
    imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800",
  },
  {
    id: "cat-3",
    name: "Bridal Lehengas",
    slug: "lehengas",
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800",
  },
  {
    id: "cat-4",
    name: "Indo-Western",
    slug: "indo-western",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800",
  },
  {
    id: "cat-5",
    name: "Dupattas & Shawls",
    slug: "dupattas",
    imageUrl: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=800",
  },
];

// Empty Products list so only user/Supabase data shows!
export const INITIAL_PRODUCTS: Product[] = [];

// Empty Orders list
export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_BANNERS: Banner[] = [];

export const INITIAL_LIFESTYLE_TAGS: LifestyleTag[] = [
  { id: "tag-1", name: "Festive", slug: "festive" },
  { id: "tag-2", name: "Bridal", slug: "bridal" },
  { id: "tag-3", name: "Casual", slug: "casual" },
  { id: "tag-4", name: "Partywear", slug: "partywear" },
  { id: "tag-5", name: "Ethnic", slug: "ethnic" },
];

export const INITIAL_SIZES: SizeOption[] = [
  { id: "size-1", name: "Extra Small", code: "XS" },
  { id: "size-2", name: "Small", code: "S" },
  { id: "size-3", name: "Medium", code: "M" },
  { id: "size-4", name: "Large", code: "L" },
  { id: "size-5", name: "Extra Large", code: "XL" },
  { id: "size-6", name: "Double XL", code: "XXL" },
  { id: "size-7", name: "Free Size", code: "Free Size" },
];

export const INITIAL_COLORS: ColorOption[] = [
  { id: "col-1", name: "Crimson Maroon", hex: "#5E1A2D" },
  { id: "col-2", name: "Antique Gold", hex: "#8F6E3A" },
  { id: "col-3", name: "Ivory Cream", hex: "#F8F3EC" },
  { id: "col-4", name: "Royal Navy", hex: "#1A2B4C" },
  { id: "col-5", name: "Emerald Green", hex: "#1B4D3E" },
];

export const INITIAL_INSTAGRAM_POSTS: InstagramPost[] = [];

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount?: number | null;
  minOrderValue: number;
  usageLimit?: number | null;
  timesUsed: number;
  validFrom: string;
  validUntil?: string | null;
  isActive: boolean;
  showInNavbar?: boolean;
}

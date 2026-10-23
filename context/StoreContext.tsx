"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Product,
  Category,
  Banner,
  Order,
  LifestyleTag,
  SizeOption,
  ColorOption,
  InstagramPost,
  User,
  RegisteredUser,
  Coupon,
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_BANNERS,
  INITIAL_ORDERS,
  INITIAL_LIFESTYLE_TAGS,
  INITIAL_SIZES,
  INITIAL_COLORS,
  INITIAL_INSTAGRAM_POSTS,
  INITIAL_REGISTERED_USERS,
} from "@/lib/mockData";
import { cleanOrderItems } from "@/lib/order-images";
import { stockForSize, stockForVariant, availableVariant, sameStockPool, reduceInventory } from "@/lib/inventory";
import { getClientIp } from "@/lib/utils";
import {
  supabase,
  isSupabaseConfigured,
  mapDbProductToProduct,
  mapProductToDbRow,
  mapDbCategoryToCategory,
  mapDbBannerToBanner,
  mapDbOrderToOrder,
  mapDbTagToTag,
  mapDbSizeToSize,
  mapDbColorToColor,
  mapDbIgToIg,
  mapDbCouponToCoupon,
} from "@/lib/supabase";
import { uploadSingleImage, uploadMultipleImages } from "@/lib/storageUpload";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface ToastMessage {
  id: string;
  type: "cart" | "wishlist" | "info" | "success";
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  imageUrl?: string;
}

interface StoreContextType {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  orders: Order[];
  ordersError: string;
  ordersLoading: boolean;
  lifestyleTags: LifestyleTag[];
  sizes: SizeOption[];
  colors: ColorOption[];
  instagramPosts: InstagramPost[];
  coupons: Coupon[];
  couponsError: string;
  appliedCoupon: Coupon | null;
  cart: CartItem[];
  wishlist: string[];
  currentUser: User | null;
  registeredUsers: RegisteredUser[];
  isAuthModalOpen: boolean;
  isCartDrawerOpen: boolean;
  ipAddress: string;
  isLoading: boolean;
  isBannerLoading: boolean;
  toastMessage: ToastMessage | null;
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  hideToast: () => void;

  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  getDiscountAmount: () => number;

  openAuthModal: () => void;
  closeAuthModal: () => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  login: (email: string, role?: "admin" | "customer", userName?: string, phone?: string) => boolean;
  logout: () => void;

  addToCart: (product: Product, size?: string, color?: string, qty?: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateCartQty: (productId: string, size: string, color: string, qty: number) => void;
  clearCart: () => void;
  acceptPaidOrder: (order: Order) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;

  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;

  // Admin Actions
  addProduct: (product: Omit<Product, "id" | "createdAt">) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addCategory: (category: Omit<Category, "id">) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addBanner: (banner: Omit<Banner, "id">) => Promise<void>;
  updateBanner: (id: string, banner: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;

  addOrder: (orderData: Omit<Order, "id" | "orderNumber" | "createdAt">) => Promise<Order>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;

  addTag: (name: string) => Promise<void>;
  updateTag: (id: string, name: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  addSize: (name: string, code: string) => Promise<void>;
  updateSize: (id: string, name: string, code: string) => Promise<void>;
  deleteSize: (id: string) => Promise<void>;

  addColor: (name: string, hex: string) => Promise<void>;
  updateColor: (id: string, name: string, hex: string) => Promise<void>;
  deleteColor: (id: string) => Promise<void>;

  addInstagramPost: (postUrl: string, imageUrl: string, caption: string) => Promise<void>;
  deleteInstagramPost: (id: string) => Promise<void>;

  addCoupon: (coupon: Omit<Coupon, "id" | "timesUsed">) => Promise<void>;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;

  registerUser: (name: string, email: string, phone: string) => Promise<void>;
  deleteRegisteredUser: (id: string, email: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

async function saveCouponToServer(method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>): Promise<{ coupon?: Coupon; deletedId?: string }> {
  const response = await fetch("/api/admin/coupons", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error || "Could not save coupon.");
  return result;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ks_registered_users");
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.warn("Could not parse ks_registered_users from localStorage:", e);
      }
    }
    return INITIAL_REGISTERED_USERS;
  });
  const [lifestyleTags, setLifestyleTags] = useState<LifestyleTag[]>(INITIAL_LIFESTYLE_TAGS);
  const [sizes, setSizes] = useState<SizeOption[]>(INITIAL_SIZES);
  const [colors, setColors] = useState<ColorOption[]>(INITIAL_COLORS);
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>(INITIAL_INSTAGRAM_POSTS);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsError, setCouponsError] = useState(isSupabaseConfigured ? "" : "Supabase is not configured. Coupons cannot be loaded or saved.");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCart = localStorage.getItem("ks_cart");
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            return parsedCart
              .map((item: any) => {
                const prodId = item.productId || item.product?.id;
                const fullProduct =
                  INITIAL_PRODUCTS.find((p) => p.id === prodId) || item.product;
                if (!fullProduct || !fullProduct.id) return null;
                return {
                  product: fullProduct,
                  quantity: item.quantity || 1,
                  selectedSize: item.selectedSize || "Standard",
                  selectedColor: item.selectedColor || "Standard",
                };
              })
              .filter(Boolean) as CartItem[];
          }
        }
      } catch (err) {
        console.warn("Could not load initial cart from localStorage:", err);
      }
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedWishlist = localStorage.getItem("ks_wishlist");
        if (savedWishlist) {
          const parsed = JSON.parse(savedWishlist);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (err) {
        console.warn("Could not load initial wishlist from localStorage:", err);
      }
    }
    return [];
  });

  const [customerUser, setCustomerUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedUser = localStorage.getItem("ks_user");
        if (savedUser) { const user = JSON.parse(savedUser); return user.role === "customer" ? user : null; }
      } catch (e) {
        console.warn("Could not load ks_user from localStorage:", e);
      }
    }
    return null;
  });
  const [adminUser, setAdminUser] = useState<User | null>(() => {
    try {
      if (typeof window === "undefined") return null;
      const saved = localStorage.getItem("ks_admin_user") || localStorage.getItem("ks_user");
      if (!saved) return null;
      const user = JSON.parse(saved);
      return user.role === "admin" ? user : null;
    } catch { return null; }
  });
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const currentUser = isAdminRoute ? adminUser : customerUser;

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [ipAddress, setIpAddress] = useState("127.0.0.1");
  const [isLoading, setIsLoading] = useState(true);
  const [isBannerLoading, setIsBannerLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

  const showToast = (toastData: Omit<ToastMessage, "id">) => {
    const id = "toast-" + Date.now();
    setToastMessage({ id, ...toastData });
  };

  const hideToast = () => setToastMessage(null);

  // Load from Supabase Database (or fallback to LocalStorage/Seed)
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIpAddress(getClientIp());

    let cancelled = false;
    async function loadBanners() {
      try {
        if (isSupabaseConfigured) {
          const { data, error } = await supabase.from("banners").select("*").order("order_num", { ascending: true });
          if (!cancelled && !error && data) setBanners(data.map(mapDbBannerToBanner));
        } else {
          const saved = localStorage.getItem("ks_banners");
          if (!cancelled && saved) setBanners(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Error loading banners:", error);
      } finally {
        if (!cancelled) setIsBannerLoading(false);
      }
    }
    loadBanners();

    async function loadDataFromSupabase() {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured) {
          // Fetch all store collections concurrently in parallel
          const [
            { data: pData, error: pErr },
            { data: cData, error: cErr },
            { data: tData },
            { data: sData },
            { data: colData },
            { data: igData },
            { data: couponData, error: couponError },
          ] = await Promise.all([
            supabase.from("products").select("*").order("created_at", { ascending: false }).then(result => {
              if (!cancelled && !result.error && result.data) setProducts(result.data.map(mapDbProductToProduct));
              return result;
            }),
            supabase.from("categories").select("*").order("name", { ascending: true }).then(result => {
              if (!cancelled && !result.error && result.data) setCategories(result.data.map(mapDbCategoryToCategory));
              return result;
            }),
            supabase.from("lifestyle_tags").select("*"),
            supabase.from("sizes").select("*"),
            supabase.from("colors").select("*"),
            supabase.from("instagram_posts").select("*").then(result => {
              if (!cancelled && !result.error && result.data) setInstagramPosts(result.data.map(mapDbIgToIg));
              return result;
            }),
            supabase.from("coupons").select("*").order("created_at", { ascending: false }),
          ]);

          if (!pErr && pData && pData.length > 0) setProducts(pData.map(mapDbProductToProduct));
          if (!cErr && cData && cData.length > 0) setCategories(cData.map(mapDbCategoryToCategory));
          if (tData && tData.length > 0) setLifestyleTags(tData.map(mapDbTagToTag));
          if (sData && sData.length > 0) setSizes(sData.map(mapDbSizeToSize));
          if (colData && colData.length > 0) setColors(colData.map(mapDbColorToColor));
          if (igData && igData.length > 0) setInstagramPosts(igData.map(mapDbIgToIg));
          if (!cancelled && !couponError && couponData) {
            setCoupons(couponData.map(mapDbCouponToCoupon));
            setCouponsError("");
          }
          if (!cancelled && couponError) setCouponsError(`Could not load coupons: ${couponError.message}`);

          try {
            const { data: uData, error: uErr } = await supabase.from("registered_users").select("*").order("created_at", { ascending: false });
            if (!cancelled && !uErr && uData && uData.length > 0) {
              setRegisteredUsers(uData.map((row: any) => ({
                id: row.id,
                name: row.name,
                email: row.email,
                phone: row.phone || "",
                role: row.role || "customer",
                createdAt: row.created_at || new Date().toISOString(),
              })));
            }
          } catch {
            // Table may not exist yet in Supabase
          }
        } else {
          // LocalStorage fallback
          const savedProducts = localStorage.getItem("ks_products");
          if (savedProducts) setProducts(JSON.parse(savedProducts));

          const savedCategories = localStorage.getItem("ks_categories");
          if (savedCategories) setCategories(JSON.parse(savedCategories));

          const savedUsers = localStorage.getItem("ks_registered_users");
          if (savedUsers) {
            try { setRegisteredUsers(JSON.parse(savedUsers)); } catch {}
          }

        }
      } catch (err) {
        console.error("Error connecting to Supabase database:", err);
        if (!cancelled && isSupabaseConfigured) setCouponsError("Could not load coupons. Please refresh and try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDataFromSupabase();
    return () => { cancelled = true; };
  }, []);

  const [ordersError, setOrdersError] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(false);
  useEffect(() => {
    // Public pages do not request or preload the order collection.
    if (!isAdminRoute && pathname !== "/orders") { setOrders([]); return; }
    if (!isSupabaseConfigured) {
      const saved = localStorage.getItem("ks_orders");
      if (saved) setOrders(JSON.parse(saved));
      return;
    }
    if (isAdminRoute && !adminUser) { setOrders([]); return; }
    const controller = new AbortController();
    setOrders([]); setOrdersError(""); setOrdersLoading(true);
    const endpoint = isAdminRoute ? "/api/admin/orders" : "/api/orders";
    fetch(endpoint, { signal: controller.signal, cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load orders.");
      if (!controller.signal.aborted) setOrders(result.orders.map(mapDbOrderToOrder));
    }).catch(error => { if (!controller.signal.aborted) setOrdersError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setOrdersLoading(false); });
    return () => controller.abort();
  }, [isAdminRoute, pathname === "/orders", adminUser]);

  // Save Cart & Wishlist locally with QuotaExceeded error prevention
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Store compact cart payload without heavy multi-megabyte base64 image strings
        const lightCart = cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            category: item.product.category,
            images: [item.product.images[0] || ""],
          },
        }));
        localStorage.setItem("ks_cart", JSON.stringify(lightCart));
      } catch (err) {
        console.warn("localStorage quota exceeded for ks_cart, retrying with minimal payload:", err);
        try {
          localStorage.removeItem("ks_cart");
          const minimalCart = cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          }));
          localStorage.setItem("ks_cart", JSON.stringify(minimalCart));
        } catch (retryErr) {
          console.error("Failed to save cart to localStorage:", retryErr);
        }
      }
    }
  }, [cart]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ks_wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (customerUser) {
        localStorage.setItem("ks_user", JSON.stringify(customerUser));
      } else {
        localStorage.removeItem("ks_user");
      }
    }
  }, [customerUser]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (adminUser) {
        localStorage.setItem("ks_admin_user", JSON.stringify(adminUser));
      } else {
        localStorage.removeItem("ks_admin_user");
        try {
          const savedUser = localStorage.getItem("ks_user");
          if (savedUser && JSON.parse(savedUser).role === "admin") {
            localStorage.removeItem("ks_user");
          }
        } catch {}
      }
    }
  }, [adminUser]);

  // Auth Actions
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openCartDrawer = () => setIsCartDrawerOpen(true);
  const closeCartDrawer = () => setIsCartDrawerOpen(false);

  const login = (email: string, role: "admin" | "customer" = "customer", userName?: string, phone?: string) => {
    const isAdmin = role === "admin";
    const displayName = userName?.trim()
      ? userName.trim()
      : isAdmin
      ? "Admin User"
      : email.split("@")[0];

    const user: User = {
      id: "usr-" + Date.now(),
      name: displayName,
      email,
      phone: phone?.trim(),
      role: isAdmin ? "admin" : "customer",
    };
    if (isAdmin) setAdminUser(user);
    else setCustomerUser(user);
    closeAuthModal();
    return true;
  };

  const logout = () => {
    setOrders([]);
    if (isAdminRoute) {
      void fetch("/api/admin/session", { method: "DELETE" });
      setAdminUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("ks_admin_user");
        try {
          const savedUser = localStorage.getItem("ks_user");
          if (savedUser && JSON.parse(savedUser).role === "admin") {
            localStorage.removeItem("ks_user");
          }
        } catch {}
      }
    } else {
      void fetch("/api/orders", { method: "DELETE" });
      setCustomerUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("ks_user");
      }
    }
  };

  // Cart Actions
  const addToCart = (product: Product, size?: string, color?: string, qty: number = 1) => {
    const preferred = availableVariant(product);
    const selectedSize = size || preferred?.size || product.sizes[0] || "Standard";
    const selectedColor = color || preferred?.color || product.colors[0] || "Standard";

    const latest = products.find(p => p.id === product.id) || product;
    const alreadyInBag = cart.filter(item => item.product.id === product.id && sameStockPool(latest, selectedSize, selectedColor, item.selectedSize, item.selectedColor)).reduce((sum, item) => sum + item.quantity, 0);
    if (!Number.isInteger(qty) || qty <= 0 || alreadyInBag + qty > stockForVariant(latest, selectedSize, selectedColor)) {
      showToast({ type: "info", title: "Stock unavailable", message: `Only ${stockForVariant(latest, selectedSize, selectedColor)} available for this size and color.` });
      return;
    }
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += qty;
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: qty,
            selectedSize,
            selectedColor,
          },
        ];
      }
    });

    showToast({
      type: "cart",
      title: "Added to Shopping Bag ✨",
      message: `${product.name} (${selectedSize})`,
      actionText: "View Cart",
      onAction: () => setIsCartDrawerOpen(true),
      imageUrl: product.images[0],
    });
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedSize === size &&
            item.selectedColor === color
          )
      )
    );
  };

  const updateCartQty = (productId: string, size: string, color: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    const product = products.find(value => value.id === productId);
    const otherQuantity = cart.filter(item => item.product.id === productId && (product ? sameStockPool(product, size, color, item.selectedSize, item.selectedColor) : true) && !(item.selectedSize === size && item.selectedColor === color)).reduce((sum, item) => sum + item.quantity, 0);
    if (!product || !Number.isInteger(qty) || qty + otherQuantity > stockForVariant(product, size, color)) {
      showToast({ type: "info", title: "Stock unavailable", message: "This quantity is not available for the selected size." });
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (
          item.product.id === productId &&
          item.selectedSize === size &&
          item.selectedColor === color
        ) {
          return { ...item, quantity: qty };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);
  const acceptPaidOrder = (order: Order) => {
    setOrders(previous => [order, ...previous.filter(item => item.id !== order.id)]);
    clearCart();
    setAppliedCoupon(null);
    void supabase.from("products").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setProducts(data.map(mapDbProductToProduct));
    });
  };

  const getCartTotal = () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const getCartItemCount = () => cart.reduce((count, item) => count + item.quantity, 0);

  const toggleWishlist = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setWishlist((prev) => {
      const isAlreadyIn = prev.includes(productId);
      if (isAlreadyIn) {
        if (product) {
          showToast({
            type: "wishlist",
            title: "Removed from Wishlist",
            message: `${product.name} removed from your wishlist.`,
            imageUrl: product.images[0],
          });
        }
        return prev.filter((id) => id !== productId);
      } else {
        if (product) {
          showToast({
            type: "wishlist",
            title: "Saved to Wishlist ❤️",
            message: `${product.name} saved to your luxury wishlist.`,
            actionText: "View Wishlist",
            onAction: () => {
              if (typeof window !== "undefined") window.location.href = "/wishlist";
            },
            imageUrl: product.images[0],
          });
        }
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const clearWishlist = () => setWishlist([]);

  // --- SUPABASE CRUD ACTIONS ---

  // Admin Product Actions
  const addProduct = async (productData: Omit<Product, "id" | "createdAt">) => {
    // Ensure all images are uploaded to Supabase Storage bucket
    const cleanImages = await uploadMultipleImages(productData.images || [], "products");
    const cleanColorImages: Record<string, string[]> = {};
    if (productData.colorImages) {
      for (const [col, cImgs] of Object.entries(productData.colorImages)) {
        cleanColorImages[col] = await uploadMultipleImages(cImgs || [], "products");
      }
    }
    const cleanProductData = {
      ...productData,
      images: cleanImages,
      colorImages: cleanColorImages,
    };

    const tempId = "prod-" + Date.now();
    const tempProduct: Product = {
      ...cleanProductData,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    // Update local state instantly
    setProducts((prev) => [tempProduct, ...prev]);

    // Persist to Supabase Database
    if (isSupabaseConfigured) {
      try {
        const dbRow = mapProductToDbRow(cleanProductData);
        const { data, error } = await supabase.from("products").insert([dbRow]).select();
        if (error) {
          throw new Error(error.message);
        } else if (data && data[0]) {
          const insertedProduct = mapDbProductToProduct(data[0]);
          setProducts((prev) => prev.map((p) => (p.id === tempId ? insertedProduct : p)));
        }
      } catch (err) {
        console.error("Error inserting product into Supabase:", err);
        setProducts(prev => prev.filter(p => p.id !== tempId));
        throw err;
      }
    } else {
      try {
        localStorage.setItem("ks_products", JSON.stringify([tempProduct, ...products]));
      } catch (err) {
        console.error("Quota error saving products to localStorage:", err);
      }
    }
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    const previous = products.find(product => product.id === id);

    // Sanitize any updated images to Supabase Storage
    const fieldsToSave = { ...updatedFields };
    if (updatedFields.images) {
      fieldsToSave.images = await uploadMultipleImages(updatedFields.images, "products");
    }
    if (updatedFields.colorImages) {
      const cleanColorImages: Record<string, string[]> = {};
      for (const [col, cImgs] of Object.entries(updatedFields.colorImages)) {
        cleanColorImages[col] = await uploadMultipleImages(cImgs || [], "products");
      }
      fieldsToSave.colorImages = cleanColorImages;
    }

    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...fieldsToSave } : p)));

    if (isSupabaseConfigured) {
      try {
        const updateRow: any = {};
        if (fieldsToSave.name) updateRow.name = fieldsToSave.name;
        if (fieldsToSave.description) updateRow.description = fieldsToSave.description;
        if (fieldsToSave.price !== undefined) updateRow.price = fieldsToSave.price;
        if (fieldsToSave.originalPrice !== undefined) updateRow.original_price = fieldsToSave.originalPrice;
        if (fieldsToSave.category) updateRow.category_name = fieldsToSave.category;
        if (fieldsToSave.stock !== undefined) updateRow.stock = fieldsToSave.stock;
        if (fieldsToSave.sizeStock) updateRow.size_stock = fieldsToSave.sizeStock;
        if (fieldsToSave.variantStock) updateRow.variant_stock = fieldsToSave.variantStock;
        if (fieldsToSave.colorImages) updateRow.color_images = fieldsToSave.colorImages;
        if (fieldsToSave.sizes) updateRow.sizes = fieldsToSave.sizes;
        if (fieldsToSave.colors) updateRow.colors = fieldsToSave.colors;
        if (fieldsToSave.lifestyleTags) updateRow.lifestyle_tags = fieldsToSave.lifestyleTags;
        if (fieldsToSave.images) updateRow.images = fieldsToSave.images;
        if (fieldsToSave.isLatest !== undefined) updateRow.is_latest = fieldsToSave.isLatest;
        if (fieldsToSave.isFeatured !== undefined) updateRow.is_featured = fieldsToSave.isFeatured;

        const { error } = await supabase.from("products").update(updateRow).eq("id", id);
        if (error) throw new Error(error.message);
      } catch (err) {
        console.error("Error updating product in Supabase:", err);
        if (previous) setProducts(prev => prev.map(product => product.id === id ? previous : product));
        throw err;
      }
    } else {
      localStorage.setItem("ks_products", JSON.stringify(products.map(product => product.id === id ? { ...product, ...fieldsToSave } : product)));
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from("products").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting product from Supabase:", err);
      }
    }
  };

  // Admin Category Actions
  const addCategory = async (categoryData: Omit<Category, "id">) => {
    const cleanImageUrl = categoryData.imageUrl
      ? await uploadSingleImage(categoryData.imageUrl, "categories")
      : "";
    const cleanData = { ...categoryData, imageUrl: cleanImageUrl };
    const tempCategory: Category = { ...cleanData, id: "cat-" + Date.now() };
    setCategories((prev) => [...prev, tempCategory]);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("categories")
          .insert([{ name: cleanData.name, slug: cleanData.slug, image_url: cleanData.imageUrl }])
          .select();
        if (!error && data && data[0]) {
          setCategories((prev) => prev.map((c) => (c.id === tempCategory.id ? mapDbCategoryToCategory(data[0]) : c)));
        }
      } catch (err) {
        console.error("Error adding category to Supabase:", err);
      }
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from("categories").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting category from Supabase:", err);
      }
    }
  };

  const updateCategory = async (id: string, fields: Partial<Category>) => {
    const cleanFields = { ...fields };
    if (fields.imageUrl) {
      cleanFields.imageUrl = await uploadSingleImage(fields.imageUrl, "categories");
    }
    if (isSupabaseConfigured) {
      const row: any = { name: cleanFields.name, image_url: cleanFields.imageUrl };
      if (cleanFields.slug) row.slug = cleanFields.slug;
      const { error } = await supabase.from("categories").update(row).eq("id", id);
      if (error) throw new Error(error.message);
    }
    const updated = categories.map(category => category.id === id ? { ...category, ...cleanFields } : category);
    if (!isSupabaseConfigured) localStorage.setItem("ks_categories", JSON.stringify(updated));
    setCategories(updated);
  };

  // Admin Banner Actions
  const addBanner = async (bannerData: Omit<Banner, "id">) => {
    const cleanImageUrl = bannerData.imageUrl
      ? await uploadSingleImage(bannerData.imageUrl, "banners")
      : "";
    const cleanMobileImageUrl = bannerData.mobileImageUrl
      ? await uploadSingleImage(bannerData.mobileImageUrl, "banners")
      : undefined;
    const cleanData = {
      ...bannerData,
      imageUrl: cleanImageUrl,
      ...(cleanMobileImageUrl ? { mobileImageUrl: cleanMobileImageUrl } : {}),
    };
    const tempBanner: Banner = { ...cleanData, id: "banner-" + Date.now() };
    setBanners((prev) => [...prev, tempBanner]);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("banners")
          .insert([
            {
              title: cleanData.title,
              subtitle: cleanData.subtitle,
              image_url: cleanData.imageUrl,
              ...(cleanData.mobileImageUrl ? { mobile_image_url: cleanData.mobileImageUrl } : {}),
              cta_text: cleanData.ctaText,
              cta_link: cleanData.ctaLink,
              is_active: cleanData.isActive,
              order_num: cleanData.orderNum,
              text_align: cleanData.textAlign || "left",
              text_color: cleanData.textColor || "#F8F3EC",
            },
          ])
          .select();
        if (!error && data && data[0]) {
          setBanners((prev) => prev.map((b) => (b.id === tempBanner.id ? mapDbBannerToBanner(data[0]) : b)));
        }
        if (error) throw new Error(error.message);
      } catch (err) {
        console.error("Error adding banner to Supabase:", err);
        setBanners(prev => prev.filter(b => b.id !== tempBanner.id));
        throw err;
      }
    }
  };

  const updateBanner = async (id: string, fields: Partial<Banner>) => {
    const previous = banners.find(b => b.id === id);
    const cleanFields = { ...fields };
    if (fields.imageUrl) {
      cleanFields.imageUrl = await uploadSingleImage(fields.imageUrl, "banners");
    }
    if (fields.mobileImageUrl !== undefined) {
      cleanFields.mobileImageUrl = fields.mobileImageUrl
        ? await uploadSingleImage(fields.mobileImageUrl, "banners")
        : "";
    }
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ...cleanFields } : b)));
    if (isSupabaseConfigured) {
      try {
        const updateObj: any = {};
        if (cleanFields.isActive !== undefined) updateObj.is_active = cleanFields.isActive;
        if (cleanFields.title) updateObj.title = cleanFields.title;
        if (cleanFields.imageUrl) updateObj.image_url = cleanFields.imageUrl;
        if (cleanFields.mobileImageUrl !== undefined) updateObj.mobile_image_url = cleanFields.mobileImageUrl || null;
        if (cleanFields.subtitle !== undefined) updateObj.subtitle = cleanFields.subtitle;
        if (cleanFields.ctaText !== undefined) updateObj.cta_text = cleanFields.ctaText;
        if (cleanFields.ctaLink !== undefined) updateObj.cta_link = cleanFields.ctaLink;
        if (cleanFields.textAlign) updateObj.text_align = cleanFields.textAlign;
        if (cleanFields.textColor) updateObj.text_color = cleanFields.textColor;
        const { error } = await supabase.from("banners").update(updateObj).eq("id", id);
        if (error) throw new Error(error.message);
      } catch (err) {
        console.error("Error updating banner in Supabase:", err);
        if (previous) setBanners(prev => prev.map(b => b.id === id ? previous : b));
        throw err;
      }
    }
  };

  const deleteBanner = async (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from("banners").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting banner from Supabase:", err);
      }
    }
  };

  // Order Actions
  const getNextKaavuOrderNumber = (orderList: Order[]) => {
    let maxNum = 0;
    for (const o of orderList) {
      if (o.orderNumber) {
        const m = o.orderNumber.match(/^KAAVU(\d+)$/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }
      }
    }
    return `KAAVU${String(maxNum + 1).padStart(5, "0")}`;
  };

  const addOrder = async (orderData: Omit<Order, "id" | "orderNumber" | "createdAt">): Promise<Order> => {
    let newOrder: Order;
    orderData = { ...orderData, items: cleanOrderItems(orderData.items) };
    const nextOrderNumber = getNextKaavuOrderNumber(orders);

    if (isSupabaseConfigured) {
      throw new Error("Please use verified Razorpay checkout to place this order.");
    } else {
      const updated = reduceInventory(products, orderData.items);
      newOrder = {
        ...orderData,
        id: "ord-" + Date.now(),
        orderNumber: nextOrderNumber,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("ks_products", JSON.stringify(updated));
      localStorage.setItem("ks_orders", JSON.stringify([newOrder, ...orders]));
      setProducts(updated);
    }
    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    try {
      if (isSupabaseConfigured) {
        const response = await fetch('/api/admin/orders/' + encodeURIComponent(id), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not update order.");
      }
      setOrders(previous => previous.map(order => order.id === id ? { ...order, status } : order));
    } catch (error) {
      showToast({ type: "info", title: "Order update failed", message: error instanceof Error ? error.message : "Please retry." });
      throw error;
    }
  };

  // Attribute Actions
  const addTag = async (name: string) => {
    const tempTag: LifestyleTag = {
      id: "tag-" + Date.now(),
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    };
    setLifestyleTags((prev) => [...prev, tempTag]);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("lifestyle_tags").insert([{ name: tempTag.name, slug: tempTag.slug }]).select();
        if (!error && data && data[0]) {
          setLifestyleTags((prev) => prev.map((t) => (t.id === tempTag.id ? mapDbTagToTag(data[0]) : t)));
        }
      } catch (err) {
        console.error("Error adding tag to Supabase:", err);
      }
    }
  };

  const updateTag = async (id: string, name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    setLifestyleTags((prev) => prev.map((t) => (t.id === id ? { ...t, name, slug } : t)));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from("lifestyle_tags").update({ name, slug }).eq("id", id);
        if (error) console.error("Error updating tag in Supabase:", error);
      } catch (err) {
        console.error("Error updating tag in Supabase:", err);
      }
    }
  };

  const deleteTag = async (id: string) => {
    setLifestyleTags((prev) => prev.filter((t) => t.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from("lifestyle_tags").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting tag from Supabase:", err);
      }
    }
  };

  const addSize = async (name: string, code: string) => {
    const tempId = "size-" + Date.now();
    const newSize: SizeOption = { id: tempId, name, code };
    setSizes((prev) => [...prev, newSize]);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("sizes").insert([{ name, code }]).select();
        if (!error && data && data[0]) {
          setSizes((prev) => prev.map((s) => (s.id === tempId ? mapDbSizeToSize(data[0]) : s)));
        }
      } catch (err) {
        console.error("Error adding size to Supabase:", err);
      }
    }
  };

  const updateSize = async (id: string, name: string, code: string) => {
    setSizes((prev) => prev.map((s) => (s.id === id ? { ...s, name, code } : s)));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from("sizes").update({ name, code }).eq("id", id);
        if (error) console.error("Error updating size in Supabase:", error);
      } catch (err) {
        console.error("Error updating size in Supabase:", err);
      }
    }
  };

  const deleteSize = async (id: string) => {
    setSizes((prev) => prev.filter((s) => s.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from("sizes").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting size from Supabase:", err);
      }
    }
  };

  const addColor = async (name: string, hex: string) => {
    const tempId = "col-" + Date.now();
    const newColor: ColorOption = { id: tempId, name, hex };
    setColors((prev) => [...prev, newColor]);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("colors").insert([{ name, hex }]).select();
        if (!error && data && data[0]) {
          setColors((prev) => prev.map((c) => (c.id === tempId ? mapDbColorToColor(data[0]) : c)));
        }
      } catch (err) {
        console.error("Error adding color to Supabase:", err);
      }
    }
  };

  const updateColor = async (id: string, name: string, hex: string) => {
    setColors((prev) => prev.map((c) => (c.id === id ? { ...c, name, hex } : c)));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from("colors").update({ name, hex }).eq("id", id);
        if (error) console.error("Error updating color in Supabase:", error);
      } catch (err) {
        console.error("Error updating color in Supabase:", err);
      }
    }
  };

  const deleteColor = async (id: string) => {
    setColors((prev) => prev.filter((c) => c.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from("colors").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting color from Supabase:", err);
      }
    }
  };

  // Instagram Actions
  const addInstagramPost = async (postUrl: string, imageUrl: string, caption: string) => {
    const cleanImageUrl = imageUrl ? await uploadSingleImage(imageUrl, "instagram") : "";
    const newPost: InstagramPost = {
      id: "ig-" + Date.now(),
      postUrl,
      imageUrl: cleanImageUrl,
      caption,
      orderNum: instagramPosts.length + 1,
    };
    setInstagramPosts((prev) => [...prev, newPost]);
    if (isSupabaseConfigured) {
      try {
        await supabase.from("instagram_posts").insert([
          { post_url: postUrl, image_url: cleanImageUrl, caption, order_num: newPost.orderNum },
        ]);
      } catch (err) {
        console.error("Error adding instagram post to Supabase:", err);
      }
    }
  };

  const deleteInstagramPost = async (id: string) => {
    setInstagramPosts((prev) => prev.filter((p) => p.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from("instagram_posts").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting instagram post from Supabase:", err);
      }
    }
  };

  // Coupon Handlers
  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: "Please enter a valid coupon code." };
    }

    const found = coupons.find((c) => c.code.toUpperCase() === cleanCode);
    if (!found) {
      return { success: false, message: `Coupon code "${cleanCode}" is invalid.` };
    }

    if (!found.isActive) {
      return { success: false, message: `Coupon code "${found.code}" is currently inactive.` };
    }

    const subtotal = getCartTotal();
    if (found.minOrderValue > 0 && subtotal < found.minOrderValue) {
      return {
        success: false,
        message: `Minimum order value of ₹${found.minOrderValue} required for coupon ${found.code}.`,
      };
    }

    const now = new Date();
    if (found.validFrom) {
      const validFromDate = new Date(found.validFrom);
      if (now < validFromDate) {
        return { success: false, message: `Coupon code "${found.code}" is not valid yet.` };
      }
    }

    if (found.validUntil) {
      const validUntilDate = new Date(found.validUntil);
      if (now > validUntilDate) {
        return { success: false, message: `Coupon code "${found.code}" has expired.` };
      }
    }

    if (found.usageLimit && found.timesUsed >= found.usageLimit) {
      return { success: false, message: `Coupon code "${found.code}" usage limit has been reached.` };
    }

    setAppliedCoupon(found);
    return { success: true, message: `Coupon ${found.code} applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = getCartTotal();
    if (subtotal === 0) return 0;

    if (appliedCoupon.discountType === "percentage") {
      let discount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
        discount = appliedCoupon.maxDiscount;
      }
      return Math.round(discount);
    } else {
      return Math.min(subtotal, appliedCoupon.discountValue);
    }
  };

  const addCoupon = async (couponData: Omit<Coupon, "id" | "timesUsed">) => {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured. Coupon was not saved.");
    const { coupon } = await saveCouponToServer("POST", { coupon: couponData });
    if (!coupon) throw new Error("Coupon was not returned after saving.");
    setCoupons((prev) => [coupon, ...prev]);
  };

  const updateCoupon = async (id: string, updatedFields: Partial<Coupon>) => {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured. Coupon was not updated.");
    const current = coupons.find((coupon) => coupon.id === id);
    if (!current) throw new Error("Coupon no longer exists. Refresh the page.");
    const body = Object.keys(updatedFields).every((key) => key === "isActive" || key === "showInNavbar")
      ? { id, fields: updatedFields }
      : { id, coupon: { ...current, ...updatedFields } };
    const { coupon } = await saveCouponToServer("PATCH", body);
    if (!coupon) throw new Error("Coupon was not returned after saving.");
    setCoupons((prev) => prev.map((item) => item.id === id ? coupon : item));
    if (appliedCoupon?.id === id) setAppliedCoupon(coupon);
  };

  const deleteCoupon = async (id: string) => {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured. Coupon was not deleted.");
    const { deletedId } = await saveCouponToServer("DELETE", { id });
    if (deletedId !== id) throw new Error("Coupon deletion was not confirmed.");
    setCoupons((prev) => prev.filter((coupon) => coupon.id !== id));
    if (appliedCoupon?.id === id) setAppliedCoupon(null);
  };

  const registerUser = async (name: string, email: string, phone: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const newUser: RegisteredUser = {
      id: "usr-" + Date.now(),
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      role: "customer",
      createdAt: new Date().toISOString(),
    };

    setRegisteredUsers((prev) => {
      const existsIndex = prev.findIndex((u) => u.email.toLowerCase() === trimmedEmail);
      let updated: RegisteredUser[];
      if (existsIndex >= 0) {
        updated = [...prev];
        updated[existsIndex] = {
          ...updated[existsIndex],
          name: trimmedName || updated[existsIndex].name,
          phone: trimmedPhone || updated[existsIndex].phone,
        };
      } else {
        updated = [newUser, ...prev];
      }
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("ks_registered_users", JSON.stringify(updated));
        } catch (e) {
          console.warn("Could not save registered users:", e);
        }
      }
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from("registered_users").upsert({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          role: "customer",
        }, { onConflict: "email" });
      } catch (err) {
        console.warn("Supabase upsert registered_users:", err);
      }
    }
  };

  const deleteRegisteredUser = async (id: string, email: string) => {
    setRegisteredUsers((prev) => {
      const updated = prev.filter((u) => u.id !== id && u.email.toLowerCase() !== email.toLowerCase());
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("ks_registered_users", JSON.stringify(updated));
        } catch (e) {
          console.warn("Could not delete registered user from localStorage:", e);
        }
      }
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from("registered_users").delete().match({ email: email.toLowerCase() });
      } catch (err) {
        console.warn("Supabase delete registered_users:", err);
      }
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        banners,
        orders,
        ordersError,
        ordersLoading,
        registeredUsers,
        lifestyleTags,
        sizes,
        colors,
        instagramPosts,
        coupons,
        couponsError,
        appliedCoupon,
        cart,
        wishlist,
        currentUser,
        isAuthModalOpen,
        isCartDrawerOpen,
        ipAddress,
        isLoading,
        isBannerLoading,
        toastMessage,
        showToast,
        hideToast,

        applyCoupon,
        removeCoupon,
        getDiscountAmount,

        openAuthModal,
        closeAuthModal,
        openCartDrawer,
        closeCartDrawer,
        login,
        logout,

        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        acceptPaidOrder,
        getCartTotal,
        getCartItemCount,

        toggleWishlist,
        isInWishlist,
        clearWishlist,

        addProduct,
        updateProduct,
        deleteProduct,

        addCategory,
        updateCategory,
        deleteCategory,

        addBanner,
        updateBanner,
        deleteBanner,

        addOrder,
        updateOrderStatus,

        addTag,
        updateTag,
        deleteTag,

        addSize,
        updateSize,
        deleteSize,

        addColor,
        updateColor,
        deleteColor,

        addInstagramPost,
        deleteInstagramPost,

        addCoupon,
        updateCoupon,
        deleteCoupon,

        registerUser,
        deleteRegisteredUser,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

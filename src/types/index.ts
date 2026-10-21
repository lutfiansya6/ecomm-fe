// ============================================================
// LUXE E-Commerce - TypeScript Type Definitions
// ============================================================

export interface User {
  id: string;
  email: string;
  password: string; // hashed (dummy bcrypt-like)
  name: string;
  role: 'admin' | 'customer';
  avatar?: string;
  createdAt: string;
}

export interface ColorVariant {
  name: string;
  hex: string;
  images: string[];
  stock?: number;
  /** Optional per-variant price. Falls back to product.price when absent. */
  price?: number;
  sizeStock?: Record<string, number>;
}

export interface Category {
  id: string;
  name: string;
  name_en?: string;
  name_id?: string;
  label_en?: string;
  label_id?: string;
  slug: string;
  order: number;
  active: boolean;
  createdAt: string;
  productCount?: number;
}

export type NavigationItemType = 'all' | 'new' | 'sale' | 'category' | 'url';

export interface NavigationChildCategory {
  id?: string;
  name: string;
  name_en?: string;
  name_id?: string;
  label_en?: string;
  label_id?: string;
  slug: string;
}

export interface NavigationItem {
  id: string;
  name?: string;
  slug?: string;
  label: string;
  label_en?: string;
  label_id?: string;
  name_en?: string;
  name_id?: string;
  type: NavigationItemType;
  target: string;
  accent: boolean;
  order: number;
  active: boolean;
  system: boolean;
  gender?: 'women' | 'men' | string;
  childCategoryIds?: (string | NavigationChildCategory)[];
  children?: NavigationChildCategory[];
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  category: string;
  categoryId?: string;
  gender?: 'women' | 'men' | 'unisex' | string;
  section?: string;
  images: string[];
  sizes: string[];
  colors: string[];
  colorVariants?: ColorVariant[];
  stock: number;
  weight?: number; // in grams (default 500g)
  featured: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  orderId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  status: 'published' | 'hidden';
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  size: string;
  color: string;
  image?: string;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface Address {
  fullName: string;
  phone: string;
  street: string;
  /** Kabupaten/Kota name (text, from wilayah API) */
  city: string;
  /** Province name (text, from wilayah API) */
  province: string;
  postalCode: string;
  country: string;
  /** Kecamatan name (text, from wilayah API) - optional for backward compat */
  district?: string;
  /** Kelurahan/Desa name (text, from wilayah API) - optional for backward compat */
  village?: string;
  label?: string;
}

export interface UserAddress extends Address {
  id: string;
  userId: string;
  label: string; // e.g. "Rumah", "Kantor", "Apartemen"
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ShippingDestination {
  id: number;
  label: string;
  subdistrict_name?: string;
  district_name?: string;
  city_name?: string;
  province_name?: string;
  zip_code?: string;
}

export interface ShippingCostOption {
  name: string;
  code: string;
  service: string;
  description?: string;
  cost: number;
  etd: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  address: Address;
  courier?: string;
  courierService?: string;
  courierEtd?: string;
  paymentMethod: 'credit_card' | 'gopay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequest {
  orderId: string;
  method: 'credit_card' | 'gopay' | 'cod';
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardName?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
  method: string;
  amount: number;
}

export interface AuthToken {
  userId: string;
  email: string;
  role: 'admin' | 'customer';
  name: string;
  iat: number;
  exp: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
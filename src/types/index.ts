// ============================================================
// LUXE E-Commerce — TypeScript Type Definitions
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

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  category: 'dress' | 'blazer' | 'bag' | 'shoes' | 'coat' | 'accessories';
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  featured: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  size: string;
  color: string;
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
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  address: Address;
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

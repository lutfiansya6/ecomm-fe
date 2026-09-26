'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  avatar?: string;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null, token: string | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (data.success) {
            set({ user: data.data.user, token: data.data.token, isLoading: false });
            return { success: true, message: data.message };
          }
          set({ isLoading: false });
          return { success: false, message: data.error || 'Login gagal' };
        } catch {
          set({ isLoading: false });
          return { success: false, message: 'Terjadi kesalahan jaringan' };
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
          });
          const data = await res.json();
          if (data.success) {
            set({ user: data.data.user, token: data.data.token, isLoading: false });
            return { success: true, message: data.message };
          }
          set({ isLoading: false });
          return { success: false, message: data.error || 'Registrasi gagal' };
        } catch {
          set({ isLoading: false });
          return { success: false, message: 'Terjadi kesalahan jaringan' };
        }
      },

      logout: async () => {
        await fetch('/api/auth/me', { method: 'POST' });
        set({ user: null, token: null });
        // Also clear via cookie route
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      },

      setUser: (user, token) => set({ user, token }),
    }),
    { name: 'luxe-auth', partialize: (state) => ({ user: state.user, token: state.token }) }
  )
);

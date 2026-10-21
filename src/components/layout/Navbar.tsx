'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import {
  ShoppingBag,
  User,
  Menu,
  X,
  Search,
  LogOut,
  Sparkles,
  MapPin,
  Package,
} from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import {
  DEFAULT_NAV_ITEMS,
  getNavigationItemHref,
  getNavigationItemSlug,
  isNavigationItemActive,
} from '@/config/navigation';
import { useT } from '@/i18n/LanguageProvider';
import { getLocalizedNavLabel } from '@/i18n';
import type { NavigationItem } from '@/types';

function NavbarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, locale, setLocale } = useT();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavigationItem[]>(DEFAULT_NAV_ITEMS);
  const [mounted, setMounted] = useState(false);

  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.openCart);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    setMounted(true);
    const fetchNavigation = async () => {
      try {
        const res = await fetch('/api/navigation?public=1', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const items: NavigationItem[] = json.data;
          items.sort((a, b) => a.order - b.order);
          setNavItems(items);
        } else {
          setNavItems(DEFAULT_NAV_ITEMS);
        }
      } catch {
        setNavItems(DEFAULT_NAV_ITEMS);
      }
    };
    fetchNavigation();
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    window.location.href = '/';
  };

  const getItemLabel = (item: NavigationItem) => {
    const slug = getNavigationItemSlug(item);
    if (slug === '' || slug === 'all' || item.type === 'all' || item.id === 'nav_all') {
      return t('nav.allProducts');
    }
    if (slug === 'new-arrivals' || slug === 'new' || item.type === 'new' || item.id === 'nav_new') {
      return t('nav.newArrivals');
    }
    if (slug === 'women' || item.id === 'nav_women') {
      return t('nav.women');
    }
    if (slug === 'men' || item.id === 'nav_men') {
      return t('nav.men');
    }
    if (slug === 'collections' || item.id === 'nav_collections') {
      return t('nav.collections');
    }
    if (slug === 'sale' || item.type === 'sale' || item.id === 'nav_sale') {
      return t('nav.sale');
    }
    return getLocalizedNavLabel(item, locale);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-[72px] transition-all duration-300 border-b ${
          scrolled
            ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-[#2a2a2a]'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="container flex items-center h-full gap-8">
          {/* Logo */}
          <Link
            href="/"
            className="font-serif text-2xl tracking-[0.15em] text-[#f0f0f0] hover:text-[#c9a84c] transition-colors shrink-0"
          >
            LUXE
          </Link>

          {/* Desktop Nav - Direct links, no dropdown */}
          <ul className="hidden lg:flex items-center gap-5 flex-1">
            {navItems.map((item) => {
              const href = getNavigationItemHref(item);
              const isActive = isNavigationItemActive(item, pathname, searchParams);
              const isAccent = Boolean(item.accent);
              const itemLabel = getItemLabel(item);

              return (
                <li key={item.id}>
                  <Link
                    href={href}
                    className={`text-xs font-medium uppercase tracking-[0.12em] transition-colors relative py-1 flex items-center gap-1.5 ${
                      isAccent
                        ? isActive
                          ? 'text-[#dbb85a]'
                          : 'text-[#c9a84c] hover:text-[#dbb85a]'
                        : isActive
                          ? 'text-[#f0f0f0]'
                          : 'text-[#a0a0a0] hover:text-[#f0f0f0]'
                    } after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-[#c9a84c] after:transition-all after:duration-300 ${
                      isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
                    }`}
                  >
                    {isAccent && <Sparkles size={12} />}
                    {itemLabel}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Desktop Language Switcher */}
            <div
              className="flex items-center text-xs tracking-wider font-semibold border border-[#2a2a2a] rounded-lg px-2 py-1 bg-[#141414]/80 mr-1"
              role="group"
              aria-label="Language Selector"
            >
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-1 py-0.5 transition-colors cursor-pointer ${
                  locale === 'en'
                    ? 'text-[#c9a84c] font-bold'
                    : 'text-[#707070] hover:text-[#f0f0f0]'
                }`}
                aria-label="Switch to English"
              >
                EN
              </button>
              <span className="text-[#333333] select-none mx-0.5">|</span>
              <button
                type="button"
                onClick={() => setLocale('id')}
                className={`px-1 py-0.5 transition-colors cursor-pointer ${
                  locale === 'id'
                    ? 'text-[#c9a84c] font-bold'
                    : 'text-[#707070] hover:text-[#f0f0f0]'
                }`}
                aria-label="Ganti ke Bahasa Indonesia"
              >
                ID
              </button>
            </div>

            <Link
              href="/products"
              className="relative flex items-center justify-center w-10 h-10 rounded-lg text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              aria-label={t('nav.search')}
            >
              <Search size={20} />
            </Link>

            <button
              className="relative flex items-center justify-center w-10 h-10 rounded-lg text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              onClick={openCart}
              aria-label={t('nav.cart')}
            >
              <ShoppingBag size={20} />
              {mounted && totalItems > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#c9a84c] text-black text-[0.6rem] font-bold rounded-full flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {mounted && user ? (
              <div className="relative">
                <button
                  className="relative flex items-center justify-center w-10 h-10 rounded-lg text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label={t('nav.userMenu')}
                >
                  <User size={20} />
                </button>
                {userMenuOpen && (
                  <>
                    <div
                      className="absolute top-[calc(100%+8px)] right-0 w-56 bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 z-50 shadow-2xl animate-scaleIn"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-sm text-[#f0f0f0]">{user.name}</span>
                        <span className="text-xs text-[#a0a0a0] truncate">{user.email}</span>
                        {user.role === 'admin' && (
                          <span className="badge badge-gold mt-1 self-start text-[0.65rem]">
                            Admin
                          </span>
                        )}
                      </div>
                      <hr className="divider my-2" />
                      <Link
                        href="/orders"
                        className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors text-left"
                      >
                        <Package size={14} /> {t('nav.myOrders')}
                      </Link>
                      <Link
                        href="/addresses"
                        className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors text-left"
                      >
                        <MapPin size={14} /> {t('nav.myAddresses')}
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors text-left"
                        >
                          {t('nav.adminDashboard')}
                        </Link>
                      )}
                      <button
                        className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                        onClick={handleLogout}
                      >
                        <LogOut size={14} /> {t('nav.logout')}
                      </button>
                    </div>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                  </>
                )}
              </div>
            ) : (
              <Link href="/login" className="btn btn-outline btn-sm">
                {t('nav.login')}
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-lg text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Direct links, no accordions */}
      {menuOpen && (
        <>
          <div className="fixed top-[72px] left-0 right-0 bg-[#111111] border-b border-[#2a2a2a] p-6 flex flex-col gap-1 z-50 max-h-[calc(100vh-72px)] overflow-y-auto animate-fadeIn">
            {/* Mobile Language Switcher */}
            <div className="flex items-center justify-between px-4 py-2.5 border border-[#2a2a2a] rounded-lg bg-[#141414] mb-3">
              <span className="text-xs uppercase tracking-wider text-[#a0a0a0]">Language / Bahasa</span>
              <div className="flex items-center text-xs tracking-wider font-semibold">
                <button
                  type="button"
                  onClick={() => setLocale('en')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    locale === 'en'
                      ? 'text-[#c9a84c] font-bold bg-[#c9a84c]/10'
                      : 'text-[#707070] hover:text-[#f0f0f0]'
                  }`}
                >
                  EN
                </button>
                <span className="text-[#333333] select-none mx-1">|</span>
                <button
                  type="button"
                  onClick={() => setLocale('id')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    locale === 'id'
                      ? 'text-[#c9a84c] font-bold bg-[#c9a84c]/10'
                      : 'text-[#707070] hover:text-[#f0f0f0]'
                  }`}
                >
                  ID
                </button>
              </div>
            </div>

            {navItems.map((item) => {
              const href = getNavigationItemHref(item);
              const isActive = isNavigationItemActive(item, pathname, searchParams);
              const isAccent = Boolean(item.accent);
              const itemLabel = getItemLabel(item);

              return (
                <Link
                  key={item.id}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-base transition-colors ${
                    isAccent
                      ? isActive
                        ? 'text-[#dbb85a] bg-[#c9a84c]/10'
                        : 'text-[#c9a84c] hover:text-[#dbb85a] hover:bg-[#c9a84c]/10'
                      : isActive
                        ? 'text-[#f0f0f0] bg-[#1a1a1a]'
                        : 'text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#1a1a1a]'
                  }`}
                >
                  {isAccent && <Sparkles size={16} />}
                  {itemLabel}
                </Link>
              );
            })}
            {!user && (
              <Link href="/login" className="btn btn-primary btn-block mt-4">
                {t('nav.loginRegister')}
              </Link>
            )}
          </div>
          <div
            className="fixed inset-0 top-[72px] bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
        </>
      )}
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense>
      <NavbarInner />
    </Suspense>
  );
}

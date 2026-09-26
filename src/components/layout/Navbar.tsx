'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { ShoppingBag, User, Menu, X, Search, LogOut, Sparkles, MapPin, Package } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';

const NAV_LINKS = [
  { href: '/products', label: 'All Products' },
  { href: '/products?section=new', label: 'New Arrivals' },
  { href: '/products?section=women', label: 'Women' },
  { href: '/products?section=men', label: 'Men' },
  { href: '/products?section=collections', label: 'Collections' },
  { href: '/products?section=sale', label: 'Sale', isSale: true },
];

function isLinkActive(linkHref: string, pathname: string, searchParams: URLSearchParams): boolean {
  const linkUrl = new URL(linkHref, 'http://x');
  if (linkUrl.pathname !== pathname) return false;
  const linkSection = linkUrl.searchParams.get('section');
  const currentSection = searchParams.get('section');
  // "/products" (no section) is active only when there's no section param
  if (!linkSection) return !currentSection;
  return linkSection === currentSection;
}

function NavbarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.openCart);
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    window.location.href = '/';
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

          {/* Desktop Nav */}
          <ul className="hidden lg:flex items-center gap-5 flex-1">
            {NAV_LINKS.map((l) => {
              const isActive = isLinkActive(l.href, pathname, searchParams);
              const isSale = 'isSale' in l && l.isSale;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`text-xs font-medium uppercase tracking-[0.12em] transition-colors relative py-1 flex items-center gap-1.5 ${
                      isSale
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
                    {isSale && <Sparkles size={12} />}
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/products"
              className="relative flex items-center justify-center w-10 h-10 rounded-lg text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search size={20} />
            </Link>

            <button
              className="relative flex items-center justify-center w-10 h-10 rounded-lg text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              onClick={openCart}
              aria-label="Cart"
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
                  aria-label="User menu"
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
                        <Package size={14} /> Pesanan Saya
                      </Link>
                      <Link
                        href="/addresses"
                        className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors text-left"
                      >
                        <MapPin size={14} /> Alamat Saya
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors text-left"
                        >
                          Dashboard Admin
                        </Link>
                      )}
                      <button
                        className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                        onClick={handleLogout}
                      >
                        <LogOut size={14} /> Logout
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
                Login
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

      {/* Mobile Menu */}
      {menuOpen && (
        <>
          <div className="fixed top-[72px] left-0 right-0 bg-[#111111] border-b border-[#2a2a2a] p-6 flex flex-col gap-1 z-50 animate-fadeIn">
            {NAV_LINKS.map((l) => {
              const isActive = isLinkActive(l.href, pathname, searchParams);
              const isSale = 'isSale' in l && l.isSale;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-2 px-4 py-3 rounded text-base transition-colors ${
                    isSale
                      ? isActive
                        ? 'text-[#dbb85a] bg-[#c9a84c]/10'
                        : 'text-[#c9a84c] hover:text-[#dbb85a] hover:bg-[#c9a84c]/10'
                      : isActive
                        ? 'text-[#f0f0f0] bg-[#1a1a1a]'
                        : 'text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#1a1a1a]'
                  }`}
                >
                  {isSale && <Sparkles size={16} />}
                  {l.label}
                </Link>
              );
            })}
            {!user && (
              <Link href="/login" className="btn btn-primary btn-block mt-4">
                Login / Register
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




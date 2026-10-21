import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import ToastProvider from '@/components/ui/ToastProvider';
import LanguageProvider from '@/i18n/LanguageProvider';
import type { Locale } from '@/i18n';

export const metadata: Metadata = {
  title: 'LUXE — Redefined Elegance',
  description:
    'LUXE is a curated luxury fashion brand. Discover our signature collection of gowns, blazers, bags, and accessories crafted for the modern icon.',
  keywords: 'luxury fashion, designer clothing, LUXE brand, premium fashion Indonesia',
  openGraph: {
    title: 'LUXE — Redefined Elegance',
    description: 'Discover our signature luxury fashion collection.',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get('locale')?.value;
  const locale: Locale = rawLocale === 'id' ? 'id' : 'en';

  return (
    <html lang={locale}>
      <body>
        <LanguageProvider initialLocale={locale}>
          <Navbar />
          <main className="page">{children}</main>
          <Footer />
          <CartDrawer />
          <ToastProvider />
        </LanguageProvider>
      </body>
    </html>
  );
}

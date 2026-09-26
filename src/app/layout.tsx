import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import ToastProvider from '@/components/ui/ToastProvider';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Navbar />
        <main className="page">{children}</main>
        <Footer />
        <CartDrawer />
        <ToastProvider />
      </body>
    </html>
  );
}

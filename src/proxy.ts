// proxy.ts - Route protection (Next.js App Router)
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PROTECTED_ROUTES = ['/orders', '/checkout', '/addresses'];
const ADMIN_ROUTES = ['/admin'];
const AUTH_ROUTES = ['/login', '/register'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('luxe_token')?.value;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuth = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtected || isAdmin) {
    if (!token) {
      return NextResponse.redirect(new URL(`/login?redirect=${pathname}`, request.url));
    }
    const user = await verifyToken(token);
    if (!user) {
      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.delete('luxe_token');
      return res;
    }
    if (isAdmin && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (isAuth && token) {
    const user = await verifyToken(token);
    if (user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/orders/:path*', '/checkout/:path*', '/addresses/:path*', '/addresses', '/admin/:path*', '/login', '/register'],
};
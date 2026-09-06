import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const token = request.cookies.get('mart_token')?.value;
  const role = request.cookies.get('mart_user_role')?.value;
  const isAuthenticated = Boolean(token);

  // 1. If trying to visit login while already authenticated -> Go to POS
  if (url.pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 2. Protect all other non-API routes from unauthenticated users
  if (!isAuthenticated) {
    if (!url.pathname.startsWith('/api/auth')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', url.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. RBAC Enforcement:
  // Role: CASHIER - can only access POS (/) and Invoices (/invoices)
  if (role === 'CASHIER') {
    const restrictedForCashier = ['/users', '/purchases', '/inventory', '/catalog', '/branches', '/payroll', '/settings'];
    if (restrictedForCashier.some(route => url.pathname.startsWith(route))) {
      const posUrl = new URL('/', request.url);
      posUrl.searchParams.set('error', 'cashier_restricted');
      return NextResponse.redirect(posUrl);
    }
  }

  // Role: MANAGER - can access all operational routes except Super Admin User Management (/users)
  if (role === 'MANAGER') {
    if (url.pathname.startsWith('/users')) {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('error', 'admin_only');
      return NextResponse.redirect(homeUrl);
    }
  }

  // SUPER_ADMIN has unrestricted access to all routes including /users

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

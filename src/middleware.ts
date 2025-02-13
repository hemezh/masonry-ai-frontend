import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define constants for paths and configuration
const PUBLIC_PATHS = ['/auth/login', '/auth/signup', '/'] as const;
const PROTECTED_PATHS = ['/dashboard'] as const;
const DEFAULT_REDIRECT_PATH = '/dashboard/chat/new';
const DEFAULT_AUTH_PATH = '/auth/login';

// Type guard for protected paths
const isProtectedPath = (path: string): boolean => {
  return PROTECTED_PATHS.some(protectedPath => 
    path === protectedPath || path.startsWith(`${protectedPath}/`)
  );
};

// Type guard for public paths
const isPublicPath = (path: string): boolean => {
  return PUBLIC_PATHS.some(publicPath => path === publicPath);
};

// Middleware function
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Handle old auth route redirect
  if (pathname === '/auth') {
    return NextResponse.redirect(new URL(DEFAULT_AUTH_PATH, request.url));
  }

  // Redirect authenticated users away from auth pages
  if (token && (pathname.startsWith('/auth/') || pathname === '/')) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT_PATH, request.url));
  }

  // Redirect unauthenticated users to login
  if (!token && isProtectedPath(pathname)) {
    const redirectUrl = new URL(DEFAULT_AUTH_PATH, request.url);
    redirectUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Configure paths that trigger the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
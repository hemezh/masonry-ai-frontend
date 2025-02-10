import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define constants for paths and configuration
const PUBLIC_PATHS = ['/auth', '/'] as const;
const PROTECTED_PATHS = ['/dashboard'] as const;
const DEFAULT_REDIRECT_PATH = '/dashboard/chat/new';
const DEFAULT_AUTH_PATH = '/auth';

// Type guard for protected paths
const isProtectedPath = (path: string): boolean => {
  return PROTECTED_PATHS.some(protectedPath => 
    path === protectedPath || path.startsWith(`${protectedPath}/`)
  );
};

// Type guard for public paths
const isPublicPath = (path: string): boolean => {
  return PUBLIC_PATHS.includes(path as any);
};

export function middleware(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const token = request.cookies.get('token')?.value;

    // Handle protected paths when user is not authenticated
    if (isProtectedPath(path) && !token) {
      return NextResponse.redirect(new URL(DEFAULT_AUTH_PATH, request.url));
    }

    // Handle public paths when user is authenticated
    if (isPublicPath(path) && token) {
      return NextResponse.redirect(new URL(DEFAULT_REDIRECT_PATH, request.url));
    }

    // Handle root dashboard path
    if (path === '/dashboard') {
      return NextResponse.redirect(new URL(DEFAULT_REDIRECT_PATH, request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return NextResponse.redirect(new URL(DEFAULT_AUTH_PATH, request.url));
  }
}

// Configure middleware matchers
export const config = {
  matcher: [
    // Protected paths
    '/dashboard/:path*',
    // Public paths
    '/auth',
    '/',
    // Exclude Next.js internals
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
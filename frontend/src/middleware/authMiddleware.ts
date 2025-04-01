import { NextRequest, NextResponse } from 'next/server';
import config from '../utils/config';

/**
 * Authentication middleware for Next.js
 * Checks for a valid token and redirects unauthorized users 
 */
export function authMiddleware(request: NextRequest) {
  // Get token from cookies
  const token = request.cookies.get(config.auth.tokenKey)?.value;
  const { pathname } = request.nextUrl;

  // Define protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/admin',
  ];
  
  // Define authentication routes
  const authRoutes = [
    '/login',
    '/register',
    '/forgot-password',
  ];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => pathname === route);

  // Redirect to login if accessing a protected route without a token
  if (isProtectedRoute && !token) {
    const url = new URL(config.routes.login, request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if accessing auth routes with a valid token
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL(config.routes.dashboard, request.url));
  }

  // Continue with the request for all other cases
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public directory (public files)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
};
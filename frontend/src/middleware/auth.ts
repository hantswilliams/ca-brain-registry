import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedRequest extends NextRequest {
  user?: any;
}

export async function withAuth(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  try {
    // Check for JWT token in Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (token) {
      // We don't verify the token here - we'll let the backend /auth/me endpoint handle that
      // Just add a placeholder user to the request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = { authenticated: true };
      
      return handler(authenticatedReq);
    }
    
    // For certain read-only operations, we'll allow unauthenticated access
    // This is mainly for dashboard statistics and patient listings
    if (req.method === 'GET') {
      const url = new URL(req.url);
      // Allow read-only access to these paths without authentication
      if (url.pathname.startsWith('/patients') || 
          url.pathname.startsWith('/value-sets') ||
          url.pathname.includes('/health/')) {
        const authenticatedReq = req as AuthenticatedRequest;
        authenticatedReq.user = { role: 'guest' };
        return handler(authenticatedReq);
      }
    }
    
    // If we get here, the user is not authenticated
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Invalid token or session' }, { status: 401 });
  }
}
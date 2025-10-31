import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isDashboardPage = pathname === '/dashboard';
  const isAdminPage = pathname.startsWith('/admin');
  const isInstructorPage = pathname.startsWith('/instructor');

  // If there's no token
  if (!token) {
    if (isDashboardPage || isAdminPage || isInstructorPage) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  // If there is a token
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret) as { payload: { id: string; name: string, role?: string, status?: string } };

    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Redirect users from the generic dashboard to their specific one
    if (isDashboardPage) {
      if (payload.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
      if (payload.role === 'instructor') {
        return NextResponse.redirect(new URL('/instructor/dashboard', req.url));
      }
    }
    
    if (isAdminPage && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    if (isInstructorPage && payload.role !== 'instructor') {
      // Also deny pending instructors
      if (payload.status !== 'active') {
         return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();

  } catch (error) {
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('token');
    
    // Allow access to auth pages even with an invalid token, just clear it
    if(isAuthPage) {
        const res = NextResponse.next();
        res.cookies.delete('token');
        return res;
    }

    if (isDashboardPage || isAdminPage || isInstructorPage) {
        return response;
    }
    
    const res = NextResponse.next();
    res.cookies.delete('token');
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - and images in public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

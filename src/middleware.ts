import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ message: "Akses ditolak, token hilang" }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    const { payload } = await jwtVerify(token, secret);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('user-id', payload.userId as string);

    return NextResponse.next({
    request: { headers: requestHeaders },
    });
  } catch {
    return NextResponse.json({ message: "Token tidak valid atau expired" }, { status: 403 });
  }
}

export const config = {
  matcher: [
    '/api/profile/:path*', 
  ],
};
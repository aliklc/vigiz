import { type NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE, adminToken } from '@/lib/admin-auth';

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	if (pathname === '/host/login' || pathname === '/api/host/login') return NextResponse.next();

	if (request.cookies.get(ADMIN_COOKIE)?.value === (await adminToken()))
		return NextResponse.next();

	if (pathname.startsWith('/api/')) {
		return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
	}
	return NextResponse.redirect(new URL('/host/login', request.url));
}

export const config = {
	matcher: ['/host/:path*', '/api/host/:path*'],
};

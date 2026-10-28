import { NextResponse } from 'next/server';

import { ADMIN_COOKIE, adminToken } from '@/lib/admin-auth';

// Düz HTML form POST'u; JS'e bağımlı değil. Sonuç 303 yönlendirme.
export async function POST(request: Request) {
	const password = (await request.formData()).get('password');
	if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
		return NextResponse.redirect(new URL('/host/login?error=1', request.url), 303);
	}
	const res = NextResponse.redirect(new URL('/host', request.url), 303);
	res.cookies.set(ADMIN_COOKIE, await adminToken(), {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: 60 * 60 * 24 * 30,
	});
	return res;
}

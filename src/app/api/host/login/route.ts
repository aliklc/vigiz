import { NextResponse } from 'next/server';

import { ADMIN_COOKIE, adminToken } from '@/lib/admin-auth';

export async function POST(request: Request) {
	const { password } = await request.json().catch(() => ({}));
	if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
		return NextResponse.json({ error: 'Şifre yanlış' }, { status: 401 });
	}
	const res = NextResponse.json({ ok: true });
	res.cookies.set(ADMIN_COOKIE, await adminToken(), {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: 60 * 60 * 24 * 30,
	});
	return res;
}

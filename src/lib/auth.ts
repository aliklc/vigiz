import 'server-only';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

import { createAuthClient } from '@/lib/supabase/server';

export type Host = { id: string; email: string; name: string };

// Giriş yapmış host ya da null.
export async function getHost(): Promise<Host | null> {
	const supabase = await createAuthClient();
	const { data } = await supabase.auth.getClaims();
	const claims = data?.claims;
	if (!claims?.sub) return null;
	const email = String(claims.email ?? '');
	return { id: claims.sub, email, name: String(claims.user_metadata?.name ?? email) };
}

// Sayfalar için: giriş yoksa /login'e yönlendirir.
export async function requireHost(): Promise<Host> {
	const host = await getHost();
	if (!host) redirect('/login');
	return host;
}

export const unauthorized = () => NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
export const notFoundJson = (error = 'Bulunamadı') => NextResponse.json({ error }, { status: 404 });

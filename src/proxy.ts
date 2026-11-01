import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import { dicts, pickLocale } from '@/lib/i18n';

// Ana sayfanın dili URL'den: / Türkçe, /en İngilizce (tarayıcı dili ya da çerez değiştirmez).
// Diğer isteklerde Supabase oturumunu yeniler; /host ve /api/host için giriş zorunlu.
export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	if (pathname === '/' || pathname === '/en') {
		const headers = new Headers(request.headers);
		headers.set('x-locale', pathname === '/en' ? 'en' : 'tr');
		return NextResponse.next({ request: { headers } });
	}

	let response = NextResponse.next({ request });
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
		{
			cookies: {
				getAll: () => request.cookies.getAll(),
				setAll(list, headers) {
					for (const { name, value } of list) request.cookies.set(name, value);
					response = NextResponse.next({ request });
					for (const { name, value, options } of list)
						response.cookies.set(name, value, options);
					for (const [key, value] of Object.entries(headers ?? {}))
						response.headers.set(key, value);
				},
			},
		},
	);
	const { data } = await supabase.auth.getClaims();

	const isProtected = pathname.startsWith('/host') || pathname.startsWith('/api/host');
	if (isProtected && !data?.claims?.sub) {
		if (pathname.startsWith('/api/')) {
			const locale = pickLocale(
				request.cookies.get('lang')?.value,
				request.headers.get('accept-language'),
			);
			return NextResponse.json({ error: dicts[locale].api.unauthorized }, { status: 401 });
		}
		return NextResponse.redirect(new URL('/login', request.url));
	}
	return response;
}

export const config = {
	matcher: ['/', '/en', '/host/:path*', '/api/host/:path*'],
};

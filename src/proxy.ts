import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

// Supabase oturumunu her istekte yeniler; /host ve /api/host için giriş zorunlu.
export async function proxy(request: NextRequest) {
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

	const { pathname } = request.nextUrl;
	const isProtected = pathname.startsWith('/host') || pathname.startsWith('/api/host');
	if (isProtected && !data?.claims?.sub) {
		if (pathname.startsWith('/api/')) {
			return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
		}
		return NextResponse.redirect(new URL('/login', request.url));
	}
	return response;
}

export const config = {
	matcher: ['/host/:path*', '/api/host/:path*'],
};

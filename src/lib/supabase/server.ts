import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cookie tabanlı oturum; sadece kimlik doğrulama için. Veri erişimi admin.ts (db) ile yapılır.
export async function createAuthClient() {
	const store = await cookies();
	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
		{
			cookies: {
				getAll: () => store.getAll(),
				setAll(list) {
					// Server component'larda cookie yazılamaz; oturum yenilemeyi proxy.ts yapar.
					try {
						for (const { name, value, options } of list)
							store.set(name, value, options);
					} catch {}
				},
			},
		},
	);
}

import { NextResponse } from 'next/server';

import { createAuthClient } from '@/lib/supabase/server';

// Düz HTML form POST'u; sonuç 303 yönlendirme.
export async function POST(request: Request) {
	const form = await request.formData();
	const supabase = await createAuthClient();
	const { error } = await supabase.auth.signInWithPassword({
		email: String(form.get('email') ?? '').trim(),
		password: String(form.get('password') ?? ''),
	});
	const to = error ? '/login?error=1' : '/host';
	return NextResponse.redirect(new URL(to, request.url), 303);
}

import { NextResponse } from 'next/server';

import { createAuthClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
	const form = await request.formData();
	const name = String(form.get('name') ?? '').trim();
	const back = (error: string) =>
		NextResponse.redirect(new URL(`/register?error=${error}`, request.url), 303);
	if (!name) return back('name');

	const supabase = await createAuthClient();
	const { data, error } = await supabase.auth.signUp({
		email: String(form.get('email') ?? '').trim(),
		password: String(form.get('password') ?? ''),
		options: { data: { name } },
	});
	if (error) return back(error.code ?? 'unknown');
	// "Confirm email" açıksa oturum gelmez; kullanıcı e-postasını onaylamalı.
	const to = data.session ? '/host' : '/login?registered=1';
	return NextResponse.redirect(new URL(to, request.url), 303);
}

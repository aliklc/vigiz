import { NextResponse } from 'next/server';

import { makeCode } from '@/lib/game';
import { db } from '@/lib/supabase/admin';

// /host sayfasındaki "Oda aç" formu. Başarılıysa host ekranına yönlendirir.
export async function POST(request: Request) {
	const quizId = (await request.formData()).get('quizId');
	const { data: quiz } = await db
		.from('quizzes')
		.select('id, status')
		.eq('id', String(quizId))
		.maybeSingle();
	if (quiz?.status !== 'ready') {
		return NextResponse.json(
			{ error: 'Sadece hazır quizler için oda açılabilir' },
			{ status: 400 },
		);
	}

	// Kod çakışırsa (unique ihlali) yeni kodla tekrar dene.
	for (let i = 0; i < 5; i++) {
		const code = makeCode();
		const { error } = await db.from('games').insert({ quiz_id: quiz.id, code });
		if (!error) return NextResponse.redirect(new URL(`/host/games/${code}`, request.url), 303);
		if (error.code !== '23505') break;
	}
	return NextResponse.json({ error: 'Oda açılamadı' }, { status: 500 });
}

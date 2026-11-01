import 'server-only';
import { NextResponse } from 'next/server';

import { getDict } from '@/lib/locale';
import { makeQuizSchema } from '@/lib/quiz';
import { db } from '@/lib/supabase/admin';

// Yeni quiz (id null) ya da mevcut quiz (id dolu) kaydı. Güncelleme sadece sahibi için çalışır.
export async function saveQuiz(request: Request, id: string | null, ownerId: string) {
	const t = await getDict();
	const parsed = makeQuizSchema(t.quiz).safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
	}
	// Üretilen tip SQL parametrelerini null kabul etmiyor; p_id null = yeni quiz.
	const p_id = id as string;
	const { data, error } = await db.rpc('save_quiz', {
		p_id,
		p_owner: ownerId,
		p_quiz: parsed.data,
	});
	// Sadece bilinen hatalar kullanıcıya anlatılır; Postgres iç mesajları gitmez.
	// save_quiz'in mesajları Türkçe; kullanıcıya hata koduna göre kendi dilinde gider.
	if (error?.code === 'P0001')
		return NextResponse.json({ error: t.api.quizPlayed }, { status: 409 });
	if (error?.code === 'P0002')
		return NextResponse.json({ error: t.api.quizNotFound }, { status: 404 });
	if (error) return NextResponse.json({ error: t.api.saveFailed }, { status: 500 });
	return NextResponse.json({ id: data });
}

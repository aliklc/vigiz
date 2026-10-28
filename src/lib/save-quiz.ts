import 'server-only';
import { NextResponse } from 'next/server';

import { quizSchema } from '@/lib/quiz';
import { db } from '@/lib/supabase/admin';

// Yeni quiz (id null) ya da mevcut quiz (id dolu) kaydı.
export async function saveQuiz(request: Request, id: string | null) {
	const parsed = quizSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
	}
	// Üretilen tip SQL parametrelerini null kabul etmiyor; p_id null = yeni quiz.
	const p_id = id as string;
	const { data, error } = await db.rpc('save_quiz', { p_id, p_quiz: parsed.data });
	if (error) {
		const status = error.code === 'P0001' ? 409 : 500;
		return NextResponse.json({ error: error.message }, { status });
	}
	return NextResponse.json({ id: data });
}

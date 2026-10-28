import { NextResponse } from 'next/server';

import { getHost, notFoundJson, unauthorized } from '@/lib/auth';
import { saveQuiz } from '@/lib/save-quiz';
import { db } from '@/lib/supabase/admin';

export async function PUT(request: Request, ctx: RouteContext<'/api/host/quizzes/[id]'>) {
	const host = await getHost();
	if (!host) return unauthorized();
	return saveQuiz(request, (await ctx.params).id, host.id);
}

export async function DELETE(_: Request, ctx: RouteContext<'/api/host/quizzes/[id]'>) {
	const host = await getHost();
	if (!host) return unauthorized();
	const { id } = await ctx.params;

	const { data: quiz } = await db
		.from('quizzes')
		.select('id, games(phase)')
		.eq('id', id)
		.eq('owner_id', host.id)
		.maybeSingle();
	if (!quiz) return notFoundJson('Quiz bulunamadı');
	// Oynanmış quizin sonuçları arşivde durur; quiz silinirse onlar da gider.
	if (quiz.games.some(g => g.phase !== 'lobby')) {
		return NextResponse.json(
			{ error: 'Bu quiz oynandığı için silinemez (arşivde duruyor).' },
			{ status: 409 },
		);
	}
	const { error } = await db.from('quizzes').delete().eq('id', id).eq('owner_id', host.id);
	if (error) return NextResponse.json({ error: 'Silinemedi' }, { status: 500 });
	return NextResponse.json({ ok: true });
}

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

	// Oyunları, oyuncuları ve cevapları da cascade ile silinir (editör onay sorar).
	const { data: deleted, error } = await db
		.from('quizzes')
		.delete()
		.eq('id', id)
		.eq('owner_id', host.id)
		.select('id');
	if (error) return NextResponse.json({ error: 'Silinemedi' }, { status: 500 });
	if (!deleted.length) return notFoundJson('Quiz bulunamadı');
	return NextResponse.json({ ok: true });
}

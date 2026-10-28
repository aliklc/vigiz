import { NextResponse } from 'next/server';

import { saveQuiz } from '@/lib/save-quiz';
import { db } from '@/lib/supabase/admin';

export async function PUT(request: Request, ctx: RouteContext<'/api/host/quizzes/[id]'>) {
	const { id } = await ctx.params;
	return saveQuiz(request, id);
}

export async function DELETE(_: Request, ctx: RouteContext<'/api/host/quizzes/[id]'>) {
	const { id } = await ctx.params;
	await db.from('games').delete().eq('quiz_id', id).eq('phase', 'lobby');
	const { error } = await db.from('quizzes').delete().eq('id', id);
	if (error) {
		return NextResponse.json(
			{ error: 'Bu quiz oynandığı için silinemez (arşivde duruyor).' },
			{ status: 409 },
		);
	}
	return NextResponse.json({ ok: true });
}

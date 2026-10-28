import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getHost, unauthorized } from '@/lib/auth';
import { type Game, getOwnedGame } from '@/lib/game';
import { db } from '@/lib/supabase/admin';
import type { TablesUpdate } from '@/lib/supabase/types';

const actionSchema = z.object({ action: z.enum(['start', 'next', 'pause', 'resume', 'end']) });

function nextUpdate(game: Game, action: z.infer<typeof actionSchema>['action']) {
	const now = new Date().toISOString();
	const nextQuestion = (index: number): TablesUpdate<'games'> => ({
		phase: 'question',
		current_index: index,
		question_started_at: now,
		paused_at: null,
	});

	if (action === 'start' && game.phase === 'lobby' && game.questionCount > 0) {
		return nextQuestion(0);
	}
	if (action === 'next' && game.phase === 'reveal') return { phase: 'leaderboard' };
	if (action === 'next' && game.phase === 'leaderboard') {
		return game.current_index >= game.questionCount - 1
			? { phase: 'finished', finished_at: now }
			: nextQuestion(game.current_index + 1);
	}
	// Oyunu erken bitir: o ana kadarki puanlarla final ekranına geç.
	if (action === 'end' && ['question', 'reveal', 'leaderboard'].includes(game.phase)) {
		return { phase: 'finished', finished_at: now, paused_at: null };
	}
	if (action === 'pause' && game.phase === 'question' && !game.paused_at) {
		return { paused_at: now };
	}
	if (action === 'resume' && game.phase === 'question' && game.paused_at) {
		// Duraklatılan süre kadar başlangıcı ileri kaydır: kalan süre kaldığı yerden devam eder.
		const pausedMs = Date.now() - Date.parse(game.paused_at);
		const started = Date.parse(game.question_started_at ?? now) + pausedMs;
		return { paused_at: null, question_started_at: new Date(started).toISOString() };
	}
	return null;
}

export async function POST(request: Request, ctx: RouteContext<'/api/host/games/[code]/action'>) {
	const host = await getHost();
	if (!host) return unauthorized();
	const game = await getOwnedGame((await ctx.params).code, host.id);
	if (!game) return NextResponse.json({ error: 'Oda bulunamadı' }, { status: 404 });

	const parsed = actionSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });

	const update = nextUpdate(game, parsed.data.action);
	if (!update) return NextResponse.json({ ok: true, changed: false });

	// Okuduğumuz duruma göre koşullu update: çift tıklama iki kez ilerletmez.
	let query = db
		.from('games')
		.update(update)
		.eq('id', game.id)
		.eq('phase', game.phase)
		.eq('current_index', game.current_index);
	query = game.paused_at ? query.eq('paused_at', game.paused_at) : query.is('paused_at', null);
	const { error } = await query;
	if (error) return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
	return NextResponse.json({ ok: true, changed: true });
}

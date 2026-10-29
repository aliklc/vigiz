import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getHost, unauthorized } from '@/lib/auth';
import { type Game, getCurrentQuestion, getOwnedGame } from '@/lib/game';
import { WRONG_BUZZ_POINTS } from '@/lib/scoring';
import { db } from '@/lib/supabase/admin';
import type { TablesUpdate } from '@/lib/supabase/types';

const actionSchema = z.object({
	action: z.enum(['start', 'next', 'pause', 'resume', 'end', 'reveal', 'judge', 'cancel']),
	verdict: z.enum(['correct', 'wrong']).optional(), // judge: buzzer sırasındakine karar
});

async function nextUpdate(
	game: Game,
	action: z.infer<typeof actionSchema>['action'],
): Promise<TablesUpdate<'games'> | null> {
	const now = new Date().toISOString();
	// Videolu soruda süre klip bitince başlar: başlangıç klip süresi kadar ileri alınır.
	const nextQuestion = async (index: number): Promise<TablesUpdate<'games'>> => {
		const { data: q } = await db
			.from('questions')
			.select('video_id, video_start, video_cut')
			.eq('quiz_id', game.quiz_id)
			.order('position')
			.range(index, index)
			.maybeSingle();
		const clipMs = q?.video_id ? ((q.video_cut ?? 0) - (q.video_start ?? 0)) * 1000 : 0;
		return {
			phase: 'question',
			current_index: index,
			question_started_at: new Date(Date.parse(now) + clipMs).toISOString(),
			paused_at: null,
		};
	};

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
	// "Cevabı göster": host soruyu erken bitirir (buzzer'da kimse bilemezse).
	if (action === 'reveal' && game.phase === 'question')
		return { phase: 'reveal', paused_at: null };
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

	// Lobide odayı iptal et: oyun (ve cascade ile oyuncular) silinir. Başlamış oyun silinmez.
	if (parsed.data.action === 'cancel') {
		const { data: gone } = await db
			.from('games')
			.delete()
			.eq('id', game.id)
			.eq('phase', 'lobby')
			.select('id');
		return NextResponse.json({ ok: true, changed: !!gone?.length });
	}

	if (parsed.data.action === 'judge') {
		if (!parsed.data.verdict)
			return NextResponse.json({ error: 'Karar eksik' }, { status: 400 });
		return judge(game, parsed.data.verdict);
	}

	const update = await nextUpdate(game, parsed.data.action);
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

// Buzzer: kuyruktaki ilk bekleyen için host'un kararı.
// Doğru → puanı yazılır, soru cevap ekranına geçer. Yanlış → eksi puan; kuyrukta kimse
// kalmadıysa görsel kaldığı yerden netleşmeye devam eder.
async function judge(game: Game, verdict: 'correct' | 'wrong') {
	if (game.phase !== 'question') return NextResponse.json({ ok: true, changed: false });
	const question = await getCurrentQuestion(game);
	if (question?.type !== 'buzzer') {
		return NextResponse.json({ error: 'Bu soru buzzer sorusu değil' }, { status: 400 });
	}
	const { data: pending } = await db
		.from('buzzes')
		.select('player_id, buzzed_at, points_if_correct')
		.eq('game_id', game.id)
		.eq('question_id', question.id)
		.is('verdict', null)
		.order('buzzed_at');
	const first = pending?.[0];
	if (!first) return NextResponse.json({ ok: true, changed: false });

	// Koşullu: çift tıklama aynı kişiye iki kez karar vermez.
	const { data: decided } = await db
		.from('buzzes')
		.update({ verdict })
		.eq('player_id', first.player_id)
		.eq('question_id', question.id)
		.is('verdict', null)
		.select('player_id');
	if (!decided?.length) return NextResponse.json({ ok: true, changed: false });

	await db.from('answers').insert({
		game_id: game.id,
		player_id: first.player_id,
		question_id: question.id,
		choice_index: null,
		points: verdict === 'correct' ? first.points_if_correct : WRONG_BUZZ_POINTS,
		answered_at: first.buzzed_at,
	});

	if (verdict === 'correct') {
		await db
			.from('games')
			.update({ phase: 'reveal', paused_at: null })
			.eq('id', game.id)
			.eq('phase', 'question')
			.eq('current_index', game.current_index);
	} else if (pending.length === 1 && game.paused_at) {
		// Kuyruk boşaldı: donma kalkar, kalan süre kaldığı yerden devam eder.
		const pausedMs = Date.now() - Date.parse(game.paused_at);
		const started = Date.parse(game.question_started_at ?? '') + pausedMs;
		await db
			.from('games')
			.update({ paused_at: null, question_started_at: new Date(started).toISOString() })
			.eq('id', game.id)
			.eq('phase', 'question')
			.eq('paused_at', game.paused_at);
	}
	return NextResponse.json({ ok: true, changed: true });
}

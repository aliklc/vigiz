import { NextResponse } from 'next/server';
import { z } from 'zod';

import { deadlineOf, getCurrentQuestion, getGame, playerIdByToken } from '@/lib/game';
import { getDict } from '@/lib/locale';
import { buzzerPoints } from '@/lib/scoring';
import { db } from '@/lib/supabase/admin';

const buzzSchema = z.object({ token: z.uuid() });

// Bulanık görsel: oyuncu "BİLDİM!"e basar. Sıra basış zamanına göre; soru başına tek hak.
// Doğruysa alacağı puan basış anında hesaplanır (görsel ne kadar bulanıksa o kadar çok).
export async function POST(request: Request, ctx: RouteContext<'/api/games/[code]/buzz'>) {
	const t = (await getDict()).api;
	const now = Date.now();
	const game = await getGame((await ctx.params).code);
	if (!game) return NextResponse.json({ error: t.roomNotFound }, { status: 404 });

	const parsed = buzzSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return NextResponse.json({ error: t.badRequest }, { status: 400 });

	if (game.phase !== 'question') {
		return NextResponse.json({ error: t.questionEnded }, { status: 409 });
	}
	// Donmuşken (biri cevap veriyor) de basılabilir: kuyruğa eklenir. Kalan süre donma anına göre.
	const remainingMs = deadlineOf(game) - (game.paused_at ? Date.parse(game.paused_at) : now);
	if (remainingMs <= 0) return NextResponse.json({ error: t.timeUp }, { status: 409 });

	const [question, playerId] = await Promise.all([
		getCurrentQuestion(game),
		playerIdByToken(game.id, parsed.data.token),
	]);
	if (question?.type !== 'buzzer') {
		return NextResponse.json({ error: t.notBuzzer }, { status: 400 });
	}
	if (!playerId) return NextResponse.json({ error: t.notInRoom }, { status: 403 });

	const { error } = await db.from('buzzes').insert({
		game_id: game.id,
		question_id: question.id,
		player_id: playerId,
		buzzed_at: new Date(now).toISOString(),
		points_if_correct: buzzerPoints(remainingMs, game.limitMs),
	});
	if (error?.code === '23505') {
		return NextResponse.json({ error: t.alreadyBuzzed }, { status: 409 });
	}
	if (error) return NextResponse.json({ error: t.buzzFailed }, { status: 500 });

	// İlk basış görseli herkes için dondurur; host karar verene kadar netleşme durur.
	await db
		.from('games')
		.update({ paused_at: new Date(now).toISOString() })
		.eq('id', game.id)
		.eq('phase', 'question')
		.eq('current_index', game.current_index)
		.is('paused_at', null);
	return NextResponse.json({ ok: true });
}

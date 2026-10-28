import { NextResponse } from 'next/server';
import { z } from 'zod';

import { deadlineOf, getCurrentQuestion, getGame, playerIdByToken } from '@/lib/game';
import { buzzerPoints } from '@/lib/scoring';
import { db } from '@/lib/supabase/admin';

const buzzSchema = z.object({ token: z.uuid() });

// Bulanık görsel: oyuncu "BİLDİM!"e basar. Sıra basış zamanına göre; soru başına tek hak.
// Doğruysa alacağı puan basış anında hesaplanır (görsel ne kadar bulanıksa o kadar çok).
export async function POST(request: Request, ctx: RouteContext<'/api/games/[code]/buzz'>) {
	const now = Date.now();
	const game = await getGame((await ctx.params).code);
	if (!game) return NextResponse.json({ error: 'Oda bulunamadı' }, { status: 404 });

	const parsed = buzzSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });

	if (game.phase !== 'question') {
		return NextResponse.json({ error: 'Bu soru bitti' }, { status: 409 });
	}
	// Donmuşken (biri cevap veriyor) de basılabilir: kuyruğa eklenir. Kalan süre donma anına göre.
	const remainingMs = deadlineOf(game) - (game.paused_at ? Date.parse(game.paused_at) : now);
	if (remainingMs <= 0) return NextResponse.json({ error: 'Süre doldu' }, { status: 409 });

	const [question, playerId] = await Promise.all([
		getCurrentQuestion(game),
		playerIdByToken(game.id, parsed.data.token),
	]);
	if (question?.type !== 'buzzer') {
		return NextResponse.json({ error: 'Bu soru buzzer sorusu değil' }, { status: 400 });
	}
	if (!playerId) return NextResponse.json({ error: 'Bu odada değilsin' }, { status: 403 });

	const { error } = await db.from('buzzes').insert({
		game_id: game.id,
		question_id: question.id,
		player_id: playerId,
		buzzed_at: new Date(now).toISOString(),
		points_if_correct: buzzerPoints(remainingMs, game.limitMs),
	});
	if (error?.code === '23505') {
		return NextResponse.json({ error: 'Bu soruda zaten bastın' }, { status: 409 });
	}
	if (error) return NextResponse.json({ error: 'Basılamadı' }, { status: 500 });

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

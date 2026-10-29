import { NextResponse } from 'next/server';
import { z } from 'zod';

import { deadlineOf, getCurrentQuestion, getGame, maybeReveal, playerIdByToken } from '@/lib/game';
import { calcPoints, GRACE_MS } from '@/lib/scoring';
import { db } from '@/lib/supabase/admin';

const answerSchema = z.object({ token: z.uuid(), choiceIndex: z.number().int().min(0) });

// Cevap kesindir: aynı soruya ikinci cevap reddedilir (answers PK: player_id + question_id).
export async function POST(request: Request, ctx: RouteContext<'/api/games/[code]/answer'>) {
	const now = Date.now();
	const game = await getGame((await ctx.params).code);
	if (!game) return NextResponse.json({ error: 'Oda bulunamadı' }, { status: 404 });

	const parsed = answerSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
	const { token, choiceIndex } = parsed.data;

	if (game.phase !== 'question') {
		return NextResponse.json({ error: 'Bu soru için süre doldu' }, { status: 409 });
	}
	if (game.paused_at) return NextResponse.json({ error: 'Oyun duraklatıldı' }, { status: 409 });
	const remainingMs = deadlineOf(game) - now;
	if (remainingMs < -GRACE_MS) {
		return NextResponse.json({ error: 'Süre doldu' }, { status: 409 });
	}
	// Videolu soru: süre klip bitince başlar, o ana kadar cevap alınmaz.
	if (remainingMs > game.limitMs) {
		return NextResponse.json({ error: 'Video bitmeden cevap verilemez' }, { status: 409 });
	}

	const [question, playerId] = await Promise.all([
		getCurrentQuestion(game),
		playerIdByToken(game.id, token),
	]);
	if (!question || question.type === 'buzzer' || choiceIndex >= question.choices.length) {
		return NextResponse.json({ error: 'Geçersiz şık' }, { status: 400 });
	}
	if (!playerId) return NextResponse.json({ error: 'Bu odada değilsin' }, { status: 403 });

	// shortcut: kontrol ile yazma arasında reveal'a geçilirse cevap yine kaydedilir (ms'lik pencere);
	// sorun olursa kontrol + upsert tek bir SQL fonksiyonuna taşınır.
	const { error } = await db.from('answers').insert({
		game_id: game.id,
		player_id: playerId,
		question_id: question.id,
		choice_index: choiceIndex,
		points: calcPoints(choiceIndex === question.correct_index, remainingMs, game.limitMs),
		answered_at: new Date(now).toISOString(),
	});
	if (error?.code === '23505') {
		return NextResponse.json({ error: 'Bu soruyu zaten cevapladın' }, { status: 409 });
	}
	if (error) return NextResponse.json({ error: 'Cevap kaydedilemedi' }, { status: 500 });

	await maybeReveal(game, question);
	return NextResponse.json({ ok: true });
}

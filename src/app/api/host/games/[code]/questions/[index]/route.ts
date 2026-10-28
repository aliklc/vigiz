import { NextResponse } from 'next/server';

import { getHost, notFoundJson, unauthorized } from '@/lib/auth';
import { getOwnedGame } from '@/lib/game';
import { db } from '@/lib/supabase/admin';

// Host ekranındaki "Önceki soru" görüntüleyicisi. Oyun durumunu değiştirmez.
// Sadece daha önce sorulmuş sorular döner (sıradaki sorular yanlışlıkla projeksiyona çıkmasın).
export async function GET(
	_: Request,
	ctx: RouteContext<'/api/host/games/[code]/questions/[index]'>,
) {
	const host = await getHost();
	if (!host) return unauthorized();
	const { code, index: raw } = await ctx.params;
	const game = await getOwnedGame(code, host.id);
	if (!game) return notFoundJson('Oda bulunamadı');

	const index = Number(raw);
	// Mevcut soru, ancak cevabı gösterildikten sonra görüntülenebilir.
	const revealed = ['reveal', 'leaderboard', 'finished'].includes(game.phase);
	const last = revealed ? game.current_index : game.current_index - 1;
	if (!Number.isInteger(index) || index < 0 || index > last) {
		return notFoundJson('Bu soru henüz sorulmadı');
	}
	const { data: q } = await db
		.from('questions')
		.select('id, type, text, image_url, explanation, choices, correct_index')
		.eq('quiz_id', game.quiz_id)
		.order('position')
		.range(index, index)
		.maybeSingle();
	if (!q) return notFoundJson('Soru bulunamadı');

	const { data: answers } = await db
		.from('answers')
		.select('choice_index')
		.eq('game_id', game.id)
		.eq('question_id', q.id);
	return NextResponse.json({
		index,
		type: q.type,
		text: q.text,
		imageUrl: q.image_url,
		choices: q.choices,
		correctIndex: q.correct_index,
		explanation: q.explanation,
		counts: q.choices.map((_, i) => answers?.filter(a => a.choice_index === i).length ?? 0),
	});
}

import 'server-only';

import type { GameState, Phase } from '@/lib/game-types';
import { db } from '@/lib/supabase/admin';

// Karışabilecek karakterler (0/O, 1/I) yok.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeCode(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(6));
	return Array.from(bytes, b => CODE_CHARS[b % CODE_CHARS.length]).join('');
}

export async function getGame(code: string) {
	const { data } = await db
		.from('games')
		.select(
			'id, code, phase, current_index, question_started_at, paused_at, quiz_id, quizzes(title, topic, author_name, time_limit_sec, questions(count))',
		)
		.eq('code', code.toUpperCase())
		.maybeSingle();
	return data;
}

export async function buildState(code: string, playerId: string | null): Promise<GameState | null> {
	const game = await getGame(code);
	if (!game?.quizzes) return null;
	const quiz = game.quizzes;

	const { data: players } = await db
		.from('players')
		.select('id, name, kicked')
		.eq('game_id', game.id)
		.order('joined_at');
	const me = players?.find(p => p.id === playerId) ?? null;

	return {
		serverNow: Date.now(),
		game: {
			id: game.id,
			code: game.code,
			phase: game.phase as Phase,
			currentIndex: game.current_index,
			questionCount: quiz.questions[0]?.count ?? 0,
			timeLimitSec: quiz.time_limit_sec,
		},
		quiz: { title: quiz.title, topic: quiz.topic, authorName: quiz.author_name },
		players: (players ?? []).filter(p => !p.kicked).map(({ id, name }) => ({ id, name })),
		me,
	};
}

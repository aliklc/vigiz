import 'server-only';

import type { GameState, Phase } from '@/lib/game-types';
import { GRACE_MS } from '@/lib/scoring';
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
	if (!data?.quizzes) return null;
	const quiz = data.quizzes;
	return {
		...data,
		phase: data.phase as Phase,
		quiz,
		limitMs: quiz.time_limit_sec * 1000,
		questionCount: quiz.questions[0]?.count ?? 0,
	};
}

export type Game = NonNullable<Awaited<ReturnType<typeof getGame>>>;

// Duraklatma süresi question_started_at ileri kaydırılarak düşülür.
export function deadlineOf(game: Game): number {
	return Date.parse(game.question_started_at ?? '') + game.limitMs;
}

export async function getCurrentQuestion(game: Game) {
	const { data } = await db
		.from('questions')
		.select('id, text, image_url, explanation, choices, correct_index')
		.eq('quiz_id', game.quiz_id)
		.order('position')
		.range(game.current_index, game.current_index)
		.maybeSingle();
	return data;
}

// Süre dolduysa ya da herkes cevapladıysa question → reveal. Koşullu update sayesinde
// aynı anda gelen istekler arasında yalnızca biri geçişi yapar.
export async function maybeReveal(game: Game, questionId: string): Promise<boolean> {
	if (game.phase !== 'question' || game.paused_at) return false;
	let due = Date.now() > deadlineOf(game) + GRACE_MS;
	if (!due) {
		const [{ count: players }, { count: answers }] = await Promise.all([
			db.from('players').select('*', { count: 'exact', head: true }).eq('game_id', game.id),
			db
				.from('answers')
				.select('*', { count: 'exact', head: true })
				.eq('question_id', questionId)
				.eq('game_id', game.id),
		]);
		due = !!players && answers === players;
	}
	if (!due) return false;
	await db
		.from('games')
		.update({ phase: 'reveal' })
		.eq('id', game.id)
		.eq('phase', 'question')
		.eq('current_index', game.current_index);
	return true;
}

export async function buildState(code: string, playerId: string | null): Promise<GameState | null> {
	let game = await getGame(code);
	if (!game) return null;

	const showsQuestion = game.phase === 'question' || game.phase === 'reveal';
	const current = showsQuestion ? await getCurrentQuestion(game) : null;
	if (current && (await maybeReveal(game, current.id))) {
		game = (await getGame(code)) as Game;
	}

	// Birbirinden bağımsız sorgular paralel: her biri veritabanına ayrı bir gidiş-dönüş.
	const [{ data: players }, { data: answers }, { data: scores }] = await Promise.all([
		db.from('players').select('id, name').eq('game_id', game.id).order('joined_at'),
		current
			? db
					.from('answers')
					.select('player_id, choice_index, points')
					.eq('question_id', current.id)
					.eq('game_id', game.id)
			: { data: null },
		game.phase === 'leaderboard' || game.phase === 'finished'
			? db
					.from('game_scores')
					.select('player_id, name, score')
					.eq('game_id', game.id)
					.order('score', { ascending: false })
					.order('name')
			: { data: null },
	]);
	const me = players?.find(p => p.id === playerId) ?? null;

	const state: GameState = {
		serverNow: Date.now(),
		game: {
			id: game.id,
			code: game.code,
			phase: game.phase,
			currentIndex: game.current_index,
			questionCount: game.questionCount,
			timeLimitSec: game.quiz.time_limit_sec,
		},
		quiz: { title: game.quiz.title, topic: game.quiz.topic, authorName: game.quiz.author_name },
		players: players ?? [],
		me,
		question: null,
		reveal: null,
		scores: null,
	};

	if (current && (game.phase === 'question' || game.phase === 'reveal')) {
		const mine = answers?.find(a => a.player_id === playerId);
		state.question = {
			text: current.text,
			imageUrl: current.image_url,
			choices: current.choices,
			deadline: deadlineOf(game),
			pausedAt: game.paused_at ? Date.parse(game.paused_at) : null,
			answeredCount: answers?.length ?? 0,
			myChoice: mine?.choice_index ?? null,
		};
		if (game.phase === 'reveal') {
			state.reveal = {
				correctIndex: current.correct_index,
				counts: current.choices.map(
					(_, i) => answers?.filter(a => a.choice_index === i).length ?? 0,
				),
				explanation: current.explanation,
				myPoints: mine ? mine.points : null,
			};
		}
	}

	if (scores) {
		state.scores = scores.map(s => ({
			id: s.player_id ?? '',
			name: s.name ?? '',
			score: s.score ?? 0,
		}));
	}

	return state;
}

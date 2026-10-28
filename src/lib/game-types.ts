export type Phase = 'lobby' | 'question' | 'reveal' | 'leaderboard' | 'finished';

export type GameState = {
	serverNow: number;
	game: {
		id: string;
		code: string;
		phase: Phase;
		currentIndex: number;
		questionCount: number;
		timeLimitSec: number;
	};
	quiz: { title: string; topic: string; authorName: string };
	players: { id: string; name: string }[];
	me: { id: string; name: string } | null;
};

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
	// question / reveal fazlarında
	question: {
		text: string;
		imageUrl: string | null;
		choices: string[];
		deadline: number;
		pausedAt: number | null;
		answeredCount: number;
		myChoice: number | null;
	} | null;
	// sadece reveal fazında: doğru cevap burada ilk kez tarayıcıya gider
	reveal: {
		correctIndex: number;
		counts: number[];
		explanation: string | null;
		myPoints: number | null;
	} | null;
	// leaderboard / finished fazlarında: tüm oyuncular, puana göre sıralı
	scores: { id: string; name: string; score: number }[] | null;
};

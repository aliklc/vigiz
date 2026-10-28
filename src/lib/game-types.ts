import type { QuestionType } from '@/lib/quiz';

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
		type: QuestionType;
		text: string;
		imageUrl: string | null;
		choices: string[];
		deadline: number;
		pausedAt: number | null;
		answeredCount: number;
		myChoice: number | null;
		// buzzer: 0 (en bulanık) … 10 (net); görsel /api/games/[code]/image'dan
		blurLevel?: number;
	} | null;
	// sadece reveal fazında: doğru cevap burada ilk kez tarayıcıya gider
	reveal: {
		correctIndex: number;
		counts: number[];
		explanation: string | null;
		myPoints: number | null;
		// buzzer: doğru cevap ve bilen kişi
		answerText?: string | null;
		winner?: { name: string; points: number } | null;
	} | null;
	// leaderboard / finished fazlarında: tüm oyuncular, puana göre sıralı
	// gained: sıralama fazında son sorudan kazanılan puan (animasyon için)
	// streak: üst üste doğru (2+ ise); fastest: bu turun en hızlısı (sadece sıralama fazında)
	scores:
		| {
				id: string;
				name: string;
				score: number;
				gained?: number;
				streak?: number;
				fastest?: boolean;
		  }[]
		| null;
	// buzzer sorusunda basış sırası (verdict: host'un kararı, null = bekliyor)
	buzzer: { queue: { id: string; name: string; verdict: 'correct' | 'wrong' | null }[] } | null;
};

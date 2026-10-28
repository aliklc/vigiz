export type AnswerRow = {
	playerId: string;
	position: number; // sorunun quizdeki sırası (0'dan)
	correct: boolean;
	answeredAt: string;
};

// Seri: currentIndex'ten geriye doğru üst üste doğru cevap sayısı (yanlış ya da boş seriyi bitirir).
// Buzzer sorularında sadece biri bilebildiği için basmamak seriyi bozmaz (atlanır); yanlış basış bozar.
// En hızlı: currentIndex'teki soruyu doğru bilenler arasında en erken cevaplayan.
export function computeBadges(
	answers: AnswerRow[],
	currentIndex: number,
	buzzerPositions: Set<number> = new Set(),
) {
	const status = new Map(answers.map(a => [`${a.playerId}:${a.position}`, a.correct]));
	const streaks = new Map<string, number>();
	for (const playerId of new Set(answers.map(a => a.playerId))) {
		let streak = 0;
		for (let p = currentIndex; p >= 0; p--) {
			const correct = status.get(`${playerId}:${p}`);
			if (correct === undefined && buzzerPositions.has(p)) continue;
			if (!correct) break;
			streak++;
		}
		streaks.set(playerId, streak);
	}

	let fastestId: string | null = null;
	let fastestAt = Number.POSITIVE_INFINITY;
	for (const a of answers) {
		const at = Date.parse(a.answeredAt);
		if (a.correct && a.position === currentIndex && at < fastestAt) {
			fastestAt = at;
			fastestId = a.playerId;
		}
	}
	return { streaks, fastestId };
}

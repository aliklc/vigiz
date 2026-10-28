import assert from 'node:assert/strict';
import { test } from 'node:test';

import { type AnswerRow, computeBadges } from './badges.ts';

const at = (s: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, s)).toISOString();
const row = (playerId: string, position: number, correct: boolean, s = 0): AnswerRow => ({
	playerId,
	position,
	correct,
	answeredAt: at(s),
});

test('seri: üst üste doğrular sayılır, yanlış ya da boş cevap seriyi bitirir', () => {
	const { streaks } = computeBadges(
		[
			row('a', 0, true),
			row('a', 1, true),
			row('a', 2, true), // 3
			row('b', 0, true),
			row('b', 1, false),
			row('b', 2, true), // yanlış araya girdi → 1
			row('c', 0, true),
			row('c', 1, true), // 2. soruyu boş bıraktı → 0
			row('d', 1, true),
			row('d', 2, true), // sonradan katıldı → 2
		],
		2,
	);
	assert.deepEqual([...streaks].sort(), [
		['a', 3],
		['b', 1],
		['c', 0],
		['d', 2],
	]);
});

test('en hızlı: mevcut soruyu doğru bilenler arasında en erken cevaplayan', () => {
	const { fastestId } = computeBadges(
		[row('a', 1, true, 9), row('b', 1, false, 1), row('c', 1, true, 4), row('d', 0, true, 0)],
		1,
	);
	assert.equal(fastestId, 'c');
});

test('en hızlı: kimse doğru bilmediyse yok', () => {
	assert.equal(computeBadges([row('a', 0, false, 1)], 0).fastestId, null);
});

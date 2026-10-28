import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calcPoints } from './scoring.ts';

test('yanlış cevap 0 puan', () => {
	assert.equal(calcPoints(false, 20_000, 20_000), 0);
});

test('doğru cevap: 500 taban + kalan süreyle orantılı en fazla 300', () => {
	assert.equal(calcPoints(true, 20_000, 20_000), 800);
	assert.equal(calcPoints(true, 10_000, 20_000), 650);
	assert.equal(calcPoints(true, 0, 20_000), 500);
});

test('tolerans içinde süre aşımı ve saat kayması sınırlanır', () => {
	assert.equal(calcPoints(true, -200, 20_000), 500);
	assert.equal(calcPoints(true, 25_000, 20_000), 800);
});

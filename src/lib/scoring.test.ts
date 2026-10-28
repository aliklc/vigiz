import assert from 'node:assert/strict';
import { test } from 'node:test';

import { blurLevel, buzzerPoints, calcPoints } from './scoring.ts';

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

test('buzzer: erken basan 1000, sona doğru 500; sınır dışı değerler sınırlanır', () => {
	assert.equal(buzzerPoints(30_000, 30_000), 1000);
	assert.equal(buzzerPoints(15_000, 30_000), 750);
	assert.equal(buzzerPoints(0, 30_000), 500);
	assert.equal(buzzerPoints(-500, 30_000), 500);
});

test('bulanıklık seviyesi: başta 0, yarıda 5, süre bitince 10 (net)', () => {
	assert.equal(blurLevel(30_000, 30_000), 0);
	assert.equal(blurLevel(15_000, 30_000), 5);
	assert.equal(blurLevel(0, 30_000), 10);
	assert.equal(blurLevel(-1_000, 30_000), 10);
});

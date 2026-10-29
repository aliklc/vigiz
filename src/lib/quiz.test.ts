import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseTime, questionSchema, youtubeId } from './quiz.ts';

test('youtubeId: link biçimleri ve geçersiz girdi', () => {
	const id = 'dQw4w9WgXcQ';
	assert.equal(youtubeId(`https://www.youtube.com/watch?v=${id}&t=42s`), id);
	assert.equal(youtubeId(`https://youtu.be/${id}?si=abc`), id);
	assert.equal(youtubeId(`https://youtube.com/shorts/${id}`), id);
	assert.equal(youtubeId(`https://m.youtube.com/watch?v=${id}`), id);
	assert.equal(youtubeId(id), id);
	assert.equal(youtubeId('https://vimeo.com/123'), null);
	assert.equal(youtubeId('merhaba'), null);
});

test('parseTime: saniye, dk:sn, sa:dk:sn', () => {
	assert.equal(parseTime('75'), 75);
	assert.equal(parseTime('1:15'), 75);
	assert.equal(parseTime('0:01:15'), 75);
	assert.equal(parseTime('1:x'), null);
	assert.equal(parseTime(''), null);
});

test('video: buzzer sorusunda silinir, duruş başlangıçtan sonra olmalı', () => {
	const base = { text: 'Sonra ne oldu?', image_url: null, explanation: null, correct_index: 0 };
	const video = { video_id: 'dQw4w9WgXcQ', video_start: 10, video_cut: 20 };
	const buzzer = questionSchema.parse({ ...base, ...video, type: 'buzzer', choices: [] });
	assert.equal(buzzer.video_id, null);
	assert.equal(
		questionSchema.safeParse({ ...base, ...video, video_cut: 5, choices: ['a', 'b'] }).success,
		false,
	);
	const ok = questionSchema.parse({ ...base, ...video, type: 'truefalse', choices: [] });
	assert.deepEqual([ok.video_start, ok.video_cut, ok.video_end], [10, 20, null]);
});

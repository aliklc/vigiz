// Uçtan uca oyun testi: çalışan bir sunucuya karşı tüm oyun akışını oynatır.
// Kendi test quizini/odasını oluşturur ve sonunda siler. Süresi ~1 dk.
// Kullanım: pnpm dev (ya da build+start) açıkken  pnpm test:e2e   (E2E_URL ile adres değişir)
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const B = process.env.E2E_URL ?? 'http://localhost:3000';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log('✓', ...a);

// İki geçici host hesabı: A oyunu yönetir, B, A'nın hiçbir şeyine erişememeli.
const stamp = Date.now();
const users = [];
async function makeHost(label) {
	const email = `e2e-${label}-${stamp}@example.com`;
	const password = `pw-${stamp}-${label}`;
	const { data, error } = await db.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
		user_metadata: { name: `E2E ${label}` },
	});
	assert.ifError(error);
	users.push(data.user.id);
	const res = await fetch(`${B}/api/auth/login`, {
		method: 'POST',
		body: new URLSearchParams({ email, password }),
		redirect: 'manual',
	});
	assert.equal(res.headers.get('location'), `${B}/host`, `${label} girişi`);
	const cookie = res.headers
		.getSetCookie()
		.map(c => c.split(';')[0])
		.join('; ');
	return { id: data.user.id, cookie };
}

let code;
try {
	const hostA = await makeHost('a');
	const hostB = await makeHost('b');
	const cookie = hostA.cookie;
	const { data: quizId, error: qe } = await db.rpc('save_quiz', {
		p_id: null,
		p_owner: hostA.id,
		p_quiz: {
			title: 'E2E Test',
			topic: 'Test',
			author_name: 'Bot',
			quiz_date: '2026-10-28',
			time_limit_sec: 15,
			status: 'ready',
			questions: [
				{
					text: 'S1',
					choices: ['yanlış', 'doğru', 'x'],
					correct_index: 1,
					explanation: 'açıklama 1',
				},
				{ text: 'S2', choices: ['a', 'b'], correct_index: 0 },
			],
		},
	});
	assert.ifError(qe);

	const bad = await fetch(`${B}/api/auth/login`, {
		method: 'POST',
		body: new URLSearchParams({ email: 'yok@example.com', password: 'x' }),
		redirect: 'manual',
	});
	assert.equal(bad.headers.get('location'), `${B}/login?error=1`);
	const anonHost = await fetch(`${B}/host`, { redirect: 'manual' });
	assert.equal(new URL(anonHost.headers.get('location'), B).pathname, '/login');
	assert.equal(
		(await fetch(`${B}/api/host/quizzes`, { method: 'POST', body: '{}' })).status,
		401,
	);
	log('giriş: yanlış şifre reddedildi, girişsiz /host → /login, API 401');

	const asB = (path, init = {}) =>
		fetch(`${B}${path}`, { ...init, headers: { cookie: hostB.cookie }, redirect: 'manual' });
	const hostBPage = await (await asB('/host')).text();
	assert.ok(hostBPage.includes('Quizlerim'), 'B kendi paneline girebilmeli');
	assert.ok(!hostBPage.includes('E2E Test'), "B, A'nın quizini listede görmemeli");
	assert.equal((await asB(`/host/quizzes/${quizId}`)).status, 404);
	const putB = await asB(`/api/host/quizzes/${quizId}`, {
		method: 'PUT',
		body: JSON.stringify({
			title: 'ele geçirildi',
			topic: 'x',
			author_name: 'x',
			quiz_date: '2026-10-28',
			time_limit_sec: 20,
			status: 'draft',
			questions: [],
		}),
	});
	assert.equal(putB.status, 404);
	assert.equal((await asB(`/api/host/quizzes/${quizId}`, { method: 'DELETE' })).status, 404);
	const roomB = await asB('/api/host/games', {
		method: 'POST',
		body: new URLSearchParams({ quizId }),
	});
	assert.notEqual(roomB.status, 303);
	const { data: stillA } = await db.from('quizzes').select('title').eq('id', quizId).single();
	assert.equal(stillA.title, 'E2E Test');
	log("B, A'nın quizini göremedi, düzenleyemedi, silemedi, oda açamadı");

	const room = await fetch(`${B}/api/host/games`, {
		method: 'POST',
		headers: { cookie },
		body: new URLSearchParams({ quizId }),
		redirect: 'manual',
	});
	code = room.headers.get('location').split('/').pop();
	log('oda', code);
	assert.equal((await asB(`/host/games/${code}`)).status, 404);
	const actB = await asB(`/api/host/games/${code}/action`, {
		method: 'POST',
		body: '{"action":"start"}',
	});
	assert.equal(actB.status, 404);
	assert.equal((await asB(`/api/host/games/${code}/delete`, { method: 'POST' })).status, 404);
	log("B, A'nın odasını açamadı, yönetemedi, silemedi");

	const post = (path, body, headers = {}) =>
		fetch(`${B}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
	const act = async action =>
		(await post(`/api/host/games/${code}/action`, { action }, { cookie })).json();
	const state = async id =>
		(await fetch(`${B}/api/games/${code}/state${id ? `?playerId=${id}` : ''}`)).json();
	const stateRaw = async id =>
		(await fetch(`${B}/api/games/${code}/state?playerId=${id}`)).text();
	const answer = (playerId, choiceIndex) =>
		post(`/api/games/${code}/answer`, { playerId, choiceIndex });

	const A = (await (await post(`/api/games/${code}/join`, { name: 'Ayşe' })).json()).id;
	const Bp = (await (await post(`/api/games/${code}/join`, { name: 'Bora' })).json()).id;

	assert.equal((await post(`/api/host/games/${code}/action`, { action: 'start' })).status, 401);
	log('cookie olmadan host aksiyonu 401');
	assert.equal((await answer(A, 0)).status, 409);
	log('lobide cevap 409');

	await act('start');
	let s = await state(A);
	assert.equal(s.game.phase, 'question');
	assert.equal(s.question.text, 'S1');
	assert.equal(s.reveal, null);
	assert.ok(
		!/correct|explanation|açıklama 1/.test(await stateRaw(A)),
		'soru fazında doğru cevap sızmamalı',
	);
	log('soru fazı, doğru cevap ve açıklama yanıtta yok');

	assert.equal((await answer(A, 1)).status, 200);
	assert.equal((await answer(A, 0)).status, 409);
	const { data: a1 } = await db
		.from('answers')
		.select('choice_index, points')
		.eq('player_id', A)
		.single();
	assert.equal(a1.choice_index, 1);
	assert.ok(a1.points > 500 && a1.points <= 800, `puan ${a1.points}`);
	log('cevap kilitli (ikinci cevap 409), süre puanı', a1.points);
	assert.equal((await state(A)).question.myChoice, 1);
	assert.equal((await answer(Bp, 9)).status, 400);
	log('geçersiz şık 400');

	await act('pause');
	s = await state(A);
	assert.ok(s.question.pausedAt);
	assert.equal((await answer(Bp, 1)).status, 409);
	const before = s.question.deadline;
	await sleep(1500);
	await act('resume');
	s = await state(A);
	assert.equal(s.question.pausedAt, null);
	assert.ok(
		s.question.deadline - before >= 1400,
		`deadline kaydı ${s.question.deadline - before}`,
	);
	log('duraklat: cevap 409; devam: süre', s.question.deadline - before, 'ms kaydı');

	assert.equal((await answer(Bp, 1)).status, 200);
	const { data: b1 } = await db.from('answers').select('points').eq('player_id', Bp).single();
	s = await state(A);
	assert.equal(s.game.phase, 'reveal', 'herkes cevaplayınca reveal');
	assert.equal(s.reveal.correctIndex, 1);
	assert.deepEqual(s.reveal.counts, [0, 2, 0]);
	assert.equal(s.reveal.explanation, 'açıklama 1');
	assert.equal(s.reveal.myPoints, a1.points + 200, 'ilk doğru bilen +200 sıra bonusu');
	assert.equal((await state(Bp)).reveal.myPoints, b1.points, 'son doğru bilen +0 sıra bonusu');
	log(
		'herkes cevapladı → reveal, dağılım',
		s.reveal.counts,
		'| Ayşe',
		a1.points,
		'+200, Bora',
		b1.points,
		'+0',
	);
	assert.equal((await answer(Bp, 0)).status, 409);
	log('reveal sonrası cevap 409');

	await act('next');
	s = await state(A);
	assert.equal(s.game.phase, 'leaderboard');
	assert.deepEqual(
		s.scores.map(x => [x.name, x.score]),
		[
			['Ayşe', a1.points + 200],
			['Bora', b1.points],
		],
	);
	log('sıralama (herkes, puanlı)', s.scores.map(x => `${x.name}:${x.score}`).join(' '));

	await Promise.all([act('next'), act('next')]);
	s = await state(A);
	assert.equal(s.game.phase, 'question');
	assert.equal(s.game.currentIndex, 1);
	log('çift "Sonraki" tek ilerletti → soru 2');

	s = await state(A);
	await sleep(s.question.deadline - s.serverNow + 600);
	s = await state(A);
	assert.equal(s.game.phase, 'reveal', 'süre dolunca reveal');
	assert.deepEqual(s.reveal.counts, [0, 0]);
	assert.equal(s.reveal.myPoints, null);
	log('süre doldu → reveal (cevapsız)');

	await act('next');
	assert.equal((await state(A)).game.phase, 'leaderboard');
	await act('next');
	s = await state(A);
	assert.equal(s.game.phase, 'finished');
	assert.equal(s.scores.length, 2);
	const r = await act('next');
	assert.equal(r.changed, false);
	log('final; bitmiş oyunda Sonraki etkisiz');
	const archive = await (await fetch(`${B}/archive`)).text();
	assert.ok(
		archive.includes(`/archive/${code}`) && archive.includes('🏆 Ayşe'),
		'arşivde oyun ve kazanan',
	);
	assert.ok(
		!archive.includes(`/api/host/games/${code}/delete`),
		'girişsiz Sil butonu görünmemeli',
	);
	const detail = await (await fetch(`${B}/archive/${code}`)).text();
	assert.ok(detail.includes('Ayşe') && detail.includes('Bora'), 'detayda tüm oyuncular');
	const adminArchive = await (await fetch(`${B}/archive`, { headers: { cookie } })).text();
	assert.ok(adminArchive.includes(`/api/host/games/${code}/delete`), 'host için Sil butonu');
	const bArchive = await (await asB('/archive')).text();
	assert.ok(!bArchive.includes(`/api/host/games/${code}/delete`), 'başka host Sil görmemeli');
	log('arşiv: kazanan, detay listesi, Sil sadece oyunun sahibine');

	const delAnon = await fetch(`${B}/api/host/games/${code}/delete`, {
		method: 'POST',
		redirect: 'manual',
	});
	assert.equal(delAnon.status, 401);
	const del = await fetch(`${B}/api/host/games/${code}/delete`, {
		method: 'POST',
		headers: { cookie },
		redirect: 'manual',
	});
	assert.equal(del.status, 303);
	const { count } = await db
		.from('answers')
		.select('*', { count: 'exact', head: true })
		.eq('game_id', s.game.id);
	assert.equal(count, 0, 'cevaplar da silinmeli');
	assert.equal((await fetch(`${B}/archive/${code}`)).status, 404);
	log('Sil: girişsiz 401, host ile oyun + cevaplar silindi');

	console.log('\nTÜM KONTROLLER GEÇTİ');
} finally {
	// Kullanıcı silinince quizleri, oyunları, oyuncuları ve cevapları cascade ile gider.
	for (const id of users) await db.auth.admin.deleteUser(id);
}

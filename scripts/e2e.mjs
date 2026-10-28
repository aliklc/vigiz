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

	// Görsel yükleme: PNG yüklenir ve herkese açık URL'den indirilebilir; görsel olmayan 400, girişsiz 401.
	const png = Buffer.from(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
		'base64',
	);
	const uploadAs = (c, blob, name) => {
		const form = new FormData();
		form.append('file', blob, name);
		return fetch(`${B}/api/host/uploads`, {
			method: 'POST',
			headers: c ? { cookie: c } : {},
			body: form,
		});
	};
	const up = await uploadAs(cookie, new Blob([png], { type: 'image/png' }), 'nokta.png');
	assert.equal(up.status, 200);
	const { url: imageUrl } = await up.json();
	const img = await fetch(imageUrl);
	assert.equal(img.status, 200);
	assert.equal(img.headers.get('content-type'), 'image/png');
	assert.equal(
		(await uploadAs(cookie, new Blob(['merhaba'], { type: 'text/plain' }), 'a.txt')).status,
		400,
	);
	assert.equal(
		(await uploadAs(null, new Blob([png], { type: 'image/png' }), 'nokta.png')).status,
		401,
	);
	await db.storage.from('question-images').remove([imageUrl.split('/question-images/')[1]]);
	log('görsel yükleme: PNG yüklendi ve açıldı, metin dosyası 400, girişsiz 401');

	// Taslak eksik kaydedilebilir; "Hazır" eksiksiz olmalı.
	const draft = {
		title: '',
		topic: '',
		author_name: '',
		quiz_date: '2026-11-01',
		time_limit_sec: 20,
		status: 'draft',
		questions: [
			{ text: '', image_url: null, explanation: null, choices: ['', ''], correct_index: 0 },
		],
	};
	const postB = body =>
		asB('/api/host/quizzes', { method: 'POST', body: JSON.stringify(body) }).then(
			r => r.status,
		);
	assert.equal(await postB(draft), 200, 'yarım taslak kaydedilebilmeli');
	assert.equal(await postB({ ...draft, status: 'ready' }), 400, 'yarım quiz hazır olamaz');
	log('taslak: yarım hali kaydedildi, aynısı "Hazır" olarak reddedildi');

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
	log("B, A'nın odasını açamadı ve yönetemedi");

	const post = (path, body, headers = {}) =>
		fetch(`${B}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
	const act = async action =>
		(await post(`/api/host/games/${code}/action`, { action }, { cookie })).json();
	const state = async id =>
		(await fetch(`${B}/api/games/${code}/state${id ? `?token=${id}` : ''}`)).json();
	const stateRaw = async id => (await fetch(`${B}/api/games/${code}/state?token=${id}`)).text();
	const answer = (token, choiceIndex) =>
		post(`/api/games/${code}/answer`, { token, choiceIndex });

	// A ve Bp gizli token'lar; aId/bId herkese açık oyuncu kimlikleri (lobi listesinde görünür).
	const A = (await (await post(`/api/games/${code}/join`, { name: 'Ayşe' })).json()).token;
	const Bp = (await (await post(`/api/games/${code}/join`, { name: 'Bora' })).json()).token;
	const aId = (await state(A)).me.id;
	const bId = (await state(Bp)).me.id;

	// Lobideki herkese açık kimlikler token yerine geçemez (başkası adına cevap/bağlanma yok).
	const lobby = await state();
	assert.deepEqual(lobby.players.map(p => p.id).sort(), [aId, bId].sort());
	assert.ok(!JSON.stringify(lobby).includes(A), 'token state yanıtında görünmemeli');
	assert.equal((await post(`/api/games/${code}/join`, { token: aId })).status, 400);
	const anon = createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	);
	const { data: leaked } = await anon.from('player_tokens').select('token');
	assert.deepEqual(leaked, [], 'tarayıcı anahtarıyla token okunamamalı');
	log('token gizli: herkese açık id ile bağlanılamıyor, tarayıcıdan token okunamıyor');

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
	assert.equal((await answer(bId, 0)).status, 403, 'açık id ile başkası adına cevap verilemez');
	log("başkasının açık id'siyle cevap 403");

	assert.equal((await answer(A, 1)).status, 200);
	assert.equal((await answer(A, 0)).status, 409);
	const { data: a1 } = await db
		.from('answers')
		.select('choice_index, points')
		.eq('player_id', aId)
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
	const { data: b1 } = await db.from('answers').select('points').eq('player_id', bId).single();
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

	// "Önceki soru" sadece host'a gösterilir, oyunu değiştirmez; sıradaki/mevcut soru sızmaz.
	const past = await fetch(`${B}/api/host/games/${code}/questions/0`, { headers: { cookie } });
	assert.equal(past.status, 200);
	const pastQ = await past.json();
	assert.equal(pastQ.text, 'S1');
	assert.equal(pastQ.correctIndex, 1);
	assert.deepEqual(pastQ.counts, [0, 2, 0]);
	const getQ = (i, c) =>
		fetch(`${B}/api/host/games/${code}/questions/${i}`, { headers: c ? { cookie: c } : {} });
	assert.equal((await getQ(1, cookie)).status, 404, 'sürmekte olan soru görüntülenemez');
	assert.equal((await getQ(5, cookie)).status, 404);
	assert.equal((await getQ(0, hostB.cookie)).status, 404, 'başka host göremez');
	assert.equal((await getQ(0)).status, 401);
	s = await state(A);
	assert.deepEqual(
		[s.game.phase, s.game.currentIndex],
		['question', 1],
		'oyun durumu değişmemeli',
	);
	log('Önceki soru: host görüyor, oyun etkilenmiyor, mevcut/sıradaki soru ve başka host 404');

	s = await state(A);
	const beforeExpiry = {
		deadline: s.question.deadline,
		serverNow: s.serverNow,
		phase: s.game.phase,
	};
	await sleep(s.question.deadline - s.serverNow + 600);
	s = await state(A);
	assert.equal(
		s.game.phase,
		'reveal',
		`süre dolunca reveal; önce ${JSON.stringify(beforeExpiry)}, sonra ${JSON.stringify({ deadline: s.question?.deadline, serverNow: s.serverNow, pausedAt: s.question?.pausedAt })}`,
	);
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

	// Oynanmış quiz: başlık değişebilir, sorular değişemez.
	const playedQuiz = {
		title: 'E2E Test (düzeltildi)',
		topic: 'Test',
		author_name: 'Bot',
		quiz_date: '2026-10-28',
		time_limit_sec: 15,
		status: 'ready',
		questions: [
			{
				text: 'S1',
				image_url: null,
				explanation: 'açıklama 1',
				choices: ['yanlış', 'doğru', 'x'],
				correct_index: 1,
			},
			{
				text: 'S2',
				image_url: null,
				explanation: null,
				choices: ['a', 'b'],
				correct_index: 0,
			},
		],
	};
	const putA = body =>
		fetch(`${B}/api/host/quizzes/${quizId}`, {
			method: 'PUT',
			headers: { cookie },
			body: JSON.stringify(body),
		});
	assert.equal((await putA(playedQuiz)).status, 200, 'oynanmış quizin başlığı değişebilmeli');
	const changed = structuredClone(playedQuiz);
	changed.questions[0].text = 'S1 değişti';
	const rejected = await putA(changed);
	assert.equal(rejected.status, 409, 'oynanmış quizin soruları değişememeli');
	assert.ok((await rejected.json()).error.includes('soruları'));
	log('oynanmış quiz: başlık düzenlendi, soru değişikliği 409');

	// Oyunu erken bitir: soru sırasında → final; lobide etkisiz; başka host bitiremez.
	const endCode = `E${String(stamp).slice(-5)}`;
	await db.from('games').insert({ quiz_id: quizId, code: endCode });
	const endAct = c =>
		fetch(`${B}/api/host/games/${endCode}/action`, {
			method: 'POST',
			headers: { cookie: c },
			body: '{"action":"end"}',
		});
	assert.equal((await (await endAct(cookie)).json()).changed, false, 'lobide bitir etkisiz');
	await db
		.from('games')
		.update({
			phase: 'question',
			current_index: 0,
			question_started_at: new Date().toISOString(),
		})
		.eq('code', endCode);
	assert.equal((await endAct(hostB.cookie)).status, 404, 'başka host bitiremez');
	await endAct(cookie);
	const { data: ended } = await db
		.from('games')
		.select('phase, finished_at')
		.eq('code', endCode)
		.single();
	assert.equal(ended.phase, 'finished');
	assert.ok(ended.finished_at);
	await db.from('games').delete().eq('code', endCode);
	log('Oyunu bitir: soru sırasında final, lobide etkisiz, başka host 404');

	// Rozetler: 2 soru üst üste doğru → 🔥2; son soruyu en hızlı doğru bilen → ⚡ (sadece sıralamada).
	const badgeCode = `R${String(stamp).slice(-5)}`;
	const { data: g3 } = await db
		.from('games')
		.insert({ quiz_id: quizId, code: badgeCode, phase: 'leaderboard', current_index: 1 })
		.select('id')
		.single();
	const bp = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
	await db.from('players').insert(bp.map((id, i) => ({ id, game_id: g3.id, name: `R${i}` })));
	const { data: qs } = await db
		.from('questions')
		.select('id, position')
		.eq('quiz_id', quizId)
		.order('position');
	const t = sec => new Date(Date.UTC(2026, 0, 1, 0, 0, sec)).toISOString();
	const ans = (p, q, ok, sec) => ({
		game_id: g3.id,
		player_id: bp[p],
		question_id: qs[q].id,
		choice_index: 0,
		points: ok ? 600 : 0,
		answered_at: t(sec),
	});
	await db.from('answers').insert([
		ans(0, 0, true, 1),
		ans(0, 1, true, 5), // iki doğru → seri 2
		ans(1, 0, false, 2),
		ans(1, 1, true, 3), // ikinci soruda en hızlı doğru
		ans(2, 0, true, 3), // ikinci soruyu boş → seri yok
	]);
	const badges = async () =>
		(await (await fetch(`${B}/api/games/${badgeCode}/state`)).json()).scores
			.map(x => [x.name, x.streak ?? 0, !!x.fastest])
			.sort();
	assert.deepEqual(await badges(), [
		['R0', 2, false],
		['R1', 0, true],
		['R2', 0, false],
	]);
	await db.from('games').update({ phase: 'finished' }).eq('id', g3.id);
	assert.deepEqual(await badges(), [
		['R0', 2, false],
		['R1', 0, false],
		['R2', 0, false],
	]);
	await db.from('games').delete().eq('id', g3.id);
	log('rozetler: 2 doğru üst üste 🔥2, turun en hızlısı ⚡, finalde ⚡ yok');

	// Doğru/Yanlış: şıklar sunucuda sabitlenir, oyun çoktan seçmeliyle aynı akışta oynanır.
	const tfQuiz = {
		title: 'TF',
		topic: 'T',
		author_name: 'Bot',
		quiz_date: '2026-10-28',
		time_limit_sec: 20,
		status: 'ready',
		questions: [
			{
				type: 'truefalse',
				text: 'Dünya yuvarlaktır',
				image_url: null,
				explanation: null,
				choices: ['x', 'y', 'z'],
				correct_index: 0,
			},
		],
	};
	const tfRes = await fetch(`${B}/api/host/quizzes`, {
		method: 'POST',
		headers: { cookie },
		body: JSON.stringify(tfQuiz),
	});
	assert.equal(tfRes.status, 200);
	const { id: tfId } = await tfRes.json();
	const { data: tfQ } = await db
		.from('questions')
		.select('type, choices')
		.eq('quiz_id', tfId)
		.single();
	assert.deepEqual(tfQ, { type: 'truefalse', choices: ['Doğru', 'Yanlış'] });
	const tfRoom = await fetch(`${B}/api/host/games`, {
		method: 'POST',
		headers: { cookie },
		body: new URLSearchParams({ quizId: tfId }),
		redirect: 'manual',
	});
	const tfCode = tfRoom.headers.get('location').split('/').pop();
	const tfToken = (await (await post(`/api/games/${tfCode}/join`, { name: 'Tek' })).json()).token;
	await fetch(`${B}/api/host/games/${tfCode}/action`, {
		method: 'POST',
		headers: { cookie },
		body: '{"action":"start"}',
	});
	const tfState = async () =>
		(await fetch(`${B}/api/games/${tfCode}/state?token=${tfToken}`)).json();
	assert.equal((await tfState()).question.type, 'truefalse');
	assert.equal(
		(await post(`/api/games/${tfCode}/answer`, { token: tfToken, choiceIndex: 0 })).status,
		200,
	);
	const tfReveal = await tfState();
	assert.equal(tfReveal.game.phase, 'reveal');
	assert.equal(tfReveal.reveal.correctIndex, 0);
	assert.ok(tfReveal.reveal.myPoints > 500);
	const badBuzzer = await fetch(`${B}/api/host/quizzes`, {
		method: 'POST',
		headers: { cookie },
		body: JSON.stringify({
			...tfQuiz,
			questions: [
				{
					type: 'buzzer',
					text: '',
					image_url: null,
					explanation: null,
					choices: [],
					correct_index: 0,
				},
			],
		}),
	});
	assert.equal(badBuzzer.status, 400, 'görselsiz buzzer sorusu hazır olamaz');
	await db.from('quizzes').delete().eq('id', tfId);
	log(
		'Doğru/Yanlış: şıklar sabitlendi, oynandı, doğru cevap puan aldı; görselsiz buzzer hazır olamaz',
	);

	// Sıra bonusu ara değerleri: 3 doğru cevap → +200 / +100 / +0 (yanlış cevap sırayı etkilemez).
	const { data: g2 } = await db
		.from('games')
		.insert({ quiz_id: quizId, code: `T${stamp}`.slice(0, 6) })
		.select('id')
		.single();
	const pids = [
		crypto.randomUUID(),
		crypto.randomUUID(),
		crypto.randomUUID(),
		crypto.randomUUID(),
	];
	await db.from('players').insert(pids.map((id, i) => ({ id, game_id: g2.id, name: `P${i}` })));
	const { data: q1 } = await db
		.from('questions')
		.select('id')
		.eq('quiz_id', quizId)
		.eq('position', 0)
		.single();
	const at = i => new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString();
	await db.from('answers').insert([
		{
			game_id: g2.id,
			player_id: pids[0],
			question_id: q1.id,
			choice_index: 0,
			points: 0,
			answered_at: at(0),
		},
		{
			game_id: g2.id,
			player_id: pids[1],
			question_id: q1.id,
			choice_index: 1,
			points: 700,
			answered_at: at(1),
		},
		{
			game_id: g2.id,
			player_id: pids[2],
			question_id: q1.id,
			choice_index: 1,
			points: 600,
			answered_at: at(2),
		},
		{
			game_id: g2.id,
			player_id: pids[3],
			question_id: q1.id,
			choice_index: 1,
			points: 500,
			answered_at: at(3),
		},
	]);
	const { data: totals } = await db
		.from('answer_points')
		.select('player_id, total')
		.eq('game_id', g2.id);
	const byP = Object.fromEntries(totals.map(t => [t.player_id, t.total]));
	assert.deepEqual(
		pids.map(id => byP[id]),
		[0, 900, 700, 500],
	);
	await db.from('games').delete().eq('id', g2.id);
	log('sıra bonusu: 3 doğru cevapta +200 / +100 / +0, yanlış cevap 0');

	console.log('\nTÜM KONTROLLER GEÇTİ');
} finally {
	// Kullanıcı silinince quizleri, oyunları, oyuncuları ve cevapları cascade ile gider.
	for (const id of users) await db.auth.admin.deleteUser(id);
}

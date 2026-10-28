'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Podium, QuestionView, Scoreboard, useRemaining } from '@/components/game-views';
import { Centered, PlayerList } from '@/components/player-screen';
import { Button } from '@/components/ui/button';
import { useGame } from '@/hooks/use-game';

type Action = 'start' | 'next' | 'pause' | 'resume';

export function HostScreen({ code }: { code: string }) {
	const { state, notFound, refresh, offset } = useGame(code, null);
	const remaining = useRemaining(state?.question ?? null, offset, !!state?.reveal, refresh);
	const [origin, setOrigin] = useState('');
	const [busy, setBusy] = useState(false);
	useEffect(() => setOrigin(window.location.origin), []);

	// Cevaplar Realtime'da yayınlanmıyor (gizli); "kaç kişi cevapladı" için soru sırasında yokla.
	const phase = state?.game.phase;
	useEffect(() => {
		if (phase !== 'question') return;
		const id = setInterval(refresh, 2000);
		return () => clearInterval(id);
	}, [phase, refresh]);

	async function act(action: Action) {
		setBusy(true);
		const res = await fetch(`/api/host/games/${code}/action`, {
			method: 'POST',
			body: JSON.stringify({ action }),
		});
		if (!res.ok) alert((await res.json()).error ?? 'İşlem başarısız');
		await refresh();
		setBusy(false);
	}

	if (notFound) return <Centered>Oda bulunamadı.</Centered>;
	if (!state) return <Centered>Yükleniyor…</Centered>;

	const link = `${origin}/play/${code}`;
	const { game, question, scores } = state;
	const isLast = game.currentIndex >= game.questionCount - 1;

	const control = (label: string, action: Action, disabled = false) => (
		<Button size="lg" disabled={busy || disabled} onClick={() => act(action)}>
			{label}
		</Button>
	);

	return (
		<main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 pb-28">
			<Link href="/host" className="text-sm underline">
				← Quizler
			</Link>

			{game.phase === 'lobby' && (
				<>
					<div className="text-center">
						<p className="text-muted-foreground">
							{state.quiz.topic} · {state.quiz.authorName}
						</p>
						<h1 className="text-3xl font-bold">{state.quiz.title}</h1>
					</div>
					<div className="rounded-xl border p-6 text-center">
						<p className="text-muted-foreground">Katılmak için</p>
						<p className="font-mono text-lg break-all">{link}</p>
						<p className="mt-2 text-muted-foreground">ya da ana sayfada kodu gir</p>
						<p className="font-mono text-6xl font-bold tracking-widest">{code}</p>
						<button
							className="mt-3 text-sm underline"
							onClick={() => navigator.clipboard?.writeText(link)}
						>
							Linki kopyala
						</button>
					</div>
					<PlayerList players={state.players} />
				</>
			)}

			{(game.phase === 'question' || game.phase === 'reveal') && (
				<QuestionView state={state} remaining={remaining} />
			)}

			{game.phase === 'leaderboard' && scores && (
				<>
					<h1 className="text-center text-3xl font-bold">
						Sıralama · {game.currentIndex + 1}/{game.questionCount}
					</h1>
					<Scoreboard scores={scores} />
				</>
			)}

			{game.phase === 'finished' && scores && (
				<>
					<h1 className="text-center text-3xl font-bold">
						{state.quiz.title} · Sonuçlar
					</h1>
					<Podium scores={scores} />
					<Scoreboard scores={scores} />
				</>
			)}

			<footer className="fixed inset-x-0 bottom-0 border-t bg-background p-3">
				<div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
					<span className="text-sm text-muted-foreground">
						{game.phase === 'question' && question
							? `${question.answeredCount}/${state.players.length} cevapladı`
							: `${state.players.length} oyuncu`}
					</span>
					<div className="flex gap-2">
						{game.phase === 'lobby' &&
							control('Başlat', 'start', game.questionCount === 0)}
						{game.phase === 'question' &&
							(question?.pausedAt
								? control('Devam et', 'resume')
								: control('Duraklat', 'pause'))}
						{game.phase === 'reveal' && control('Sıralamayı göster', 'next')}
						{game.phase === 'leaderboard' &&
							control(isLast ? 'Sonuçları göster' : 'Sonraki soru', 'next')}
						{game.phase === 'finished' && (
							<Button asChild size="lg" variant="outline">
								<Link href="/host">Quizlere dön</Link>
							</Button>
						)}
					</div>
				</div>
			</footer>
		</main>
	);
}

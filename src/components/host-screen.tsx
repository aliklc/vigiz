'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CodeTiles, Wordmark } from '@/components/brand';
import {
	Choices,
	Countdown,
	Podium,
	QuestionImage,
	Scoreboard,
	useRemaining,
} from '@/components/game-views';
import { BigButton, Centered, PlayerList } from '@/components/player-screen';
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

	const { game, question, reveal, scores } = state;
	const joinUrl = `${origin.replace(/^https?:\/\//, '')}/play/${code}`;
	const isLast = game.currentIndex >= game.questionCount - 1;
	const playerCount = state.players.length;

	const control = (label: string, action: Action, disabled = false) => (
		<BigButton className="px-8" disabled={busy || disabled} onClick={() => act(action)}>
			{label}
		</BigButton>
	);

	return (
		<main className="stage flex flex-col">
			<header className="flex items-center justify-between gap-4 px-6 pt-4">
				<Link href="/host" aria-label="Panele dön">
					<Wordmark className="text-3xl" />
				</Link>
				<p className="truncate font-semibold opacity-75">{state.quiz.title}</p>
			</header>

			<div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-6 pb-32">
				{game.phase === 'lobby' && (
					<>
						<div className="flex flex-col items-center gap-5 py-6 text-center">
							<p className="text-xl opacity-80">
								Telefonundan{' '}
								<span className="font-semibold text-white">{joinUrl}</span> adresine
								gir ya da ana sayfaya kodu yaz
							</p>
							<CodeTiles code={code} />
							<button
								className="text-sm underline opacity-75 hover:opacity-100"
								onClick={() =>
									navigator.clipboard?.writeText(`${origin}/play/${code}`)
								}
							>
								Linki kopyala
							</button>
						</div>
						{playerCount ? (
							<PlayerList players={state.players} />
						) : (
							<p className="text-center text-lg opacity-60">İlk oyuncu bekleniyor…</p>
						)}
					</>
				)}

				{(game.phase === 'question' || game.phase === 'reveal') && question && (
					<>
						<div className="flex items-start justify-between gap-6">
							<div className="flex flex-col gap-2">
								<p className="font-display text-xl font-extrabold opacity-70">
									Soru {game.currentIndex + 1}/{game.questionCount}
								</p>
								<h1 className="font-display text-3xl leading-tight font-extrabold sm:text-5xl">
									{question.text}
								</h1>
							</div>
							{!reveal && (
								<Countdown
									remaining={remaining}
									limitMs={game.timeLimitSec * 1000}
									paused={!!question.pausedAt}
									size="lg"
								/>
							)}
						</div>
						<QuestionImage src={question.imageUrl} className="max-h-72" />
						<Choices state={state} open={false} size="host" />
						{reveal?.explanation && (
							<p className="rounded-2xl bg-white/10 p-5 text-xl">
								{reveal.explanation}
							</p>
						)}
					</>
				)}

				{game.phase === 'leaderboard' && scores && (
					<>
						<h1 className="font-display text-4xl font-extrabold">
							{game.currentIndex + 1}. sorudan sonra sıralama
						</h1>
						<Scoreboard scores={scores} />
					</>
				)}

				{game.phase === 'finished' && scores && (
					<>
						<h1 className="text-center font-display text-5xl font-extrabold">
							Kazananlar
						</h1>
						<Podium scores={scores} />
						<Scoreboard scores={scores} />
					</>
				)}
			</div>

			<footer className="fixed inset-x-0 bottom-0 bg-night/95 py-4 backdrop-blur">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6">
					{game.phase === 'question' && question ? (
						<AnsweredBar answered={question.answeredCount} total={playerCount} />
					) : (
						<p className="font-semibold opacity-80">{playerCount} oyuncu</p>
					)}
					<div className="flex gap-3">
						{game.phase === 'lobby' &&
							control(
								'Başlat',
								'start',
								game.questionCount === 0 || playerCount === 0,
							)}
						{game.phase === 'question' &&
							(question?.pausedAt
								? control('Devam et', 'resume')
								: control('Duraklat', 'pause'))}
						{game.phase === 'reveal' && control('Sıralamayı göster', 'next')}
						{game.phase === 'leaderboard' &&
							control(isLast ? 'Sonuçları göster' : 'Sonraki soru', 'next')}
						{game.phase === 'finished' && (
							<Link
								href="/host"
								className="flex h-14 items-center rounded-2xl bg-white/10 px-8 font-semibold"
							>
								Panele dön
							</Link>
						)}
					</div>
				</div>
			</footer>
		</main>
	);
}

function AnsweredBar({ answered, total }: { answered: number; total: number }) {
	return (
		<div className="flex min-w-0 flex-1 items-center gap-3">
			<div className="h-3 max-w-sm flex-1 overflow-hidden rounded-full bg-white/15">
				<div
					className="h-full rounded-full bg-c4 transition-[width] duration-500"
					style={{ width: `${total ? (answered / total) * 100 : 0}%` }}
				/>
			</div>
			<p className="shrink-0 font-semibold tabular-nums">
				{answered}/{total} cevapladı
			</p>
		</div>
	);
}

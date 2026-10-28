'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { renderSVG } from 'uqr';

import { CodeTiles, Wordmark } from '@/components/brand';
import {
	Choices,
	Countdown,
	Podium,
	QuestionImage,
	Scoreboard,
	useRemaining,
} from '@/components/game-views';
import { Centered, PlayerList, PrimaryButton } from '@/components/player-screen';
import { useGame } from '@/hooks/use-game';
import type { GameState } from '@/lib/game-types';

type Action = 'start' | 'next' | 'pause' | 'resume' | 'end';

export function HostScreen({ code }: { code: string }) {
	const { state, notFound, refresh, offset } = useGame(code, null);
	const remaining = useRemaining(state?.question ?? null, offset, !!state?.reveal, refresh);
	const [origin, setOrigin] = useState('');
	const [busy, setBusy] = useState(false);
	// "Önceki soru": sadece bu ekranda gösterilir, oyunu ve oyuncuları etkilemez.
	const [viewing, setViewing] = useState<PastQuestion | null>(null);

	async function showQuestion(index: number) {
		const res = await fetch(`/api/host/games/${code}/questions/${index}`, {
			cache: 'no-store',
		});
		if (res.ok) setViewing(await res.json());
	}
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
		try {
			const res = await fetch(`/api/host/games/${code}/action`, {
				method: 'POST',
				body: JSON.stringify({ action }),
			});
			if (!res.ok) alert((await res.json()).error ?? 'İşlem başarısız');
			await refresh();
		} catch {
			alert('Bağlantı koptu, tekrar dene.');
		} finally {
			// Ağ hatasında da butonlar tekrar açılsın; yoksa oyun ortasında kilitlenir.
			setBusy(false);
		}
	}

	if (notFound) return <Centered>Oda bulunamadı.</Centered>;
	if (!state) return <Centered>Yükleniyor…</Centered>;

	const { game, question, reveal, scores } = state;
	const joinUrl = `${origin}/play/${code}`;
	const isLast = game.currentIndex >= game.questionCount - 1;
	// Sıralama/finalde az önce sorulan soru, soru ve sonuç ekranında bir önceki soru.
	const previousIndex = viewing
		? viewing.index - 1
		: game.phase === 'leaderboard' || game.phase === 'finished'
			? game.currentIndex
			: game.currentIndex - 1;
	const playerCount = state.players.length;

	const control = (label: string, action: Action, disabled = false) => (
		<PrimaryButton
			className="lg:h-14 lg:px-8 lg:text-lg"
			disabled={busy || disabled}
			onClick={() => act(action)}
		>
			{label}
		</PrimaryButton>
	);

	return (
		<main className="stage flex flex-col">
			<header className="border-b bg-white/80 backdrop-blur">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
					<Link href="/host" aria-label="Panele dön">
						<Wordmark className="text-2xl" />
					</Link>
					<div className="flex min-w-0 items-center gap-4">
						<p className="truncate font-medium text-muted-foreground">
							{state.quiz.title}
						</p>
						{['question', 'reveal', 'leaderboard'].includes(game.phase) && (
							<button
								type="button"
								disabled={busy}
								onClick={() => {
									if (
										confirm(
											'Oyun şimdi bitsin mi? O ana kadarki puanlarla sonuçlar gösterilir.',
										)
									) {
										setViewing(null);
										act('end');
									}
								}}
								className="shrink-0 rounded-lg border border-destructive/40 px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-red-50 disabled:opacity-50"
							>
								Oyunu bitir
							</button>
						)}
					</div>
				</div>
			</header>

			<div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 pb-32 lg:gap-8">
				{viewing ? (
					<PastQuestionView state={state} past={viewing} />
				) : (
					<>
						{game.phase === 'lobby' && (
							<>
								<div className="flex flex-col items-center justify-center gap-8 rounded-3xl border bg-white px-6 py-8 shadow-sm sm:flex-row lg:gap-14 lg:py-12">
									{origin && <JoinQr url={joinUrl} />}
									<div className="flex flex-col items-center gap-4">
										<CodeTiles code={code} />
										<button
											className="text-sm font-medium text-brand-ink hover:underline"
											onClick={() => navigator.clipboard?.writeText(joinUrl)}
										>
											Linki kopyala
										</button>
									</div>
								</div>
								{playerCount ? (
									<PlayerList players={state.players} />
								) : (
									<p className="text-center text-lg text-muted-foreground">
										İlk oyuncu bekleniyor…
									</p>
								)}
							</>
						)}

						{(game.phase === 'question' || game.phase === 'reveal') && question && (
							<>
								<div className="flex items-start justify-between gap-6">
									<div className="flex flex-col gap-2">
										<p className="font-semibold text-muted-foreground lg:text-lg">
											Soru {game.currentIndex + 1}/{game.questionCount}
										</p>
										<h1 className="text-3xl leading-tight font-bold tracking-tight lg:text-5xl">
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
									<p className="rounded-2xl border bg-white p-5 text-lg text-muted-foreground lg:text-xl">
										{reveal.explanation}
									</p>
								)}
							</>
						)}

						{game.phase === 'leaderboard' && scores && (
							<>
								<h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
									{game.currentIndex + 1}. sorudan sonra sıralama
								</h1>
								<Scoreboard scores={scores} />
							</>
						)}

						{game.phase === 'finished' && scores && (
							<>
								<h1 className="text-center text-4xl font-bold tracking-tight lg:text-5xl">
									Kazananlar
								</h1>
								<Podium scores={scores} />
								<Scoreboard scores={scores} />
							</>
						)}
					</>
				)}
			</div>

			<footer className="fixed inset-x-0 bottom-0 border-t bg-white/90 py-3 backdrop-blur lg:py-4">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6">
					{viewing ? (
						<p className="font-medium text-muted-foreground">
							Önceki soruya bakıyorsun; oyun devam ediyor.
						</p>
					) : game.phase === 'question' && question ? (
						<AnsweredBar answered={question.answeredCount} total={playerCount} />
					) : (
						<p className="font-medium text-muted-foreground">{playerCount} oyuncu</p>
					)}
					<div className="flex gap-3">
						{game.phase !== 'lobby' && previousIndex >= 0 && (
							<button
								type="button"
								onClick={() => showQuestion(previousIndex)}
								className="h-12 rounded-xl border bg-white px-5 font-semibold transition hover:bg-muted lg:h-14 lg:px-6 lg:text-lg"
							>
								Önceki soru
							</button>
						)}
						{viewing && (
							<PrimaryButton
								className="lg:h-14 lg:px-8 lg:text-lg"
								onClick={() => setViewing(null)}
							>
								Güncel ekrana dön
							</PrimaryButton>
						)}
						{!viewing && (
							<>
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
										className="flex h-12 items-center rounded-xl border bg-white px-6 font-semibold lg:h-14"
									>
										Panele dön
									</Link>
								)}
							</>
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
			<div className="h-2.5 max-w-sm flex-1 overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-brand transition-[width] duration-500"
					style={{ width: `${total ? (answered / total) * 100 : 0}%` }}
				/>
			</div>
			<p className="shrink-0 font-medium tabular-nums">
				{answered}/{total} cevapladı
			</p>
		</div>
	);
}

// Telefon kamerasıyla okutunca doğrudan oyuncu sayfası açılır.
function JoinQr({ url }: { url: string }) {
	const svg = useMemo(() => renderSVG(url, { border: 1 }), [url]);
	return (
		<div
			role="img"
			aria-label="Katılmak için QR kod"
			className="size-48 shrink-0 rounded-2xl border p-2 lg:size-64 [&>svg]:size-full"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG kendi ürettiğimiz oda linkinden, kullanıcı girdisi değil
			dangerouslySetInnerHTML={{ __html: svg }}
		/>
	);
}

type PastQuestion = {
	index: number;
	text: string;
	imageUrl: string | null;
	choices: string[];
	correctIndex: number;
	explanation: string | null;
	counts: number[];
};

function PastQuestionView({ state, past }: { state: GameState; past: PastQuestion }) {
	// Choices bileşenini sonuç modunda kullanmak için state'i bu soruyla doldur.
	const view: GameState = {
		...state,
		question: {
			text: past.text,
			imageUrl: past.imageUrl,
			choices: past.choices,
			deadline: 0,
			pausedAt: null,
			answeredCount: 0,
			myChoice: null,
		},
		reveal: {
			correctIndex: past.correctIndex,
			counts: past.counts,
			explanation: past.explanation,
			myPoints: null,
		},
	};
	return (
		<>
			<div className="flex flex-col gap-2">
				<p className="font-semibold text-muted-foreground lg:text-lg">
					Önceki soru · Soru {past.index + 1}/{state.game.questionCount}
				</p>
				<h1 className="text-3xl leading-tight font-bold tracking-tight lg:text-5xl">
					{past.text}
				</h1>
			</div>
			<QuestionImage src={past.imageUrl} className="max-h-72" />
			<Choices state={view} open={false} size="host" />
			{past.explanation && (
				<p className="rounded-2xl border bg-white p-5 text-lg text-muted-foreground lg:text-xl">
					{past.explanation}
				</p>
			)}
		</>
	);
}

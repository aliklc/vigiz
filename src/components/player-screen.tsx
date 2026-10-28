'use client';

import { useEffect, useState } from 'react';

import { CHOICE_BG, CHOICE_TEXT, ChoiceShape, Wordmark } from '@/components/brand';
import {
	Choices,
	Countdown,
	myRank,
	Podium,
	QuestionImage,
	Scoreboard,
	useRemaining,
} from '@/components/game-views';
import { useGame } from '@/hooks/use-game';
import { cn } from '@/lib/utils';

const storageKey = (code: string) => `vigiz:player:${code}`;

function readStored(code: string): string | null {
	try {
		return localStorage.getItem(storageKey(code));
	} catch {
		return null;
	}
}

function writeStored(code: string, id: string | null) {
	try {
		if (id) localStorage.setItem(storageKey(code), id);
		else localStorage.removeItem(storageKey(code));
	} catch {}
}

export function PlayerScreen({ code }: { code: string }) {
	// undefined = localStorage henüz okunmadı, null = kayıtlı oyuncu yok
	const [playerId, setPlayerId] = useState<string | null | undefined>(undefined);
	const [error, setError] = useState('');
	const { state, notFound, refresh, offset } = useGame(code, playerId ?? null);
	const remaining = useRemaining(state?.question ?? null, offset, !!state?.reveal, refresh);
	// Gönderilen ama state'e henüz yansımamış seçim (anında geri bildirim için)
	const [pending, setPending] = useState<{ index: number; choice: number } | null>(null);

	async function answer(choiceIndex: number) {
		if (!state) return;
		setPending({ index: state.game.currentIndex, choice: choiceIndex });
		setError('');
		const res = await fetch(`/api/games/${code}/answer`, {
			method: 'POST',
			body: JSON.stringify({ playerId, choiceIndex }),
		});
		if (!res.ok) setError((await res.json()).error ?? 'Cevap gönderilemedi');
		await refresh();
		setPending(null);
	}

	async function join(body: { playerId?: string; name?: string }) {
		const res = await fetch(`/api/games/${code}/join`, {
			method: 'POST',
			body: JSON.stringify(body),
		});
		const data = await res.json();
		if (res.ok) {
			writeStored(code, data.id);
			setPlayerId(data.id);
			setError('');
			return;
		}
		writeStored(code, null);
		setPlayerId(null);
		setError(data.error);
	}

	// Sayfa yenilenince / geri gelinince kayıtlı kimlikle yeniden bağlan.
	// biome-ignore lint/correctness/useExhaustiveDependencies: sadece ilk açılışta
	useEffect(() => {
		const stored = readStored(code);
		if (stored) join({ playerId: stored });
		else setPlayerId(null);
	}, [code]);

	if (notFound) {
		return (
			<Centered>
				<p className="font-display text-2xl font-extrabold">Bu kodla bir oda yok</p>
				<p className="opacity-75">Kodu host'un ekranından kontrol edip tekrar dene.</p>
				<a href="/" className="mt-4 underline">
					Kodu yeniden gir
				</a>
			</Centered>
		);
	}
	if (playerId === undefined || !state) return <Centered>Yükleniyor…</Centered>;

	if (!state.me) {
		if (state.game.phase === 'finished') {
			return <Centered>Bu oyun bitti. Sonuçlar arşivde.</Centered>;
		}
		return (
			<Stage className="justify-center">
				<div className="flex flex-col items-center gap-1 text-center">
					<Wordmark className="mb-6 text-5xl" />
					<p className="opacity-75">{state.quiz.topic}</p>
					<h1 className="font-display text-3xl font-extrabold">{state.quiz.title}</h1>
				</div>
				<form
					className="mt-8 flex flex-col gap-3"
					onSubmit={e => {
						e.preventDefault();
						join({ name: String(new FormData(e.currentTarget).get('name')) });
					}}
				>
					<label htmlFor="name" className="text-center opacity-75">
						Sıralamada görünecek adın
					</label>
					<input
						id="name"
						name="name"
						maxLength={30}
						autoComplete="nickname"
						required
						className="h-14 rounded-2xl bg-white px-4 text-center text-xl font-semibold text-ink outline-none focus-visible:ring-4 focus-visible:ring-c3"
					/>
					{error && (
						<p role="alert" className="text-center text-c3">
							{error}
						</p>
					)}
					<BigButton type="submit">Katıl</BigButton>
				</form>
			</Stage>
		);
	}

	const { phase } = state.game;
	const me = state.me;
	const question = state.question && {
		...state.question,
		myChoice:
			pending?.index === state.game.currentIndex ? pending.choice : state.question.myChoice,
	};
	const reveal = state.reveal;

	if (phase === 'lobby') {
		return (
			<Stage>
				<Wordmark className="text-3xl" />
				<div className="my-auto flex flex-col items-center gap-2 py-10 text-center">
					<p className="opacity-75">{state.quiz.title}</p>
					<h1 className="font-display text-4xl font-extrabold">Hazırsın, {me.name}</h1>
					<p className="max-w-xs opacity-75">
						Host başlatınca ilk soru burada belirecek.
					</p>
				</div>
				<PlayerList players={state.players} meId={me.id} />
			</Stage>
		);
	}

	if (phase === 'question' && question) {
		const paused = !!question.pausedAt;
		const chosen = question.myChoice;
		if (chosen != null) {
			return (
				<main
					className={cn(
						'flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center',
						CHOICE_BG[chosen],
						CHOICE_TEXT[chosen],
					)}
				>
					<ChoiceShape index={chosen} className="size-24" />
					<p className="font-display text-4xl font-extrabold">Cevabın alındı</p>
					<p className="text-lg opacity-80">{question.choices[chosen]}</p>
					<p className="mt-6 opacity-80">Diğerleri bekleniyor…</p>
					{error && <p role="alert">{error}</p>}
				</main>
			);
		}
		return (
			<Stage className="gap-4">
				<div className="flex items-center justify-between gap-3">
					<p className="font-display text-lg font-extrabold opacity-75">
						{state.game.currentIndex + 1}/{state.game.questionCount}
					</p>
					<Countdown
						remaining={remaining}
						limitMs={state.game.timeLimitSec * 1000}
						paused={paused}
					/>
				</div>
				<h1 className="font-display text-2xl leading-tight font-extrabold">
					{question.text}
				</h1>
				<QuestionImage src={question.imageUrl} className="max-h-40" />
				{paused && (
					<p
						role="status"
						className="rounded-xl bg-white/10 p-3 text-center font-semibold"
					>
						Oyun duraklatıldı
					</p>
				)}
				<Choices
					state={{ ...state, question }}
					open={!paused && remaining > 0}
					onChoose={answer}
					size="player"
				/>
				{error && (
					<p role="alert" className="text-center text-c3">
						{error}
					</p>
				)}
			</Stage>
		);
	}

	if (phase === 'reveal' && question && reveal) {
		const verdict = reveal.myPoints
			? { bg: 'bg-c4 text-white', title: 'Doğru!', sub: `+${reveal.myPoints} puan` }
			: question.myChoice == null
				? { bg: 'bg-white/10', title: 'Süre doldu', sub: 'Bu soruya cevap vermedin' }
				: { bg: 'bg-c1 text-white', title: 'Yanlış', sub: 'Bu sorudan puan yok' };
		return (
			<Stage className="gap-4">
				<div className={cn('rounded-2xl p-5 text-center', verdict.bg)}>
					<p className="font-display text-4xl font-extrabold">{verdict.title}</p>
					<p className="text-lg opacity-90">{verdict.sub}</p>
				</div>
				<p className="font-semibold">{question.text}</p>
				<Choices state={{ ...state, question }} open={false} size="player" />
				{reveal.explanation && (
					<p className="rounded-2xl bg-white/10 p-4">{reveal.explanation}</p>
				)}
			</Stage>
		);
	}

	if ((phase === 'leaderboard' || phase === 'finished') && state.scores) {
		const rank = myRank(state.scores, me.id);
		const myScore = state.scores.find(s => s.id === me.id)?.score ?? 0;
		const finished = phase === 'finished';
		return (
			<Stage className="gap-5">
				<h1 className="font-display text-3xl font-extrabold">
					{finished ? 'Sonuçlar' : 'Sıralama'}
				</h1>
				{finished && <Podium scores={state.scores} />}
				{rank && (
					<div className="flex items-center justify-between rounded-2xl bg-c3 p-5 text-ink">
						<div>
							<p className="font-display text-5xl font-extrabold">{rank}.</p>
							<p>{state.scores.length} kişi arasında</p>
						</div>
						<p className="font-display text-3xl font-extrabold tabular-nums">
							{myScore}
						</p>
					</div>
				)}
				<Scoreboard scores={state.scores} meId={me.id} />
				{!finished && <p className="text-center opacity-75">Sıradaki soru birazdan…</p>}
			</Stage>
		);
	}

	return <Centered>Yükleniyor…</Centered>;
}

export function PlayerList({
	players,
	meId,
}: {
	players: { id: string; name: string }[];
	meId?: string;
}) {
	return (
		<section aria-label="Oyuncular">
			<p className="mb-3 font-display text-lg font-extrabold">
				{players.length} kişi katıldı
			</p>
			<ul className="flex flex-wrap gap-2">
				{players.map((p, i) => (
					<li
						key={p.id}
						className={cn(
							'animate-in rounded-full px-4 py-1.5 font-semibold duration-300 fade-in zoom-in-75',
							p.id === meId
								? 'bg-white text-ink'
								: cn(CHOICE_BG[i % 5], CHOICE_TEXT[i % 5]),
						)}
					>
						{p.name}
					</li>
				))}
			</ul>
		</section>
	);
}

export function Stage({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<main className="stage flex flex-col p-4 sm:p-6">
			<div className={cn('mx-auto flex w-full max-w-xl flex-1 flex-col', className)}>
				{children}
			</div>
		</main>
	);
}

export function Centered({ children }: { children: React.ReactNode }) {
	return (
		<main className="stage flex flex-col items-center justify-center gap-2 p-6 text-center text-lg">
			{children}
		</main>
	);
}

export function BigButton({ className, ...props }: React.ComponentProps<'button'>) {
	return (
		<button
			className={cn(
				'h-14 rounded-2xl bg-c3 font-display text-xl font-extrabold text-ink shadow-[0_5px_0_rgb(0_0_0/0.3)] transition outline-none focus-visible:ring-4 focus-visible:ring-white active:translate-y-1 active:shadow-none disabled:opacity-50',
				className,
			)}
			{...props}
		/>
	);
}

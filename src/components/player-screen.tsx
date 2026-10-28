'use client';

import { useEffect, useState } from 'react';

import { FIELD, LETTERS } from '@/components/brand';
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
				<p className="text-2xl font-bold tracking-tight">Bu kodla bir oda yok</p>
				<p className="text-muted-foreground">
					Kodu host'un ekranından kontrol edip tekrar dene.
				</p>
				<a href="/" className="mt-4 font-medium text-brand-ink underline">
					Kodu yeniden gir
				</a>
			</Centered>
		);
	}
	// playerId ayarlandı ama state henüz o oyuncuyla yeniden çekilmediyse isim formunu gösterme.
	if (playerId === undefined || !state || (playerId && !state.me)) {
		return <Centered>Yükleniyor…</Centered>;
	}

	if (!state.me) {
		if (state.game.phase === 'finished') {
			return <Centered>Bu oyun bitti. Sonuçlar geçmiş quizlerde.</Centered>;
		}
		return (
			<Stage className="justify-center">
				<Card className="flex flex-col gap-6">
					<div className="text-center">
						<p className="text-muted-foreground">{state.quiz.topic}</p>
						<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
							{state.quiz.title}
						</h1>
					</div>
					<form
						className="flex flex-col gap-3"
						onSubmit={e => {
							e.preventDefault();
							join({ name: String(new FormData(e.currentTarget).get('name')) });
						}}
					>
						<label htmlFor="name" className="text-sm font-medium">
							Sıralamada görünecek adın
						</label>
						<input
							id="name"
							name="name"
							maxLength={30}
							autoComplete="nickname"
							required
							className={FIELD}
						/>
						{error && (
							<p role="alert" className="text-sm text-destructive">
								{error}
							</p>
						)}
						<PrimaryButton type="submit">Katıl</PrimaryButton>
					</form>
				</Card>
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
			<Stage className="justify-center">
				<Card className="flex flex-col gap-6">
					<div className="text-center">
						<span className="inline-block rounded-full border border-brand/30 bg-brand-tint px-3 py-1 text-sm text-brand-ink">
							{state.quiz.title}
						</span>
						<h1 className="mt-3 text-3xl font-bold tracking-tight">
							Hazırsın, {me.name}
						</h1>
						<p className="text-muted-foreground">
							Host başlatınca ilk soru burada belirecek.
						</p>
					</div>
					<PlayerList players={state.players} meId={me.id} />
				</Card>
			</Stage>
		);
	}

	if (phase === 'question' && question) {
		const paused = !!question.pausedAt;
		const chosen = question.myChoice;
		if (chosen != null) {
			return (
				<Stage className="justify-center">
					<Card className="flex flex-col items-center gap-3 text-center">
						<span className="flex size-16 items-center justify-center rounded-2xl bg-brand text-3xl font-bold text-white">
							{LETTERS[chosen]}
						</span>
						<p className="text-2xl font-bold tracking-tight">Cevabın alındı</p>
						<p className="text-muted-foreground">{question.choices[chosen]}</p>
						<p className="mt-4 text-sm text-muted-foreground">Diğerleri bekleniyor…</p>
						{error && <p role="alert">{error}</p>}
					</Card>
				</Stage>
			);
		}
		return (
			<Stage wide className="gap-4 sm:gap-6 lg:gap-8">
				{/* Masaüstünde host ekranıyla aynı yerleşim ve boyutlar */}
				<div className="flex items-start justify-between gap-4 lg:gap-6">
					<div className="flex flex-col gap-2">
						<p className="font-semibold text-muted-foreground lg:text-lg">
							Soru {state.game.currentIndex + 1}/{state.game.questionCount}
						</p>
						<h1 className="text-2xl leading-tight font-bold tracking-tight sm:text-3xl lg:text-5xl">
							{question.text}
						</h1>
					</div>
					<Countdown
						remaining={remaining}
						limitMs={state.game.timeLimitSec * 1000}
						paused={paused}
					/>
				</div>
				<QuestionImage src={question.imageUrl} className="max-h-48 sm:max-h-72" />
				{paused && (
					<p
						role="status"
						className="rounded-xl border bg-white p-3 text-center font-medium"
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
					<p role="alert" className="text-center text-destructive">
						{error}
					</p>
				)}
			</Stage>
		);
	}

	if (phase === 'reveal' && question && reveal) {
		const verdict = reveal.myPoints
			? {
					cls: 'border-green-600 bg-green-50 text-green-800',
					title: 'Doğru!',
					sub: `+${reveal.myPoints} puan`,
				}
			: question.myChoice == null
				? {
						cls: 'border-border bg-white',
						title: 'Süre doldu',
						sub: 'Bu soruya cevap vermedin',
					}
				: {
						cls: 'border-destructive bg-red-50 text-red-800',
						title: 'Yanlış',
						sub: 'Bu sorudan puan yok',
					};
		return (
			<Stage wide className="gap-4 sm:gap-6 lg:gap-8">
				<div className={cn('rounded-2xl border-2 p-5 text-center', verdict.cls)}>
					<p className="text-3xl font-bold tracking-tight">{verdict.title}</p>
					<p>{verdict.sub}</p>
				</div>
				<p className="text-lg font-semibold lg:text-3xl lg:font-bold lg:tracking-tight">
					{question.text}
				</p>
				<Choices state={{ ...state, question }} open={false} size="player" />
				{reveal.explanation && (
					<p className="rounded-2xl border bg-white p-4 text-muted-foreground">
						{reveal.explanation}
					</p>
				)}
			</Stage>
		);
	}

	if ((phase === 'leaderboard' || phase === 'finished') && state.scores) {
		const rank = myRank(state.scores, me.id);
		const myScore = state.scores.find(s => s.id === me.id)?.score ?? 0;
		const finished = phase === 'finished';
		return (
			<Stage className="gap-5 sm:gap-6">
				<h1 className="text-3xl font-bold tracking-tight">
					{finished ? 'Sonuçlar' : 'Sıralama'}
				</h1>
				{finished && <Podium scores={state.scores} />}
				{rank && (
					<div className="flex items-center justify-between rounded-2xl bg-brand p-5 text-white">
						<div>
							<p className="text-4xl font-bold">{rank}.</p>
							<p className="text-white/85">{state.scores.length} kişi arasında</p>
						</div>
						<p className="text-3xl font-bold tabular-nums">{myScore}</p>
					</div>
				)}
				<Scoreboard scores={state.scores} meId={me.id} />
				{!finished && (
					<p className="text-center text-muted-foreground">Sıradaki soru birazdan…</p>
				)}
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
			<p className="mb-3 font-semibold">{players.length} kişi katıldı</p>
			<ul className="flex flex-wrap gap-2">
				{players.map(p => (
					<li
						key={p.id}
						className={cn(
							'animate-in rounded-full border px-3.5 py-1.5 text-sm font-medium duration-300 fade-in zoom-in-90 sm:text-base',
							p.id === meId ? 'border-brand bg-brand text-white' : 'bg-white',
						)}
					>
						{p.name}
					</li>
				))}
			</ul>
		</section>
	);
}

export function Stage({
	children,
	className,
	wide,
}: {
	children: React.ReactNode;
	className?: string;
	// Soru ekranları masaüstünde host ekranı kadar geniş
	wide?: boolean;
}) {
	return (
		<main className="stage flex flex-col px-4 py-6 sm:px-8 sm:py-10">
			<div
				className={cn(
					'mx-auto flex w-full max-w-2xl flex-1 flex-col',
					wide && 'lg:max-w-6xl',
					className,
				)}
			>
				{children}
			</div>
		</main>
	);
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<div
			className={cn(
				'mx-auto w-full max-w-md rounded-3xl border bg-white p-6 shadow-sm sm:p-8',
				className,
			)}
		>
			{children}
		</div>
	);
}

export function Centered({ children }: { children: React.ReactNode }) {
	return (
		<main className="stage flex flex-col items-center justify-center gap-2 p-6 text-center text-lg">
			{children}
		</main>
	);
}

// vignetim.com'daki siyah ana buton.
export function PrimaryButton({ className, ...props }: React.ComponentProps<'button'>) {
	return (
		<button
			className={cn(
				'h-12 rounded-xl bg-ink px-6 font-semibold text-white transition outline-none hover:bg-ink/85 focus-visible:ring-3 focus-visible:ring-brand/40 disabled:opacity-50',
				className,
			)}
			{...props}
		/>
	);
}

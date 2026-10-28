'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

const storageKey = (code: string) => `vigiz:token:${code}`;

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
	// Gizli oyuncu token'ı. undefined = localStorage henüz okunmadı, null = kayıtlı oyuncu yok
	const [token, setToken] = useState<string | null | undefined>(undefined);
	const [error, setError] = useState('');
	const { state, notFound, refresh, offset } = useGame(code, token ?? null);
	const remaining = useRemaining(state?.question ?? null, offset, !!state?.reveal, refresh);
	// Gönderilen ama state'e henüz yansımamış seçim (anında geri bildirim için)
	const [pending, setPending] = useState<{ index: number; choice: number } | null>(null);

	async function answer(choiceIndex: number) {
		if (!state) return;
		setPending({ index: state.game.currentIndex, choice: choiceIndex });
		setError('');
		try {
			const res = await fetch(`/api/games/${code}/answer`, {
				method: 'POST',
				body: JSON.stringify({ token, choiceIndex }),
			});
			if (!res.ok) setError((await res.json()).error ?? 'Cevap gönderilemedi');
			await refresh();
		} catch {
			// Ağ hatası: cevap kaydedilmedi; seçim temizlenir, oyuncu tekrar basabilir.
			setError('Bağlantı koptu, cevabın gönderilemedi. Tekrar dene.');
		} finally {
			setPending(null);
		}
	}

	async function join(body: { token?: string; name?: string }) {
		try {
			const res = await fetch(`/api/games/${code}/join`, {
				method: 'POST',
				body: JSON.stringify(body),
			});
			const data = await res.json();
			if (res.ok) {
				writeStored(code, data.token);
				setToken(data.token);
				setError('');
				return;
			}
			// Kimlik sadece sunucu "bu odada kaydın yok" dediğinde (400) silinir.
			if (body.token && res.status !== 400) throw new Error(data.error);
			if (body.token) writeStored(code, null);
			setToken(null);
			setError(body.token ? '' : data.error);
		} catch {
			if (!body.token) return setError('Bağlantı koptu, tekrar dene.');
			// Yeniden bağlanırken geçici hata: kimliği koru, biraz sonra tekrar dene.
			setTimeout(() => join(body), 2000);
		}
	}

	// Bitmiş oyuna kaydı olmayan biri gelirse doğrudan ana sayfaya.
	const router = useRouter();
	const finishedForStranger = token === null && state?.game.phase === 'finished';
	useEffect(() => {
		if (finishedForStranger) router.replace('/');
	}, [finishedForStranger, router]);

	// Sayfa yenilenince / geri gelinince kayıtlı token ile yeniden bağlan.
	// biome-ignore lint/correctness/useExhaustiveDependencies: sadece ilk açılışta
	useEffect(() => {
		const stored = readStored(code);
		if (stored) join({ token: stored });
		else setToken(null);
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
	// token ayarlandı ama state henüz o oyuncuyla yeniden çekilmediyse isim formunu gösterme.
	if (token === undefined || !state || (token && !state.me)) {
		return <Centered>Yükleniyor…</Centered>;
	}

	if (!state.me) {
		if (state.game.phase === 'finished') return <Centered>Yükleniyor…</Centered>;
		// Masaüstünde host lobisiyle aynı genişlik ve boyutlar
		return (
			<Stage wide className="justify-center gap-6 lg:gap-8">
				<div className="flex flex-col items-center gap-6 rounded-3xl border bg-white px-6 py-8 text-center shadow-sm lg:gap-8 lg:py-12">
					<div>
						<p className="text-muted-foreground lg:text-xl">{state.quiz.topic}</p>
						<h1 className="text-3xl font-bold tracking-tight lg:text-5xl">
							{state.quiz.title}
						</h1>
					</div>
					<form
						className="flex w-full max-w-md flex-col gap-3 text-left"
						onSubmit={e => {
							e.preventDefault();
							join({ name: String(new FormData(e.currentTarget).get('name')) });
						}}
					>
						<label htmlFor="name" className="text-sm font-medium lg:text-base">
							Sıralamada görünecek adın
						</label>
						<input
							id="name"
							name="name"
							maxLength={30}
							autoComplete="nickname"
							required
							className={cn(FIELD, 'lg:h-14 lg:text-lg')}
						/>
						{error && (
							<p role="alert" className="text-sm text-destructive">
								{error}
							</p>
						)}
						<PrimaryButton type="submit" className="lg:h-14 lg:text-lg">
							Katıl
						</PrimaryButton>
					</form>
				</div>
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
			<Stage wide className="gap-6 lg:gap-8">
				<div className="flex flex-col items-center gap-3 rounded-3xl border bg-white px-6 py-8 text-center shadow-sm lg:py-12">
					<span className="inline-block rounded-full border border-brand/30 bg-brand-tint px-3 py-1 text-sm text-brand-ink lg:text-base">
						{state.quiz.title}
					</span>
					<h1 className="text-3xl font-bold tracking-tight lg:text-5xl">
						Hazırsın, {me.name}
					</h1>
					<p className="text-muted-foreground lg:text-xl">
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
			<Stage wide className="gap-5 sm:gap-6 lg:gap-8">
				{finished ? (
					<div className="flex items-center justify-between gap-4">
						<h1 className="text-3xl font-bold tracking-tight lg:text-5xl">Sonuçlar</h1>
						<Link
							href="/"
							className="flex h-11 shrink-0 items-center rounded-xl bg-ink px-5 font-semibold text-white hover:bg-ink/85 lg:h-14 lg:px-8 lg:text-lg"
						>
							Ana sayfaya dön
						</Link>
					</div>
				) : (
					<h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
						{state.game.currentIndex + 1}. sorudan sonra sıralama
					</h1>
				)}
				{finished && <Podium scores={state.scores} />}
				{rank && (
					<div className="flex items-center justify-between rounded-2xl bg-brand p-5 text-white lg:p-6">
						<div>
							<p className="text-4xl font-bold lg:text-5xl">{rank}.</p>
							<p className="text-white/85 lg:text-lg">
								{state.scores.length} kişi arasında
							</p>
						</div>
						<p className="text-3xl font-bold tabular-nums lg:text-4xl">{myScore}</p>
					</div>
				)}
				<Scoreboard scores={state.scores} meId={me.id} />
				{!finished && (
					<p className="text-center text-muted-foreground lg:text-lg">
						Sıradaki soru birazdan…
					</p>
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

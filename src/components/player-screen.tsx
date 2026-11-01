'use client';

import { Check, Lock, Share2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { FIELD, LETTERS, Wordmark } from '@/components/brand';
import {
	BuzzerImage,
	Choices,
	Countdown,
	myRank,
	Podium,
	QuestionImage,
	Scoreboard,
	trueFalseLabel,
	useRemaining,
} from '@/components/game-views';
import { useDict, useLocale } from '@/components/locale-provider';
import { useGame } from '@/hooks/use-game';
import type { GameState } from '@/lib/game-types';
import { homePath } from '@/lib/i18n';
import { blurLevel } from '@/lib/scoring';
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
	const t = useDict();
	const locale = useLocale();
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
			if (!res.ok) setError((await res.json()).error ?? t.play.answerFailed);
			await refresh();
		} catch {
			// Ağ hatası: cevap kaydedilmedi; seçim temizlenir, oyuncu tekrar basabilir.
			setError(t.play.answerDisconnected);
		} finally {
			setPending(null);
		}
	}

	async function buzz() {
		setError('');
		try {
			const res = await fetch(`/api/games/${code}/buzz`, {
				method: 'POST',
				body: JSON.stringify({ token }),
			});
			if (!res.ok) setError((await res.json()).error ?? t.play.buzzFailed);
			await refresh();
		} catch {
			setError(t.play.buzzDisconnected);
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
			if (!body.token) return setError(t.common.disconnected);
			// Yeniden bağlanırken geçici hata: kimliği koru, biraz sonra tekrar dene.
			setTimeout(() => join(body), 2000);
		}
	}

	// Bitmiş oyuna kaydı olmayan biri gelirse doğrudan ana sayfaya.
	const router = useRouter();
	const finishedForStranger = token === null && state?.game.phase === 'finished';
	useEffect(() => {
		if (finishedForStranger) router.replace(homePath(locale));
	}, [finishedForStranger, router, locale]);

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
				<p className="text-2xl font-semibold tracking-tight">{t.play.roomClosed}</p>
				<p className="text-muted-foreground">{t.play.roomClosedHint}</p>
				<a href={homePath(locale)} className="mt-4 font-medium text-brand-ink underline">
					{t.play.reenterCode}
				</a>
			</Centered>
		);
	}
	// token ayarlandı ama state henüz o oyuncuyla yeniden çekilmediyse isim formunu gösterme.
	if (token === undefined || !state || (token && !state.me)) {
		return <Centered>{t.common.loading}</Centered>;
	}

	if (!state.me) {
		if (state.game.phase === 'finished') return <Centered>{t.common.loading}</Centered>;
		return (
			<Stage>
				<form
					className="flex flex-1 flex-col gap-6"
					onSubmit={e => {
						e.preventDefault();
						join({ name: String(new FormData(e.currentTarget).get('name')) });
					}}
				>
					<Wordmark className="text-2xl" />
					<Card className="flex flex-col gap-2">
						<p className="eyebrow">{t.common.room(state.game.code)}</p>
						<h1>{state.quiz.title}</h1>
						<p className="text-ink-600">
							{state.quiz.topic && `${state.quiz.topic}, `}
							{t.play.questionCount(state.game.questionCount)}
						</p>
						{state.quiz.authorName && (
							<p className="text-sm text-ink-600">
								{t.play.author(state.quiz.authorName)}
							</p>
						)}
					</Card>
					<div className="flex flex-col gap-2">
						<label htmlFor="name" className="font-medium">
							{t.play.yourName}
						</label>
						<input
							id="name"
							name="name"
							maxLength={30}
							autoComplete="nickname"
							required
							className={FIELD}
						/>
						<p className="text-sm text-ink-600">{t.play.nameHint}</p>
						{error && (
							<p role="alert" className="text-sm text-destructive">
								{error}
							</p>
						)}
					</div>
					<PrimaryButton type="submit" className="mt-auto w-full">
						{t.play.joinGame}
					</PrimaryButton>
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
			<Stage className="gap-6">
				<Wordmark className="text-2xl" />
				<Card className="flex flex-col items-center gap-3 text-center">
					<Avatar name={me.name} className="size-20 text-3xl" />
					<h1>{t.play.ready(me.name)}</h1>
					<p className="text-ink-600">{t.play.waitStart}</p>
				</Card>
				<PlayerList players={state.players} meId={me.id} />
				<p className="mt-auto text-center text-sm text-ink-600">{t.play.refreshHint}</p>
			</Stage>
		);
	}

	if (question?.type === 'buzzer' && (phase === 'question' || phase === 'reveal')) {
		return (
			<BuzzerPlayerView
				state={state}
				code={code}
				meId={me.id}
				remaining={remaining}
				onBuzz={buzz}
				error={error}
			/>
		);
	}

	if (phase === 'question' && question) {
		const paused = !!question.pausedAt;
		const watching = remaining > state.game.timeLimitSec * 1000;
		const chosen = question.myChoice;
		return (
			<Stage className="gap-4">
				<QuestionHeader state={state} remaining={remaining} paused={paused} />
				<Card className="flex flex-col gap-2 p-5 sm:p-6">
					<p className="eyebrow">{t.formats[question.type].label}</p>
					<h2>{question.text}</h2>
				</Card>
				<QuestionImage src={question.imageUrl} className="max-h-48 sm:max-h-72" />
				{(paused || watching) && (
					<p
						role="status"
						className="rounded-xl border bg-white p-3 text-center font-medium"
					>
						{paused ? t.play.gamePaused : t.play.watchVideo}
					</p>
				)}
				<Choices
					state={{ ...state, question }}
					open={chosen == null && !paused && !watching && remaining > 0}
					onChoose={answer}
					size="player"
				/>
				{chosen != null && (
					<p
						role="status"
						className="mt-auto flex items-center justify-center gap-2 rounded-xl border bg-white p-4 font-semibold"
					>
						<Lock className="size-4 text-accent-800" aria-hidden />
						{t.play.locked}
					</p>
				)}
				{error && (
					<p role="alert" className="text-center text-destructive">
						{error}
					</p>
				)}
			</Stage>
		);
	}

	if (phase === 'reveal' && question && reveal) {
		const right = !!reveal.myPoints;
		const answered = question.myChoice != null;
		const correctText =
			question.type === 'truefalse'
				? trueFalseLabel(t, reveal.correctIndex)
				: `${LETTERS[reveal.correctIndex]}) ${question.choices[reveal.correctIndex]}`;
		return (
			<Stage className="gap-4">
				<ResultCard
					right={right}
					title={right ? t.play.right : answered ? t.play.wrong : t.play.timeUp}
					sub={
						right
							? t.play.plusPoints(reveal.myPoints ?? 0)
							: t.play.correctAnswerIs(correctText)
					}
				/>
				<Card className="flex flex-col gap-4 p-5 sm:p-6">
					<h2>{question.text}</h2>
					<Choices state={{ ...state, question }} open={false} size="player" />
				</Card>
				{reveal.explanation && <Explanation text={reveal.explanation} />}
				<p className="mt-auto text-center text-ink-600">{t.play.waitingNext}</p>
			</Stage>
		);
	}

	if ((phase === 'leaderboard' || phase === 'finished') && state.scores) {
		const rank = myRank(state.scores, me.id);
		const myScore = state.scores.find(s => s.id === me.id)?.score ?? 0;
		const finished = phase === 'finished';
		return (
			<Stage wide className="gap-5 sm:gap-6 lg:gap-8">
				<h1>
					{finished ? t.play.results : t.game.rankingAfter(state.game.currentIndex + 1)}
				</h1>
				{finished && <Podium scores={state.scores} />}
				{rank && (
					<div className="flex items-center justify-between rounded-3xl border-2 border-ink-900 bg-white p-5 lg:p-6">
						<div>
							<p className="eyebrow">{t.play.yourResult}</p>
							<p className="text-4xl font-bold tabular-nums">{rank}.</p>
							<p className="text-ink-600">{t.play.amongN(state.scores.length)}</p>
						</div>
						<p className="text-3xl font-bold tabular-nums">
							{myScore}
							<span className="ml-1 text-base font-medium text-ink-600">
								{t.common.points}
							</span>
						</p>
					</div>
				)}
				<Scoreboard scores={state.scores} meId={me.id} />
				{finished ? (
					<FinishedActions
						code={code}
						shareText={rank ? t.play.shareText(rank, state.scores.length, myScore) : ''}
					/>
				) : (
					<p className="text-center text-ink-600">{t.play.nextSoon}</p>
				)}
			</Stage>
		);
	}

	return <Centered>{t.common.loading}</Centered>;
}

// Oyun sonu: oyuncuyu host'a çeviren çağrı ve sonucu paylaşma (link herkese açık sonuç sayfası).
function FinishedActions({ code, shareText }: { code: string; shareText: string }) {
	const t = useDict();
	const locale = useLocale();
	const [copied, setCopied] = useState(false);

	async function share() {
		const url = `${window.location.origin}/results/${code}`;
		if (navigator.share) {
			// Kullanıcı paylaşım penceresini kapatırsa hata fırlatır; yapılacak bir şey yok.
			await navigator.share({ text: shareText, url }).catch(() => {});
			return;
		}
		await navigator.clipboard?.writeText(`${shareText} ${url}`);
		setCopied(true);
	}

	return (
		<div className="mt-auto flex flex-col gap-3">
			<div className="grid grid-cols-2 gap-2">
				{shareText && (
					<button
						type="button"
						onClick={share}
						className="flex h-14 items-center justify-center gap-2 rounded-full border-[1.5px] border-ink-300 bg-white px-4 font-semibold hover:bg-ink-50"
					>
						<Share2 className="size-4" aria-hidden />
						{copied ? t.play.shareCopied : t.play.share}
					</button>
				)}
				<Link
					href={homePath(locale)}
					className={cn(
						'flex h-14 items-center justify-center rounded-full border-[1.5px] border-ink-300 bg-white px-4 font-semibold hover:bg-ink-50',
						!shareText && 'col-span-2',
					)}
				>
					{t.play.backHome}
				</Link>
			</div>
			<p className="text-center text-sm text-ink-600">
				{t.play.makeYourOwnHint}{' '}
				<Link
					href="/register?from=game"
					className="font-semibold text-ink-900 underline underline-offset-4"
				>
					{t.play.makeYourOwn}
				</Link>
			</p>
		</div>
	);
}

// Soru X / Y, yuvarlak sayaç ve altında kalan süreyi gösteren ince çubuk.
function QuestionHeader({
	state,
	remaining,
	paused,
}: {
	state: GameState;
	remaining: number;
	paused: boolean;
}) {
	const limitMs = state.game.timeLimitSec * 1000;
	const t = useDict();
	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-4">
				<p className="font-mono text-sm font-medium text-ink-600 uppercase">
					{t.common.questionOf(state.game.currentIndex + 1, state.game.questionCount)}
				</p>
				<Countdown remaining={remaining} limitMs={limitMs} paused={paused} />
			</div>
			<div className="h-1.5 overflow-hidden rounded-full bg-ink-200" aria-hidden>
				<div
					className="h-full rounded-full bg-accent-400 transition-[width] duration-300 ease-linear"
					style={{ width: `${(Math.min(remaining, limitMs) / limitMs) * 100}%` }}
				/>
			</div>
		</div>
	);
}

// Doğru: lacivert kart ve yeşil tik. Yanlış ya da cevapsız: beyaz kart ve çarpı.
function ResultCard({ right, title, sub }: { right: boolean; title: string; sub: string }) {
	const Icon = right ? Check : X;
	return (
		<div
			role="status"
			className={cn(
				'flex items-center gap-4 rounded-3xl border p-5 sm:p-6',
				right ? 'border-ink-900 bg-ink-900 text-cream' : 'bg-white',
			)}
		>
			<span
				className={cn(
					'flex size-14 shrink-0 items-center justify-center rounded-full',
					right ? 'bg-forest text-white' : 'bg-wrong-bg text-wrong',
				)}
			>
				<Icon className="size-8" strokeWidth={3} aria-hidden />
			</span>
			<div>
				<p className="text-2xl font-semibold tracking-tight">{title}</p>
				<p className={right ? 'text-accent-200' : 'text-ink-600'}>{sub}</p>
			</div>
		</div>
	);
}

function Explanation({ text }: { text: string }) {
	const t = useDict();
	return (
		<div className="rounded-3xl border bg-white p-5">
			<p className="eyebrow mb-1">{t.play.explanation}</p>
			<p className="text-ink-700">{text}</p>
		</div>
	);
}

export function Avatar({ name, className }: { name: string; className?: string }) {
	const locale = useLocale();
	const initials = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(w => w[0])
		.join('')
		.toLocaleUpperCase(locale);
	return (
		<span
			aria-hidden
			className={cn(
				'flex shrink-0 items-center justify-center rounded-full bg-ink-900 font-semibold text-white',
				className,
			)}
		>
			{initials}
		</span>
	);
}

export function PlayerList({
	players,
	meId,
}: {
	players: { id: string; name: string }[];
	meId?: string;
}) {
	const t = useDict();
	return (
		<section aria-label={t.game.players}>
			<p className="mb-3 font-semibold">
				{t.game.inRoom}{' '}
				<span className="font-normal text-ink-600">
					{t.game.peopleCount(players.length)}
				</span>
			</p>
			<ul className="flex flex-wrap gap-2">
				{players.map(p => (
					<li
						key={p.id}
						className={cn(
							'animate-in rounded-full border px-3.5 py-1.5 text-sm font-medium duration-300 fade-in zoom-in-90 sm:text-base',
							p.id === meId ? 'border-ink-900 bg-accent-50 text-ink-900' : 'bg-white',
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
					'mx-auto flex w-full max-w-xl flex-1 flex-col',
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
		<div className={cn('w-full rounded-3xl border bg-white p-6 sm:p-8', className)}>
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

// Ekrandaki tek birincil aksiyon: koyu hap üzerinde beyaz yazı.
export function PrimaryButton({ className, ...props }: React.ComponentProps<'button'>) {
	return (
		<button
			className={cn(
				'h-14 rounded-full bg-ink-900 px-6 text-lg font-bold text-white transition outline-none hover:bg-ink-700 focus-visible:ring-3 focus-visible:ring-ink-900/40 disabled:opacity-50',
				className,
			)}
			{...props}
		/>
	);
}

function BuzzerPlayerView({
	state,
	code,
	meId,
	remaining,
	onBuzz,
	error,
}: {
	state: GameState;
	code: string;
	meId: string;
	remaining: number;
	onBuzz: () => void;
	error: string;
}) {
	const t = useDict();
	const { question, reveal } = state;
	const queue = state.buzzer?.queue ?? [];
	const pending = queue.filter(b => !b.verdict);
	const mine = queue.find(b => b.id === meId);
	const myTurn = pending.findIndex(b => b.id === meId);
	if (!question) return null;

	if (reveal) {
		const mineRight = (reveal.myPoints ?? 0) > 0;
		return (
			<Stage className="gap-4">
				{reveal.myPoints ? (
					<ResultCard
						right={mineRight}
						title={mineRight ? t.play.right : t.play.wrong}
						sub={
							mineRight
								? t.play.plusPoints(reveal.myPoints)
								: t.play.pointsN(reveal.myPoints)
						}
					/>
				) : (
					<ResultCard
						right={false}
						title={
							reveal.winner
								? t.play.someoneGotIt(reveal.winner.name)
								: t.play.nobodyGotIt
						}
						sub={
							reveal.winner
								? t.play.gainedPoints(reveal.winner.points)
								: t.play.noPoints
						}
					/>
				)}
				<Card className="flex flex-col gap-3 p-5 sm:p-6">
					<p className="eyebrow">{t.game.correctAnswer}</p>
					<h2>{reveal.answerText}</h2>
					<BuzzerImage
						code={code}
						level={10}
						src={question.imageUrl}
						className="max-h-[40vh]"
					/>
				</Card>
				{reveal.explanation && <Explanation text={reveal.explanation} />}
				<p className="mt-auto text-center text-ink-600">{t.play.waitingNext}</p>
			</Stage>
		);
	}

	const answering = pending[0];
	// Seviye istemcide kalan süreden hesaplanır (state sadece olaylarda yenilenir, yoksa görsel
	// ilk halinde kalırdı). Sunucu görseli yine kendi saatine göre verir.
	const level = blurLevel(remaining, state.game.timeLimitSec * 1000);
	return (
		<Stage className="gap-4">
			<QuestionHeader state={state} remaining={remaining} paused={!!question.pausedAt} />
			<h2>{question.text || t.common.whatIsThis}</h2>
			<div className="relative">
				<BuzzerImage code={code} level={level} src={null} className="max-h-[45vh]" />
				<span className="absolute top-3 left-3 rounded-full bg-white px-3 py-1 text-sm font-semibold">
					{t.play.clarity(level * 10)}
				</span>
			</div>
			<p className="text-ink-600">{t.play.buzzHint}</p>
			{answering && answering.id !== meId && (
				<p role="status" className="rounded-xl border bg-white p-3 text-center font-medium">
					{t.play.answering(answering.name)}
				</p>
			)}
			<div className="mt-auto">
				{mine?.verdict === 'wrong' ? (
					<p className="rounded-3xl border bg-white p-5 text-center text-lg font-semibold text-wrong">
						{t.play.wrongBuzz}
					</p>
				) : myTurn === 0 ? (
					<p className="rounded-3xl bg-ink-900 p-6 text-center text-2xl font-bold text-white">
						{t.play.yourTurn}
					</p>
				) : myTurn > 0 ? (
					<p className="rounded-3xl border-2 border-ink-900 bg-accent-50 p-6 text-center text-2xl font-bold text-ink-900">
						{t.play.yourPlace(myTurn + 1)}
					</p>
				) : (
					<button
						type="button"
						onClick={onBuzz}
						disabled={remaining <= 0}
						className="h-24 w-full rounded-full bg-accent-400 text-3xl font-bold tracking-tight text-ink-900 transition outline-none hover:bg-accent-300 focus-visible:ring-4 focus-visible:ring-ink-900/40 active:translate-y-0.5 disabled:opacity-40"
					>
						{remaining > 0 ? t.play.buzz : t.play.timeUp}
					</button>
				)}
			</div>
			{error && (
				<p role="alert" className="text-center text-destructive">
					{error}
				</p>
			)}
		</Stage>
	);
}

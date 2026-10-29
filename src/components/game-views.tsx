'use client';

import { Check, ChevronDown, ChevronUp, Flame, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

import { LETTERS } from '@/components/brand';
import type { GameState } from '@/lib/game-types';
import { GRACE_MS } from '@/lib/scoring';
import { cn } from '@/lib/utils';

// Kalan süre (ms). Süre dolunca, sunucu reveal'a geçene kadar saniyede bir onExpire çağrılır
// (cihaz saati sunucudan biraz öndeyse ilk istek erken kalabilir).
export function useRemaining(
	question: GameState['question'],
	offset: number,
	revealed: boolean,
	onExpire: () => void,
): number {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (!question || question.pausedAt || revealed) return;
		const id = setInterval(() => setNow(Date.now()), 250);
		return () => clearInterval(id);
	}, [question, revealed]);

	const remaining = question ? question.deadline - (question.pausedAt ?? now + offset) : 0;
	const expired = !!question && !question.pausedAt && !revealed && remaining < -GRACE_MS;

	useEffect(() => {
		if (!expired) return;
		onExpire();
		const id = setInterval(onExpire, 1000);
		return () => clearInterval(id);
	}, [expired, onExpire]);

	return Math.max(remaining, 0);
}

export function Countdown({
	remaining,
	limitMs,
	paused,
	size = 'md',
}: {
	remaining: number;
	limitMs: number;
	paused: boolean;
	size?: 'md' | 'lg';
}) {
	const r = 44;
	const circumference = 2 * Math.PI * r;
	// Videolu soruda klip oynarken süre henüz başlamadı: tam halka.
	remaining = Math.min(remaining, limitMs);
	const low = remaining <= 5000;
	return (
		<div
			className={cn(
				'relative shrink-0',
				size === 'lg' ? 'size-24 lg:size-28' : 'size-14 sm:size-16 lg:size-28',
			)}
			role="timer"
			aria-label={paused ? 'Duraklatıldı' : `${Math.ceil(remaining / 1000)} saniye`}
		>
			<svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
				<circle
					cx="50"
					cy="50"
					r={r}
					className="fill-white stroke-ink-200"
					strokeWidth="8"
				/>
				<circle
					cx="50"
					cy="50"
					r={r}
					strokeWidth="8"
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={circumference * (1 - remaining / limitMs)}
					className={cn(
						'fill-none transition-[stroke-dashoffset] duration-300 ease-linear',
						low ? 'stroke-wrong' : 'stroke-accent-500',
					)}
				/>
			</svg>
			<span
				aria-hidden
				className={cn(
					'absolute inset-0 flex items-center justify-center font-mono font-medium tabular-nums',
					size === 'lg' ? 'text-4xl' : 'text-xl sm:text-2xl lg:text-4xl',
					low && 'text-wrong',
				)}
			>
				{paused ? 'II' : Math.ceil(remaining / 1000)}
			</span>
		</div>
	);
}

// Şık kartları. Cevap gösteriminde her kartın altında seçen kişi oranı kadar dolan bir çubuk var.
export function Choices({
	state,
	open,
	onChoose,
	size,
}: {
	state: GameState;
	open: boolean;
	onChoose?: (index: number) => void;
	size: 'host' | 'player';
}) {
	const { question, reveal } = state;
	if (!question) return null;
	const total = reveal
		? Math.max(
				1,
				reveal.counts.reduce((a, b) => a + b, 0),
			)
		: 1;

	return (
		<div className={cn('grid gap-2.5', size === 'host' && 'sm:grid-cols-2 sm:gap-3')}>
			{question.choices.map((choice, i) => {
				const chosen = question.myChoice === i;
				const correct = reveal?.correctIndex === i;
				const wrongPick = !!reveal && chosen && !correct;
				const Mark = correct ? Check : wrongPick ? X : null;
				return (
					<button
						key={i}
						type="button"
						disabled={!onChoose || !open}
						onClick={() => onChoose?.(i)}
						aria-pressed={onChoose ? chosen : undefined}
						className={cn(
							'relative flex items-center gap-3 overflow-hidden rounded-2xl border-2 bg-white p-3 text-left font-medium transition sm:p-4',
							size === 'host'
								? 'min-h-20 text-xl lg:min-h-24 lg:text-2xl'
								: 'min-h-16 text-lg',
							open && onChoose && 'hover:border-accent-600 active:scale-[0.99]',
							!reveal && chosen && 'border-ink-900 bg-accent-50',
							!reveal && !chosen && 'border-ink-200',
							correct && 'border-forest bg-forest/10',
							wrongPick && 'border-wrong bg-wrong-bg',
							reveal && !correct && !wrongPick && 'border-ink-200 text-ink-600',
						)}
					>
						<span
							className={cn(
								'flex size-10 shrink-0 items-center justify-center rounded-xl text-base font-bold',
								size === 'host' && 'lg:size-12 lg:text-lg',
								correct
									? 'bg-forest text-white'
									: !reveal && chosen
										? 'bg-accent-400 text-ink-900'
										: wrongPick
											? 'bg-wrong text-white'
											: 'bg-ink-100 text-ink-700',
							)}
						>
							{question.type === 'truefalse' ? (
								i === 0 ? (
									<Check className="size-5" strokeWidth={3} aria-hidden />
								) : (
									<X className="size-5" strokeWidth={3} aria-hidden />
								)
							) : (
								LETTERS[i]
							)}
						</span>
						<span className="flex-1">{choice}</span>
						{reveal && (
							<span className="font-semibold tabular-nums">
								{reveal.counts[i]}
								<span className="sr-only"> kişi seçti</span>
							</span>
						)}
						{Mark && (
							<Mark
								className={cn(
									'size-6 shrink-0',
									correct ? 'text-forest' : 'text-wrong',
								)}
								strokeWidth={3}
								aria-label={correct ? 'Doğru cevap' : 'Senin yanlış cevabın'}
							/>
						)}
						{reveal && (
							<span
								aria-hidden
								className={cn(
									'absolute bottom-0 left-0 h-1.5 transition-[width] duration-700 ease-out',
									correct ? 'bg-forest' : 'bg-ink-300',
								)}
								style={{ width: `${(reveal.counts[i] / total) * 100}%` }}
							/>
						)}
					</button>
				);
			})}
		</div>
	);
}

export type QuestionVideo = { id: string; start: number; cut: number; end: number | null };

// Host ekranında YouTube klibi: soruda start → cut, cevapta cut → end. Telefonlarda gösterilmez.
export function VideoClip({ video, reveal }: { video: QuestionVideo; reveal: boolean }) {
	const params = new URLSearchParams({
		start: String(reveal ? video.cut : video.start),
		autoplay: '1',
		rel: '0',
		...(reveal ? video.end && { end: String(video.end) } : { end: String(video.cut) }),
	});
	const src = `https://www.youtube-nocookie.com/embed/${video.id}?${params}`;
	return (
		<iframe
			key={src}
			src={src}
			title="Video"
			allow="autoplay; encrypted-media; picture-in-picture"
			allowFullScreen
			className="mx-auto aspect-video w-full max-w-3xl rounded-2xl bg-ink"
		/>
	);
}

export function QuestionImage({ src, className }: { src: string | null; className?: string }) {
	if (!src) return null;
	return (
		// biome-ignore lint/performance/noImgElement: dış URL'ler için next/image domain ayarı gerekir
		<img src={src} alt="" className={cn('mx-auto rounded-2xl object-contain', className)} />
	);
}

// Her satırın arkasında puanın lidere oranı kadar bir çubuk var. Sıralama fazında (gained dolu)
// çubuk önceki puandan yeni puana uzar, puan yukarı sayar ve "+kazanılan" rozeti belirir.
export function Scoreboard({
	scores,
	meId,
	limit,
}: {
	scores: NonNullable<GameState['scores']>;
	meId?: string;
	limit?: number;
}) {
	const max = Math.max(1, ...scores.map(s => s.score));
	const animated = scores.some(s => s.gained !== undefined);
	// Sıra değişimi: önceki puanlara göre (score − gained) eski sıra.
	const before = animated
		? new Map(
				[...scores]
					.sort((a, b) => b.score - (b.gained ?? 0) - (a.score - (a.gained ?? 0)))
					.map((s, i) => [s.id, i]),
			)
		: null;
	const [grown, setGrown] = useState(!animated);
	useEffect(() => {
		if (!animated) return;
		// İlk kare eski genişlikle çizilsin, sonra yeni genişliğe geçsin (CSS transition).
		const id = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)));
		return () => cancelAnimationFrame(id);
	}, [animated]);

	return (
		<ol className="flex flex-col gap-1.5">
			{scores.slice(0, limit).map((s, i) => {
				const gained = s.gained ?? 0;
				const moved = before ? (before.get(s.id) ?? i) - i : 0;
				const shown = grown ? s.score : s.score - gained;
				return (
					<li
						key={s.id}
						className={cn(
							'relative flex items-center gap-3 overflow-hidden rounded-xl border bg-white px-4 py-2.5 sm:text-lg lg:py-3',
							s.id === meId && 'border-ink-900 font-semibold',
						)}
					>
						<span
							aria-hidden
							className={cn(
								'absolute inset-y-0 left-0 transition-[width] duration-1000 ease-out',
								s.id === meId ? 'bg-accent-100' : 'bg-accent-50',
							)}
							style={{ width: `${(Math.max(shown, 0) / max) * 100}%` }}
						/>
						<span
							className={cn(
								'relative w-7 text-right font-bold tabular-nums',
								i < 3 ? 'text-accent-800' : 'text-ink-600',
							)}
						>
							{i + 1}
						</span>
						<span className="relative flex min-w-0 flex-1 items-center gap-2">
							<span className="truncate">{s.name}</span>
							{!!s.streak && (
								// Seri sayısı alevin içinde
								<span
									className="relative flex size-8 shrink-0 items-center justify-center"
									title={`${s.streak} soru üst üste doğru`}
								>
									<Flame
										className="absolute size-8 fill-accent-400 stroke-ink-900"
										aria-hidden
									/>
									<span className="relative mt-2 text-xs font-extrabold text-white">
										{s.streak}
									</span>
									<span className="sr-only"> soru üst üste doğru</span>
								</span>
							)}
							{s.fastest && (
								<span
									className="flex shrink-0 items-center rounded-full bg-accent-50 p-1 text-accent-800"
									title="Bu turun en hızlısı"
								>
									<Zap
										className="size-4 fill-accent-400 stroke-ink-900"
										aria-hidden
									/>
									<span className="sr-only">Bu turun en hızlısı</span>
								</span>
							)}
						</span>
						{animated && gained !== 0 && (
							<span
								className={cn(
									'relative animate-in rounded-full px-2 py-0.5 text-sm font-semibold text-white delay-300 duration-500 fill-mode-backwards fade-in slide-in-from-left-4',
									gained > 0 ? 'bg-ink-900' : 'bg-wrong',
								)}
							>
								{gained > 0 ? `+${gained}` : `−${-gained}`}
							</span>
						)}
						{moved !== 0 && (
							<span
								className={cn(
									'relative flex items-center text-sm font-semibold tabular-nums',
									moved > 0 ? 'text-accent-800' : 'text-ink-600',
								)}
								title={
									moved > 0
										? `${moved} basamak yükseldi`
										: `${-moved} basamak düştü`
								}
							>
								{moved > 0 ? (
									<ChevronUp className="size-4" aria-hidden />
								) : (
									<ChevronDown className="size-4" aria-hidden />
								)}
								{Math.abs(moved)}
								<span className="sr-only">
									{moved > 0 ? ' basamak yükseldi' : ' basamak düştü'}
								</span>
							</span>
						)}
						<span className="relative font-bold tabular-nums">
							<CountUp from={s.score - gained} to={s.score} run={grown} />
						</span>
					</li>
				);
			})}
		</ol>
	);
}

function CountUp({ from, to, run }: { from: number; to: number; run: boolean }) {
	const [value, setValue] = useState(from);
	useEffect(() => {
		if (!run || from === to || matchMedia('(prefers-reduced-motion: reduce)').matches) {
			setValue(run ? to : from);
			return;
		}
		const start = performance.now();
		let id = 0;
		const tick = (now: number) => {
			const t = Math.min((now - start) / 1000, 1);
			setValue(Math.round(from + (to - from) * (1 - (1 - t) ** 3)));
			if (t < 1) id = requestAnimationFrame(tick);
		};
		id = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(id);
	}, [from, to, run]);
	return <>{value}</>;
}

export function Podium({ scores }: { scores: NonNullable<GameState['scores']> }) {
	// 2. - 1. - 3. sırasıyla yan yana
	const order = [1, 0, 2].filter(i => scores[i]);
	const blocks = [
		'h-36 bg-ink-900 text-white',
		'h-24 bg-accent-400 text-ink-900',
		'h-16 bg-accent-200 text-ink-900',
	];
	return (
		<div className="flex items-end justify-center gap-2 sm:gap-4">
			{order.map(i => (
				<div
					key={scores[i].id}
					className="flex w-28 flex-col items-center gap-1 text-center sm:w-40"
				>
					<span className="w-full truncate font-semibold sm:text-xl">
						{scores[i].name}
					</span>
					<span className="text-sm text-ink-600 tabular-nums sm:text-base">
						{scores[i].score}
					</span>
					<div
						className={cn(
							'flex w-full items-start justify-center rounded-t-2xl pt-2 text-3xl font-bold',
							blocks[i],
						)}
					>
						{i + 1}
					</div>
				</div>
			))}
		</div>
	);
}

export function myRank(scores: GameState['scores'], meId?: string): number | null {
	const i = scores?.findIndex(s => s.id === meId) ?? -1;
	return i >= 0 ? i + 1 : null;
}

// Bulanık görsel: soru sırasında sunucunun bulanıklaştırdığı hali (seviye değiştikçe yenilenir),
// cevap gösteriminde net hali. Net URL soru sırasında tarayıcıya hiç gelmez.
export function BuzzerImage({
	code,
	level,
	src,
	className,
}: {
	code: string;
	level: number | undefined;
	src: string | null;
	className?: string;
}) {
	const url = src ?? `/api/games/${code}/image?l=${level ?? 0}`;
	// Yeni seviye arka planda yüklenip hazır olunca değiştirilir: arada boş kare görünmez.
	const [shown, setShown] = useState(url);
	useEffect(() => {
		let live = true;
		const img = new Image();
		img.onload = () => live && setShown(url);
		img.src = url;
		return () => {
			live = false;
		};
	}, [url]);
	return (
		// biome-ignore lint/performance/noImgElement: sunucunun ürettiği görsel, next/image gerekmez
		<img
			src={shown}
			alt={src ? 'Görsel' : 'Bulanık görsel'}
			className={cn(
				'mx-auto w-full rounded-2xl bg-muted object-contain transition-[filter] duration-500',
				className,
			)}
		/>
	);
}

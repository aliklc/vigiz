'use client';

import { useEffect, useState } from 'react';

import { CHOICE_BG, CHOICE_TEXT, ChoiceShape } from '@/components/brand';
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
	const r = 42;
	const circumference = 2 * Math.PI * r;
	const low = remaining <= 5000;
	return (
		<div
			className={cn('relative shrink-0', size === 'lg' ? 'size-28' : 'size-16')}
			role="timer"
			aria-label={paused ? 'Duraklatıldı' : `${Math.ceil(remaining / 1000)} saniye`}
		>
			<svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
				<circle
					cx="50"
					cy="50"
					r={r}
					className="fill-none stroke-white/15"
					strokeWidth="10"
				/>
				<circle
					cx="50"
					cy="50"
					r={r}
					strokeWidth="10"
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={circumference * (1 - remaining / limitMs)}
					className={cn(
						'fill-none transition-[stroke-dashoffset] duration-300 ease-linear',
						low ? 'stroke-c1' : 'stroke-c3',
					)}
				/>
			</svg>
			<span
				aria-hidden
				className={cn(
					'absolute inset-0 flex items-center justify-center font-display font-extrabold tabular-nums',
					size === 'lg' ? 'text-5xl' : 'text-2xl',
				)}
			>
				{paused ? 'II' : Math.ceil(remaining / 1000)}
			</span>
		</div>
	);
}

// Şık karoları. Cevap gösteriminde her karonun içinde seçen kişi sayısı kadar dolan bir çubuk var.
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
	const twoCols = question.choices.length <= 4 && question.choices.every(c => c.length <= 28);

	return (
		<div
			className={cn(
				'grid gap-2 sm:gap-3',
				twoCols ? 'grid-cols-2' : 'grid-cols-1',
				size === 'player' && 'flex-1 auto-rows-fr',
			)}
		>
			{question.choices.map((choice, i) => {
				const chosen = question.myChoice === i;
				const correct = reveal?.correctIndex === i;
				const dimmed = reveal ? !correct : question.myChoice != null && !chosen;
				return (
					<button
						key={i}
						type="button"
						disabled={!onChoose || !open}
						onClick={() => onChoose?.(i)}
						aria-pressed={onChoose ? chosen : undefined}
						className={cn(
							'relative flex items-center gap-3 overflow-hidden rounded-2xl p-4 text-left font-semibold shadow-[0_5px_0_rgb(0_0_0/0.3)] transition',
							CHOICE_BG[i],
							CHOICE_TEXT[i],
							size === 'host'
								? 'min-h-24 text-2xl sm:text-3xl'
								: twoCols
									? 'min-h-20 flex-col justify-center text-center text-xl'
									: 'min-h-16 text-xl',
							open && onChoose && 'active:translate-y-1 active:shadow-none',
							dimmed && 'opacity-40',
							chosen &&
								!reveal &&
								'ring-4 ring-white ring-offset-2 ring-offset-night',
							correct && 'ring-4 ring-white ring-offset-2 ring-offset-night',
						)}
					>
						{reveal && (
							<span
								aria-hidden
								className="absolute inset-y-0 left-0 bg-black/20 transition-[width] duration-700 ease-out"
								style={{ width: `${(reveal.counts[i] / total) * 100}%` }}
							/>
						)}
						<ChoiceShape
							index={i}
							className={cn(
								'relative',
								size === 'host' ? 'size-9' : twoCols ? 'size-12' : 'size-8',
							)}
						/>
						<span
							className={cn('relative', !(size === 'player' && twoCols) && 'flex-1')}
						>
							{choice}
						</span>
						{reveal && (
							<span className="relative font-display text-2xl font-extrabold tabular-nums">
								{reveal.counts[i]}
								<span className="sr-only"> kişi seçti</span>
							</span>
						)}
						{correct && <span className="sr-only">Doğru cevap</span>}
					</button>
				);
			})}
		</div>
	);
}

export function QuestionImage({ src, className }: { src: string | null; className?: string }) {
	if (!src) return null;
	return (
		// biome-ignore lint/performance/noImgElement: dış URL'ler için next/image domain ayarı gerekir
		<img src={src} alt="" className={cn('mx-auto rounded-2xl object-contain', className)} />
	);
}

export function Scoreboard({
	scores,
	meId,
	limit,
}: {
	scores: NonNullable<GameState['scores']>;
	meId?: string;
	limit?: number;
}) {
	return (
		<ol className="flex flex-col gap-1.5">
			{scores.slice(0, limit).map((s, i) => (
				<li
					key={s.id}
					className={cn(
						'flex items-center gap-3 rounded-xl bg-white/8 px-4 py-2.5 text-lg',
						i < 3 && 'bg-white/14',
						s.id === meId && 'bg-c3 font-semibold text-ink',
					)}
				>
					<span className="w-7 text-right font-display font-extrabold tabular-nums opacity-70">
						{i + 1}
					</span>
					<span className="flex-1 truncate">{s.name}</span>
					<span className="font-display font-extrabold tabular-nums">{s.score}</span>
				</li>
			))}
		</ol>
	);
}

export function Podium({ scores }: { scores: NonNullable<GameState['scores']> }) {
	// 2. - 1. - 3. sırasıyla yan yana
	const order = [1, 0, 2].filter(i => scores[i]);
	const blocks = ['h-40 bg-c3 text-ink', 'h-28 bg-c2 text-white', 'h-20 bg-c1 text-white'];
	return (
		<div className="flex items-end justify-center gap-2 sm:gap-4">
			{order.map(i => (
				<div
					key={scores[i].id}
					className="flex w-28 flex-col items-center gap-1 text-center sm:w-40"
				>
					<span className="w-full truncate text-lg font-semibold sm:text-2xl">
						{scores[i].name}
					</span>
					<span className="font-display text-sm font-extrabold tabular-nums opacity-80 sm:text-lg">
						{scores[i].score}
					</span>
					<div
						className={cn(
							'flex w-full items-start justify-center rounded-t-2xl pt-2 font-display text-4xl font-extrabold',
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

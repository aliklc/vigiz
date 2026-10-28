'use client';

import { useEffect, useState } from 'react';

import type { GameState } from '@/lib/game-types';
import { GRACE_MS } from '@/lib/scoring';
import { cn } from '@/lib/utils';

const CHOICE_COLORS = [
	'bg-red-600',
	'bg-blue-600',
	'bg-amber-500',
	'bg-green-600',
	'bg-purple-600',
];
const LETTERS = 'ABCDE';

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

export function Countdown({ remaining, paused }: { remaining: number; paused: boolean }) {
	return (
		<div
			className={cn(
				'mx-auto flex size-16 items-center justify-center rounded-full border-4 text-2xl font-bold tabular-nums',
				remaining <= 5000 && 'border-destructive text-destructive',
			)}
			aria-live="polite"
		>
			{paused ? '⏸' : Math.ceil(remaining / 1000)}
		</div>
	);
}

export function QuestionView({
	state,
	remaining,
	onChoose,
}: {
	state: GameState;
	remaining: number;
	onChoose?: (index: number) => void;
}) {
	const { question, reveal, game } = state;
	if (!question) return null;
	const paused = !!question.pausedAt;
	const open = !reveal && !paused && remaining > 0 && question.myChoice == null;

	return (
		<div className="flex flex-col gap-4">
			<p className="text-center text-sm text-muted-foreground">
				Soru {game.currentIndex + 1} / {game.questionCount}
			</p>
			<h2 className="text-center text-xl font-bold sm:text-3xl">{question.text}</h2>
			{question.imageUrl && (
				// biome-ignore lint/performance/noImgElement: dış URL'ler için next/image domain ayarı gerekir
				<img
					src={question.imageUrl}
					alt=""
					className="mx-auto max-h-56 rounded-lg object-contain sm:max-h-80"
				/>
			)}
			{!reveal && <Countdown remaining={remaining} paused={paused} />}
			{paused && !reveal && <p className="text-center font-medium">Oyun duraklatıldı</p>}
			<div className="grid gap-2 sm:grid-cols-2">
				{question.choices.map((choice, i) => {
					const chosen = question.myChoice === i;
					const correct = reveal?.correctIndex === i;
					return (
						<button
							key={i}
							disabled={!onChoose || !open}
							onClick={() => onChoose?.(i)}
							aria-pressed={chosen}
							className={cn(
								'flex min-h-16 items-center gap-3 rounded-xl p-4 text-left text-lg font-semibold text-white transition',
								CHOICE_COLORS[i],
								open && onChoose && 'active:scale-95',
								chosen && !reveal && 'ring-4 ring-foreground ring-offset-2',
								reveal && !correct && 'opacity-35',
								reveal && correct && 'ring-4 ring-green-400 ring-offset-2',
							)}
						>
							<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/25">
								{LETTERS[i]}
							</span>
							<span className="flex-1">{choice}</span>
							{reveal && (
								<span className="rounded-full bg-white/25 px-2 text-base">
									{reveal.counts[i]} kişi
								</span>
							)}
							{reveal && correct && (
								<span>
									<span aria-hidden>✓</span>
									<span className="sr-only">Doğru cevap</span>
								</span>
							)}
						</button>
					);
				})}
			</div>
			{reveal?.explanation && (
				<p className="rounded-lg bg-muted p-3 text-center">{reveal.explanation}</p>
			)}
		</div>
	);
}

export function Scoreboard({
	scores,
	meId,
	from = 0,
}: {
	scores: NonNullable<GameState['scores']>;
	meId?: string;
	from?: number;
}) {
	return (
		<ol className="flex flex-col gap-1" start={from + 1}>
			{scores.slice(from).map((s, i) => (
				<li
					key={s.id}
					className={cn(
						'flex items-center gap-3 rounded-lg border px-3 py-2',
						s.id === meId && 'border-primary bg-primary/5 font-semibold',
					)}
				>
					<span className="w-6 text-right text-muted-foreground tabular-nums">
						{from + i + 1}
					</span>
					<span className="flex-1 truncate">{s.name}</span>
					<span className="tabular-nums">{s.score}</span>
				</li>
			))}
		</ol>
	);
}

export function Podium({ scores }: { scores: NonNullable<GameState['scores']> }) {
	// 2. - 1. - 3. sırasıyla yan yana
	const order = [1, 0, 2].filter(i => scores[i]);
	const heights = ['h-32', 'h-24', 'h-16'];
	const medals = ['🥇', '🥈', '🥉'];
	return (
		<div className="flex items-end justify-center gap-2">
			{order.map(i => (
				<div
					key={scores[i].id}
					className="flex w-28 flex-col items-center gap-1 text-center"
				>
					<span className="text-3xl">{medals[i]}</span>
					<span className="w-full truncate font-semibold">{scores[i].name}</span>
					<span className="text-sm tabular-nums">{scores[i].score}</span>
					<div className={cn('w-full rounded-t-lg bg-primary/80', heights[i])} />
				</div>
			))}
		</div>
	);
}

export function myRank(scores: GameState['scores'], meId?: string): number | null {
	const i = scores?.findIndex(s => s.id === meId) ?? -1;
	return i >= 0 ? i + 1 : null;
}

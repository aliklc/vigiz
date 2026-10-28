'use client';

import { useEffect, useState } from 'react';
import { myRank, Podium, QuestionView, Scoreboard, useRemaining } from '@/components/game-views';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGame } from '@/hooks/use-game';

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

	if (notFound) return <Centered>Oda bulunamadı. Kodu kontrol et.</Centered>;
	if (playerId === undefined || !state) return <Centered>Yükleniyor…</Centered>;

	if (!state.me) {
		return (
			<main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 p-4">
				<div className="text-center">
					<p className="text-sm text-muted-foreground">{state.quiz.topic}</p>
					<h1 className="text-2xl font-bold">{state.quiz.title}</h1>
				</div>
				<form
					className="flex flex-col gap-3"
					onSubmit={e => {
						e.preventDefault();
						join({ name: String(new FormData(e.currentTarget).get('name')) });
					}}
				>
					<Input
						name="name"
						placeholder="Adın"
						maxLength={30}
						className="h-12 text-lg"
						autoFocus
						required
					/>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<Button type="submit" size="lg">
						Katıl
					</Button>
				</form>
			</main>
		);
	}

	if (state.game.phase === 'lobby') {
		return (
			<main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
				<div className="text-center">
					<p className="text-sm text-muted-foreground">Hoş geldin {state.me.name}</p>
					<h1 className="text-2xl font-bold">{state.quiz.title}</h1>
					<p className="mt-2">Host'un başlatması bekleniyor…</p>
				</div>
				<PlayerList players={state.players} meId={state.me.id} />
			</main>
		);
	}

	const { phase } = state.game;
	const me = state.me;
	const rank = myRank(state.scores, me.id);

	if (phase === 'question' || phase === 'reveal') {
		const question = state.question && {
			...state.question,
			myChoice:
				pending?.index === state.game.currentIndex
					? pending.choice
					: state.question.myChoice,
		};
		const reveal = state.reveal;
		return (
			<main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
				{reveal && (
					<p
						className={`rounded-xl p-3 text-center text-xl font-bold ${
							reveal.myPoints
								? 'bg-green-100 text-green-800'
								: 'bg-red-100 text-red-800'
						}`}
					>
						{reveal.myPoints
							? `✅ Doğru! +${reveal.myPoints}`
							: question?.myChoice == null
								? '⌛ Cevap vermedin'
								: '❌ Yanlış'}
					</p>
				)}
				<QuestionView
					state={{ ...state, question }}
					remaining={remaining}
					onChoose={answer}
				/>
				{!reveal && question?.myChoice != null && remaining > 0 && (
					<p className="text-center text-sm text-muted-foreground">
						Cevabın alındı. Süre bitene kadar değiştirebilirsin.
					</p>
				)}
				{error && <p className="text-center text-sm text-destructive">{error}</p>}
			</main>
		);
	}

	if (phase === 'leaderboard' && state.scores) {
		return (
			<main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
				<h1 className="text-center text-2xl font-bold">Sıralama</h1>
				{rank && <p className="text-center text-lg">Sen {rank}. sıradasın</p>}
				<Scoreboard scores={state.scores} meId={me.id} />
			</main>
		);
	}

	if (phase === 'finished' && state.scores) {
		return (
			<main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
				<h1 className="text-center text-2xl font-bold">Sonuçlar</h1>
				<Podium scores={state.scores} />
				{rank && (
					<p className="text-center text-lg">
						{state.scores.length} kişi arasında {rank}. oldun
					</p>
				)}
				<Scoreboard scores={state.scores} meId={me.id} />
			</main>
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
		<div>
			<p className="mb-2 text-sm text-muted-foreground">{players.length} oyuncu</p>
			<ul className="flex flex-wrap gap-2">
				{players.map(p => (
					<li
						key={p.id}
						className={`rounded-full border px-3 py-1 ${p.id === meId ? 'border-primary font-semibold' : ''}`}
					>
						{p.name}
					</li>
				))}
			</ul>
		</div>
	);
}

export function Centered({ children }: { children: React.ReactNode }) {
	return (
		<main className="flex flex-1 items-center justify-center p-4 text-center text-lg">
			{children}
		</main>
	);
}

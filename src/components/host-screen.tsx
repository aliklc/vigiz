'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Centered, PlayerList } from '@/components/player-screen';
import { useGame } from '@/hooks/use-game';

export function HostScreen({ code }: { code: string }) {
	const { state, notFound } = useGame(code, null);
	const [origin, setOrigin] = useState('');
	useEffect(() => setOrigin(window.location.origin), []);

	async function act(body: Record<string, string>) {
		const res = await fetch(`/api/host/games/${code}/action`, {
			method: 'POST',
			body: JSON.stringify(body),
		});
		if (!res.ok) alert((await res.json()).error ?? 'İşlem başarısız');
	}

	if (notFound) return <Centered>Oda bulunamadı.</Centered>;
	if (!state) return <Centered>Yükleniyor…</Centered>;

	const link = `${origin}/play/${code}`;

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
			<Link href="/host" className="text-sm underline">
				← Quizler
			</Link>
			<div className="text-center">
				<p className="text-muted-foreground">
					{state.quiz.topic} · {state.quiz.authorName}
				</p>
				<h1 className="text-3xl font-bold">{state.quiz.title}</h1>
			</div>

			{state.game.phase === 'lobby' && (
				<>
					<div className="rounded-xl border p-6 text-center">
						<p className="text-muted-foreground">Katılmak için</p>
						<p className="font-mono text-lg break-all">{link}</p>
						<p className="mt-2 text-muted-foreground">ya da ana sayfada kodu gir</p>
						<p className="font-mono text-6xl font-bold tracking-widest">{code}</p>
						<button
							className="mt-3 text-sm underline"
							onClick={() => navigator.clipboard?.writeText(link)}
						>
							Linki kopyala
						</button>
					</div>
					<PlayerList
						players={state.players}
						onKick={playerId => act({ action: 'kick', playerId })}
					/>
				</>
			)}
		</main>
	);
}

'use client';

import { useEffect, useState } from 'react';

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
	const { state, notFound } = useGame(code, playerId ?? null);

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
		if (res.status !== 403) writeStored(code, null);
		setPlayerId(res.status === 403 ? (body.playerId ?? null) : null);
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
	if (state.me?.kicked) return <Centered>Host seni odadan çıkardı.</Centered>;

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

	return <Centered>Oyun başladı.</Centered>;
}

export function PlayerList({
	players,
	meId,
	onKick,
}: {
	players: { id: string; name: string }[];
	meId?: string;
	onKick?: (id: string) => void;
}) {
	return (
		<div>
			<p className="mb-2 text-sm text-muted-foreground">{players.length} oyuncu</p>
			<ul className="flex flex-wrap gap-2">
				{players.map(p => (
					<li
						key={p.id}
						className={`flex items-center gap-1 rounded-full border px-3 py-1 ${p.id === meId ? 'border-primary font-semibold' : ''}`}
					>
						{p.name}
						{onKick && (
							<button
								onClick={() => onKick(p.id)}
								aria-label={`${p.name} oyuncusunu çıkar`}
								className="ml-1 text-muted-foreground hover:text-destructive"
							>
								×
							</button>
						)}
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

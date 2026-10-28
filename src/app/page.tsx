import Link from 'next/link';

import { Wordmark } from '@/components/brand';
import { BigButton } from '@/components/player-screen';

export default function Home() {
	return (
		<main className="stage flex flex-col items-center justify-center gap-10 p-6">
			<div className="flex flex-col items-center gap-2 text-center">
				<Wordmark className="text-7xl sm:text-8xl" />
				<p className="text-lg opacity-80">Ayın quiz gecesi. Kodu gir, katıl.</p>
			</div>
			<form action="/play" className="flex w-full max-w-sm flex-col gap-3">
				<label htmlFor="code" className="sr-only">
					Oda kodu
				</label>
				<input
					id="code"
					name="code"
					placeholder="Oda kodu"
					autoComplete="off"
					autoCapitalize="characters"
					maxLength={6}
					required
					className="h-16 rounded-2xl bg-white text-center font-display text-3xl font-extrabold tracking-[0.3em] text-ink uppercase outline-none placeholder:tracking-normal placeholder:text-ink/40 focus-visible:ring-4 focus-visible:ring-c3"
				/>
				<BigButton type="submit">Katıl</BigButton>
			</form>
			<nav className="flex gap-6 text-sm opacity-75">
				<Link href="/archive" className="underline-offset-4 hover:underline">
					Geçmiş quizler
				</Link>
				<Link href="/host" className="underline-offset-4 hover:underline">
					Quiz hazırla
				</Link>
			</nav>
		</main>
	);
}

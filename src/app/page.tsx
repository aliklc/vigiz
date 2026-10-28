import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
	return (
		<main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-4">
			<div className="text-center">
				<h1 className="text-4xl font-bold">Vigiz</h1>
				<p className="text-muted-foreground">Quiz Night</p>
			</div>
			<form action="/play" className="flex flex-col gap-3">
				<Input
					name="code"
					placeholder="Oda kodu"
					autoComplete="off"
					autoCapitalize="characters"
					className="h-14 text-center text-2xl tracking-widest uppercase"
					maxLength={6}
					required
				/>
				<Button type="submit" size="lg">
					Katıl
				</Button>
			</form>
			<div className="flex justify-center gap-4 text-sm text-muted-foreground">
				<Link href="/archive" className="underline">
					Arşiv
				</Link>
				<Link href="/host" className="underline">
					Host girişi
				</Link>
			</div>
		</main>
	);
}

import Link from 'next/link';

export default function Home() {
	return (
		<main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-4">
			<h1 className="text-center text-4xl font-bold">Vigiz</h1>
			<p className="text-center text-muted-foreground">Quiz Night</p>
			<Link href="/host" className="text-center text-sm underline">
				Host girişi
			</Link>
		</main>
	);
}

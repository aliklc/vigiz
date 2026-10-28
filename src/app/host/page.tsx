import Link from 'next/link';
import { connection } from 'next/server';

import { Button } from '@/components/ui/button';
import { db } from '@/lib/supabase/admin';

export default async function HostHome() {
	await connection();
	const { data: quizzes } = await db
		.from('quizzes')
		.select('id, title, topic, author_name, quiz_date, status, questions(count)')
		.order('quiz_date', { ascending: false });
	const { data: games } = await db
		.from('games')
		.select('code, phase, created_at, quizzes(title)')
		.neq('phase', 'finished')
		.order('created_at', { ascending: false });

	return (
		<main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Quizler</h1>
				<Button asChild>
					<Link href="/host/quizzes/new">Yeni quiz</Link>
				</Button>
			</div>
			{!!games?.length && (
				<section className="flex flex-col gap-2">
					<h2 className="font-semibold">Açık odalar</h2>
					{games.map(g => (
						<Link
							key={g.code}
							href={`/host/games/${g.code}`}
							className="flex justify-between rounded-lg border p-3 hover:bg-muted"
						>
							<span>{g.quizzes?.title}</span>
							<span className="font-mono">{g.code}</span>
						</Link>
					))}
				</section>
			)}
			{quizzes?.length === 0 && <p className="text-muted-foreground">Henüz quiz yok.</p>}
			<ul className="flex flex-col gap-2">
				{quizzes?.map(q => (
					<li
						key={q.id}
						className="flex items-center justify-between gap-2 rounded-lg border p-3"
					>
						<div className="min-w-0">
							<p className="truncate font-medium">{q.title}</p>
							<p className="text-sm text-muted-foreground">
								{q.topic} · {q.author_name} · {q.quiz_date} ·{' '}
								{q.questions[0]?.count ?? 0} soru ·{' '}
								{q.status === 'ready' ? 'Hazır' : 'Taslak'}
							</p>
						</div>
						<div className="flex shrink-0 gap-2">
							<Button asChild variant="outline" size="sm">
								<Link href={`/host/quizzes/${q.id}`}>Düzenle</Link>
							</Button>
							{q.status === 'ready' && (
								<form method="post" action="/api/host/games">
									<input type="hidden" name="quizId" value={q.id} />
									<Button type="submit" size="sm">
										Oda aç
									</Button>
								</form>
							)}
						</div>
					</li>
				))}
			</ul>
		</main>
	);
}

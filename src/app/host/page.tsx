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

	return (
		<main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Quizler</h1>
				<Button asChild>
					<Link href="/host/quizzes/new">Yeni quiz</Link>
				</Button>
			</div>
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
						<Button asChild variant="outline" size="sm">
							<Link href={`/host/quizzes/${q.id}`}>Düzenle</Link>
						</Button>
					</li>
				))}
			</ul>
		</main>
	);
}

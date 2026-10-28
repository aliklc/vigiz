import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';

import { DeleteGameButton } from '@/components/delete-game-button';
import { SiteHeader } from '@/components/site-header';
import { getHost } from '@/lib/auth';
import { getScores } from '@/lib/game';
import { db } from '@/lib/supabase/admin';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Arşiv · Vigiz' };

export default async function ArchivePage() {
	await connection();
	const [{ data: games }, host] = await Promise.all([
		db
			.from('games')
			.select(
				'id, code, finished_at, quizzes!inner(owner_id, title, topic, author_name, quiz_date)',
			)
			.eq('phase', 'finished')
			.order('finished_at', { ascending: false }),
		getHost(),
	]);
	// Quiz tarihine göre yeniden eskiye (aynı quiz birden çok oynandıysa son oynanan önce).
	games?.sort((a, b) => b.quizzes.quiz_date.localeCompare(a.quizzes.quiz_date));
	const scores = games?.length ? await getScores(games.map(g => g.id)) : [];

	return (
		<div className="stage flex flex-col">
			<SiteHeader />
			<main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Geçmiş quizler</h1>
				{!games?.length && (
					<p className="text-muted-foreground">
						Henüz biten bir quiz yok. İlk gece oynanınca burada görünecek.
					</p>
				)}
				<ul className="flex flex-col gap-2">
					{games?.map(g => {
						const players = scores.filter(s => s.gameId === g.id);
						const winner = players[0];
						return (
							<li
								key={g.id}
								className="flex items-center gap-2 rounded-2xl border bg-white pr-2 shadow-sm hover:border-brand"
							>
								<Link
									href={`/archive/${g.code}`}
									className="flex min-w-0 flex-1 items-center gap-4 p-4"
								>
									<span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-ink">
										<Trophy className="size-6" />
									</span>
									<span className="min-w-0 flex-1">
										<span className="block truncate font-semibold sm:text-lg">
											{g.quizzes.title}
										</span>
										<span className="block text-sm text-muted-foreground">
											{g.quizzes.topic}, {formatDate(g.quizzes.quiz_date)},
											hazırlayan {g.quizzes.author_name}
										</span>
										<span className="block text-sm">
											{winner
												? `Kazanan ${winner.name} (${winner.score} puan), ${players.length} oyuncu`
												: 'Kimse katılmadı'}
										</span>
									</span>
								</Link>
								{host?.id === g.quizzes.owner_id && (
									<DeleteGameButton code={g.code} />
								)}
							</li>
						);
					})}
				</ul>
			</main>
		</div>
	);
}

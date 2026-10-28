import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';

import { CHOICE_BG, CHOICE_TEXT, Wordmark } from '@/components/brand';
import { DeleteGameButton } from '@/components/delete-game-button';
import { getHost } from '@/lib/auth';
import { getScores } from '@/lib/game';
import { db } from '@/lib/supabase/admin';
import { cn, formatDate } from '@/lib/utils';

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
		<main className="stage p-4 sm:p-8">
			<div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
				<Link href="/" aria-label="Ana sayfa" className="self-start">
					<Wordmark className="text-3xl" />
				</Link>
				<h1 className="font-display text-4xl font-extrabold">Geçmiş quizler</h1>
				{!games?.length && (
					<p className="opacity-75">
						Henüz biten bir quiz yok. İlk gece oynanınca burada görünecek.
					</p>
				)}
				<ul className="flex flex-col gap-2">
					{games?.map((g, i) => {
						const players = scores.filter(s => s.gameId === g.id);
						const winner = players[0];
						return (
							<li
								key={g.id}
								className="flex items-center gap-2 rounded-2xl bg-white/8 pr-2"
							>
								<Link
									href={`/archive/${g.code}`}
									className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl p-3 hover:bg-white/8"
								>
									<span
										className={cn(
											'flex size-12 shrink-0 items-center justify-center rounded-xl',
											CHOICE_BG[i % 5],
											CHOICE_TEXT[i % 5],
										)}
									>
										<Trophy className="size-6" />
									</span>
									<span className="min-w-0 flex-1">
										<span className="block truncate font-display text-lg font-extrabold">
											{g.quizzes.title}
										</span>
										<span className="block text-sm opacity-75">
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
			</div>
		</main>
	);
}

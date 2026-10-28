import Link from 'next/link';
import { connection } from 'next/server';

import { DeleteGameButton } from '@/components/delete-game-button';
import { getScores } from '@/lib/game';
import { isAdmin } from '@/lib/is-admin';
import { db } from '@/lib/supabase/admin';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Arşiv · Vigiz' };

export default async function ArchivePage() {
	await connection();
	const [{ data: games }, admin] = await Promise.all([
		db
			.from('games')
			.select('id, code, finished_at, quizzes!inner(title, topic, author_name, quiz_date)')
			.eq('phase', 'finished')
			.order('finished_at', { ascending: false }),
		isAdmin(),
	]);
	// Quiz tarihine göre yeniden eskiye (aynı quiz birden çok oynandıysa son oynanan önce).
	games?.sort((a, b) => b.quizzes.quiz_date.localeCompare(a.quizzes.quiz_date));
	const scores = games?.length ? await getScores(games.map(g => g.id)) : [];

	return (
		<main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
			<Link href="/" className="text-sm underline">
				← Ana sayfa
			</Link>
			<h1 className="text-2xl font-bold">Arşiv</h1>
			{!games?.length && <p className="text-muted-foreground">Henüz biten bir quiz yok.</p>}
			<ul className="flex flex-col gap-2">
				{games?.map(g => {
					const players = scores.filter(s => s.gameId === g.id);
					const winner = players[0];
					return (
						<li key={g.id} className="flex items-center gap-2 rounded-lg border">
							<Link
								href={`/archive/${g.code}`}
								className="min-w-0 flex-1 p-3 hover:bg-muted"
							>
								<p className="truncate font-medium">{g.quizzes.title}</p>
								<p className="text-sm text-muted-foreground">
									{g.quizzes.topic} · {g.quizzes.author_name} ·{' '}
									{formatDate(g.quizzes.quiz_date)}
								</p>
								<p className="text-sm">
									{winner ? `🏆 ${winner.name} (${winner.score})` : 'Oyuncu yok'}{' '}
									· {players.length} oyuncu
								</p>
							</Link>
							{admin && <DeleteGameButton code={g.code} />}
						</li>
					);
				})}
			</ul>
		</main>
	);
}

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DeleteGameButton } from '@/components/delete-game-button';
import { Podium, Scoreboard } from '@/components/game-views';
import { getGame, getScores } from '@/lib/game';
import { isAdmin } from '@/lib/is-admin';
import { formatDate } from '@/lib/utils';

export default async function ArchiveGamePage({ params }: PageProps<'/archive/[code]'>) {
	const { code } = await params;
	const game = await getGame(code);
	if (game?.phase !== 'finished') notFound();
	const [scores, admin] = await Promise.all([getScores([game.id]), isAdmin()]);
	const { quiz } = game;

	return (
		<main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
			<div className="flex items-center justify-between">
				<Link href="/archive" className="text-sm underline">
					← Arşiv
				</Link>
				{admin && <DeleteGameButton code={game.code} />}
			</div>
			<div className="text-center">
				<p className="text-sm text-muted-foreground">
					{quiz.topic} · {quiz.author_name} · {formatDate(quiz.quiz_date)}
				</p>
				<h1 className="text-2xl font-bold">{quiz.title}</h1>
			</div>
			{scores.length ? (
				<>
					<Podium scores={scores} />
					<Scoreboard scores={scores} />
				</>
			) : (
				<p className="text-center text-muted-foreground">Bu oyuna kimse katılmadı.</p>
			)}
		</main>
	);
}

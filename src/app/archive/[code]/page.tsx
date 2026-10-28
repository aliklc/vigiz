import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DeleteGameButton } from '@/components/delete-game-button';
import { Podium, Scoreboard } from '@/components/game-views';
import { getHost } from '@/lib/auth';
import { getGame, getScores } from '@/lib/game';
import { formatDate } from '@/lib/utils';

export default async function ArchiveGamePage({ params }: PageProps<'/archive/[code]'>) {
	const { code } = await params;
	const game = await getGame(code);
	if (game?.phase !== 'finished') notFound();
	const [scores, host] = await Promise.all([getScores([game.id]), getHost()]);
	const { quiz } = game;

	return (
		<main className="stage p-4 sm:p-8">
			<div className="mx-auto flex w-full max-w-xl flex-col gap-8">
				<div className="flex items-center justify-between">
					<Link href="/archive" className="text-sm opacity-75 hover:underline">
						Geçmiş quizler
					</Link>
					{host?.id === quiz.owner_id && <DeleteGameButton code={game.code} />}
				</div>
				<div className="text-center">
					<p className="opacity-75">
						{quiz.topic}, {formatDate(quiz.quiz_date)}
					</p>
					<h1 className="font-display text-4xl font-extrabold">{quiz.title}</h1>
					<p className="opacity-75">Hazırlayan {quiz.author_name}</p>
				</div>
				{scores.length ? (
					<>
						<Podium scores={scores} />
						<Scoreboard scores={scores} />
					</>
				) : (
					<p className="text-center opacity-75">Bu oyuna kimse katılmadı.</p>
				)}
			</div>
		</main>
	);
}

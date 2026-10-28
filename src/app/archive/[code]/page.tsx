import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DeleteGameButton } from '@/components/delete-game-button';
import { Podium, Scoreboard } from '@/components/game-views';
import { SiteHeader } from '@/components/site-header';
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
		<div className="stage flex flex-col">
			<SiteHeader />
			<main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
				<div className="flex items-center justify-between">
					<Link
						href="/archive"
						className="text-sm font-medium text-brand-ink hover:underline"
					>
						Geçmiş quizler
					</Link>
					{host?.id === quiz.owner_id && <DeleteGameButton code={game.code} />}
				</div>
				<div className="text-center">
					<p className="text-muted-foreground">
						{quiz.topic}, {formatDate(quiz.quiz_date)}
					</p>
					<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{quiz.title}</h1>
					<p className="text-muted-foreground">Hazırlayan {quiz.author_name}</p>
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
		</div>
	);
}

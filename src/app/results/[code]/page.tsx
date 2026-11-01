import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CONTAINER } from '@/components/brand';
import { Podium, Scoreboard } from '@/components/game-views';
import { SiteHeader } from '@/components/site-header';
import { getHost } from '@/lib/auth';
import { getGame, getScores } from '@/lib/game';
import { getDict } from '@/lib/locale';
import { cn } from '@/lib/utils';

// Paylaşılan oyun sonucu. Sadece bitmiş oyunlar; kişi adları içerdiği için aranmaz.
async function finishedGame(code: string) {
	const game = await getGame(code);
	return game?.phase === 'finished' ? game : null;
}

export async function generateMetadata({
	params,
}: PageProps<'/results/[code]'>): Promise<Metadata> {
	const [game, t] = await Promise.all([finishedGame((await params).code), getDict()]);
	return {
		title: game ? t.results.title(game.quiz.title) : t.meta.game,
		robots: { index: false, follow: false },
	};
}

export default async function ResultsPage({ params }: PageProps<'/results/[code]'>) {
	const game = await finishedGame((await params).code);
	if (!game) notFound();
	const [scores, t, host] = await Promise.all([getScores(game.id), getDict(), getHost()]);
	return (
		<div className="stage flex flex-col">
			<SiteHeader />
			<main className={cn(CONTAINER, 'flex max-w-3xl flex-1 flex-col gap-8 py-10')}>
				<div className="flex flex-col gap-1 text-center">
					<h1>{t.results.title(game.quiz.title)}</h1>
					<p className="text-ink-600">{t.results.played(scores.length)}</p>
				</div>
				<Podium scores={scores} />
				<Scoreboard scores={scores} limit={10} />
				<section className="flex flex-col items-center gap-4 rounded-3xl bg-ink-900 p-6 text-center text-white sm:p-8">
					<h2 className="text-white">{t.results.cta}</h2>
					<p className="text-accent-200">{t.results.ctaText}</p>
					<Link
						href={host ? '/host' : '/register?from=game'}
						className="flex h-14 items-center rounded-full bg-accent-400 px-7 text-lg font-bold text-ink-900 hover:bg-accent-300"
					>
						{host ? t.nav.goToPanel : t.play.makeYourOwn}
					</Link>
				</section>
			</main>
		</div>
	);
}

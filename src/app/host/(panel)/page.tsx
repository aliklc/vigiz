import { Plus } from 'lucide-react';
import Link from 'next/link';

import { CHOICE_BG, CHOICE_TEXT, CodeTiles } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { requireHost } from '@/lib/auth';
import { db } from '@/lib/supabase/admin';
import { cn } from '@/lib/utils';

const PHASE_LABEL: Record<string, string> = {
	lobby: 'Lobide, oyuncular katılıyor',
	question: 'Soru ekranda',
	reveal: 'Cevaplar gösteriliyor',
	leaderboard: 'Sıralama gösteriliyor',
};

export default async function HostHome() {
	const host = await requireHost();
	const [{ data: quizzes }, { data: games }] = await Promise.all([
		db
			.from('quizzes')
			.select('id, title, topic, quiz_date, status, questions(count)')
			.eq('owner_id', host.id)
			.order('quiz_date', { ascending: false }),
		db
			.from('games')
			.select('code, phase, created_at, players(count), quizzes!inner(title, owner_id)')
			.eq('quizzes.owner_id', host.id)
			.order('created_at', { ascending: false }),
	]);
	const open = games?.filter(g => g.phase !== 'finished') ?? [];
	const played = games?.filter(g => g.phase === 'finished') ?? [];
	const totalPlayers = played.reduce((sum, g) => sum + (g.players[0]?.count ?? 0), 0);

	return (
		<main className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-4 sm:p-8">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="font-display text-4xl font-extrabold">
						Merhaba, {host.name.split(' ')[0]}
					</h1>
					<p className="text-muted-foreground">
						{quizzes?.length
							? `${quizzes.length} quizin var. ${played.length} gece oynandı, toplam ${totalPlayers} katılım.`
							: 'İlk quizini hazırlayarak başla.'}
					</p>
				</div>
				<Button asChild size="lg">
					<Link href="/host/quizzes/new">
						<Plus /> Yeni quiz
					</Link>
				</Button>
			</header>

			{open.length > 0 && (
				<section aria-labelledby="open-rooms" className="flex flex-col gap-3">
					<h2 id="open-rooms" className="font-display text-xl font-extrabold">
						Açık odalar
					</h2>
					{open.map(g => (
						<Link
							key={g.code}
							href={`/host/games/${g.code}`}
							className="flex flex-wrap items-center gap-4 rounded-2xl bg-night p-4 text-white hover:bg-night-2"
						>
							<CodeTiles code={g.code} size="md" />
							<div className="min-w-0 flex-1">
								<p className="truncate font-semibold">{g.quizzes.title}</p>
								<p className="text-sm opacity-75">
									{PHASE_LABEL[g.phase]}, {g.players[0]?.count ?? 0} oyuncu
								</p>
							</div>
							<span className="rounded-xl bg-c3 px-4 py-2 font-semibold text-ink">
								Ekrana dön
							</span>
						</Link>
					))}
				</section>
			)}

			<section aria-labelledby="quizzes" className="flex flex-col gap-3">
				<h2 id="quizzes" className="font-display text-xl font-extrabold">
					Quizlerim
				</h2>
				{!quizzes?.length && (
					<div className="rounded-2xl border-2 border-dashed p-8 text-center">
						<p className="font-semibold">Henüz bir quizin yok</p>
						<p className="text-muted-foreground">
							Bir konu seç, soruları yaz, hazır olunca oda açıp ekibi davet et.
						</p>
					</div>
				)}
				<ul className="flex flex-col gap-2">
					{quizzes?.map((q, i) => {
						const date = new Date(q.quiz_date);
						const ready = q.status === 'ready';
						return (
							<li
								key={q.id}
								className="flex items-center gap-4 rounded-2xl bg-card p-3 pr-4 shadow-sm"
							>
								<div
									className={cn(
										'flex size-16 shrink-0 flex-col items-center justify-center rounded-xl leading-none',
										CHOICE_BG[i % 5],
										CHOICE_TEXT[i % 5],
									)}
								>
									<span className="font-display text-2xl font-extrabold">
										{date.getDate()}
									</span>
									<span className="text-xs font-semibold">
										{date.toLocaleDateString('tr-TR', { month: 'short' })}
									</span>
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate font-display text-lg font-extrabold">
										{q.title}
									</p>
									<p className="truncate text-sm text-muted-foreground">
										{q.topic}, {q.questions[0]?.count ?? 0} soru
									</p>
								</div>
								<span
									className={cn(
										'hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline',
										ready
											? 'bg-c4/15 text-emerald-800'
											: 'bg-muted text-muted-foreground',
									)}
								>
									{ready ? 'Hazır' : 'Taslak'}
								</span>
								<div className="flex shrink-0 gap-2">
									<Button asChild variant="outline" size="sm">
										<Link href={`/host/quizzes/${q.id}`}>Düzenle</Link>
									</Button>
									{ready && (
										<form method="post" action="/api/host/games">
											<input type="hidden" name="quizId" value={q.id} />
											<Button type="submit" size="sm">
												Oda aç
											</Button>
										</form>
									)}
								</div>
							</li>
						);
					})}
				</ul>
			</section>
		</main>
	);
}

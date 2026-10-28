import { Plus } from 'lucide-react';
import Link from 'next/link';

import { CodeTiles } from '@/components/brand';
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
		<main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
					<h2 id="open-rooms" className="text-xl font-semibold">
						Açık odalar
					</h2>
					{open.map(g => (
						<Link
							key={g.code}
							href={`/host/games/${g.code}`}
							className="flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm hover:border-brand"
						>
							<CodeTiles code={g.code} size="md" />
							<div className="min-w-0 flex-1">
								<p className="truncate font-semibold">{g.quizzes.title}</p>
								<p className="text-sm text-muted-foreground">
									{PHASE_LABEL[g.phase]}, {g.players[0]?.count ?? 0} oyuncu
								</p>
							</div>
							<span className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">
								Ekrana dön
							</span>
						</Link>
					))}
				</section>
			)}

			<section aria-labelledby="quizzes" className="flex flex-col gap-3">
				<h2 id="quizzes" className="text-xl font-semibold">
					Quizlerim
				</h2>
				{!quizzes?.length && (
					<div className="rounded-2xl border-2 border-dashed bg-white p-8 text-center">
						<p className="font-semibold">Henüz bir quizin yok</p>
						<p className="text-muted-foreground">
							Bir konu seç, soruları yaz, hazır olunca oda açıp ekibi davet et.
						</p>
					</div>
				)}
				<ul className="flex flex-col gap-2">
					{quizzes?.map(q => {
						const date = new Date(q.quiz_date);
						const ready = q.status === 'ready';
						return (
							<li
								key={q.id}
								className="flex items-center gap-4 rounded-2xl border bg-white p-3 pr-4 shadow-sm"
							>
								<div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-tint leading-none text-brand-ink sm:size-16">
									<span className="text-2xl font-bold">{date.getDate()}</span>
									<span className="text-xs font-semibold">
										{date.toLocaleDateString('tr-TR', { month: 'short' })}
									</span>
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate font-semibold sm:text-lg">
										{q.title || 'Adsız quiz'}
									</p>
									<p className="truncate text-sm text-muted-foreground">
										{q.topic}, {q.questions[0]?.count ?? 0} soru
									</p>
								</div>
								<span
									className={cn(
										'hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline',
										ready
											? 'bg-green-50 text-green-700'
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

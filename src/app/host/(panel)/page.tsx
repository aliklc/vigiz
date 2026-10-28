import { Plus } from 'lucide-react';
import Link from 'next/link';

import { CodeTiles } from '@/components/brand';
import { FORMATS } from '@/components/formats';
import { Button } from '@/components/ui/button';
import { requireHost } from '@/lib/auth';
import { QUESTION_TYPES, type QuestionType } from '@/lib/quiz';
import { db } from '@/lib/supabase/admin';
import { cn } from '@/lib/utils';

const PHASE_LABEL: Record<string, string> = {
	lobby: 'Lobide, oyuncular katılıyor',
	question: 'Soru ekranda',
	reveal: 'Cevaplar gösteriliyor',
	leaderboard: 'Sıralama gösteriliyor',
};

const shortDate = (iso: string) =>
	new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

export default async function HostHome() {
	const host = await requireHost();
	const [{ data: quizzes }, { data: games }] = await Promise.all([
		db
			.from('quizzes')
			.select('id, title, topic, quiz_date, status, questions(type)')
			.eq('owner_id', host.id)
			.order('quiz_date', { ascending: false }),
		db
			.from('games')
			.select(
				'code, phase, quiz_id, created_at, finished_at, players(count), quizzes!inner(title, owner_id)',
			)
			.eq('quizzes.owner_id', host.id)
			.order('created_at', { ascending: false }),
	]);
	const open = games?.filter(g => g.phase !== 'finished') ?? [];
	const played = games?.filter(g => g.phase === 'finished') ?? [];
	const totalPlayers = played.reduce((sum, g) => sum + (g.players[0]?.count ?? 0), 0);

	return (
		<main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
			<header className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Merhaba, {host.name.split(' ')[0]}
				</h1>
				<Button asChild size="lg">
					<Link href="/host/quizzes/new">
						<Plus /> Yeni quiz
					</Link>
				</Button>
			</header>

			<dl className="grid grid-cols-3 gap-3">
				{[
					['Quiz', quizzes?.length ?? 0],
					['Oynanan oyun', played.length],
					['Toplam katılım', totalPlayers],
				].map(([label, value]) => (
					<div key={label} className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
						<dt className="text-sm text-muted-foreground">{label}</dt>
						<dd className="text-2xl font-bold tabular-nums sm:text-3xl">{value}</dd>
					</div>
				))}
			</dl>

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
					<div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed bg-white p-10 text-center">
						<p className="font-semibold">Henüz bir quizin yok</p>
						<p className="text-muted-foreground">Bir konu seç, soruları yaz, oda aç.</p>
						<Button asChild>
							<Link href="/host/quizzes/new">
								<Plus /> İlk quizini oluştur
							</Link>
						</Button>
					</div>
				)}
				<ul className="flex flex-col gap-2">
					{quizzes?.map(q => {
						const date = new Date(q.quiz_date);
						const ready = q.status === 'ready';
						const runs = played.filter(g => g.quiz_id === q.id);
						const lastRun = runs[0]?.finished_at;
						const byType = QUESTION_TYPES.map(type => ({
							type,
							count: q.questions.filter(x => (x.type as QuestionType) === type)
								.length,
						})).filter(t => t.count);
						return (
							<li
								key={q.id}
								className="flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-3 pr-4 shadow-sm sm:flex-nowrap"
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
										{q.topic || 'Konu yok'}
									</p>
									<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
										{byType.length ? (
											byType.map(({ type, count }) => {
												const { label, Icon } = FORMATS[type];
												return (
													<span
														key={type}
														className="flex items-center gap-1"
														title={label}
													>
														<Icon className="size-3.5" aria-hidden />
														{count}
														<span className="sr-only"> {label}</span>
													</span>
												);
											})
										) : (
											<span>Soru yok</span>
										)}
										<span>
											{runs.length
												? `${runs.length} kez oynandı${lastRun ? `, son ${shortDate(lastRun)}` : ''}`
												: 'Henüz oynanmadı'}
										</span>
									</div>
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

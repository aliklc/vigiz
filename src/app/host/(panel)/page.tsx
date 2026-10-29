import { Clapperboard, Plus } from 'lucide-react';
import Link from 'next/link';

import { CONTAINER, CodeTiles } from '@/components/brand';
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
			.select('id, title, topic, quiz_date, status, questions(type, video_id)')
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
		<main className={cn(CONTAINER, 'flex flex-col gap-8 py-8 sm:py-10')}>
			<header className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1>Quizlerim</h1>
					<p className="text-ink-600">Merhaba, {host.name.split(' ')[0]}</p>
				</div>
				<Link
					href="/host/quizzes/new"
					className="flex h-14 items-center gap-2 rounded-xl bg-teal-500 px-6 text-lg font-bold text-white hover:bg-teal-600"
				>
					<Plus className="size-5" aria-hidden /> Yeni quiz
				</Link>
			</header>

			<dl className="grid grid-cols-3 gap-3">
				{[
					['Quiz', quizzes?.length ?? 0],
					['Oynanan oyun', played.length],
					['Toplam katılım', totalPlayers],
				].map(([label, value]) => (
					<div key={label} className="rounded-3xl border bg-white p-4 sm:p-5">
						<dt className="text-sm text-ink-600">{label}</dt>
						<dd className="text-2xl font-semibold tabular-nums sm:text-3xl">{value}</dd>
					</div>
				))}
			</dl>

			{open.length > 0 && (
				<section aria-labelledby="open-rooms" className="flex flex-col gap-3">
					<h2 id="open-rooms">Açık odalar</h2>
					{open.map(g => (
						<Link
							key={g.code}
							href={`/host/games/${g.code}`}
							className="flex flex-wrap items-center gap-4 rounded-3xl border bg-white p-4 hover:border-teal-500"
						>
							<CodeTiles code={g.code} size="md" />
							<div className="min-w-0 flex-1">
								<p className="truncate font-semibold">{g.quizzes.title}</p>
								<p className="text-sm text-muted-foreground">
									{PHASE_LABEL[g.phase]}, {g.players[0]?.count ?? 0} oyuncu
								</p>
							</div>
							<span className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white">
								Ekrana dön
							</span>
						</Link>
					))}
				</section>
			)}

			<section aria-labelledby="quizzes" className="flex flex-col gap-3">
				<h2 id="quizzes" className="sr-only">
					Quizler
				</h2>
				{!quizzes?.length && (
					<div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-ink-300 bg-white p-10 text-center">
						<p className="font-semibold">Henüz bir quizin yok</p>
						<p className="text-ink-600">Bir konu seç, soruları yaz, oda aç.</p>
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
						const videos = q.questions.filter(x => x.video_id).length;
						return (
							<li
								key={q.id}
								className="flex flex-wrap items-center gap-4 rounded-3xl border bg-white p-4 sm:flex-nowrap"
							>
								<span
									aria-hidden
									className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-xl font-semibold text-teal-700 sm:size-14"
								>
									{(q.title || '?')[0].toLocaleUpperCase('tr')}
								</span>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<p className="truncate font-semibold sm:text-lg">
											{q.title || 'Adsız quiz'}
										</p>
										<StatusBadge
											status={
												runs.length ? 'played' : ready ? 'ready' : 'draft'
											}
										/>
									</div>
									<p className="truncate text-sm text-ink-600">
										{q.topic || 'Konu yok'},{' '}
										{date.toLocaleDateString('tr-TR', {
											day: 'numeric',
											month: 'long',
										})}
									</p>
									<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-600">
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
										{videos > 0 && (
											<span
												className="flex items-center gap-1"
												title="Videolu soru"
											>
												<Clapperboard className="size-3.5" aria-hidden />
												{videos}
												<span className="sr-only"> videolu soru</span>
											</span>
										)}
										<span>
											{runs.length
												? `${runs.length} kez oynandı${lastRun ? `, son ${shortDate(lastRun)}` : ''}`
												: 'Henüz oynanmadı'}
										</span>
									</div>
								</div>
								<div className="flex shrink-0 gap-2">
									<Button asChild variant="outline">
										<Link href={`/host/quizzes/${q.id}`}>Düzenle</Link>
									</Button>
									{ready && (
										<form method="post" action="/api/host/games">
											<input type="hidden" name="quizId" value={q.id} />
											<Button type="submit">Oda aç</Button>
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

const BADGES = {
	ready: ['Hazır', 'bg-teal-50 text-teal-700'],
	draft: ['Taslak', 'bg-ink-100 text-ink-700'],
	played: ['Oynandı', 'bg-ink-50 text-ink-600 border'],
} as const;

function StatusBadge({ status }: { status: keyof typeof BADGES }) {
	const [label, cls] = BADGES[status];
	return (
		<span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold', cls)}>
			{label}
		</span>
	);
}

'use client';

import { Copy } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { renderSVG } from 'uqr';

import { CONTAINER, Wordmark } from '@/components/brand';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
	BuzzerImage,
	Choices,
	Countdown,
	Podium,
	QuestionImage,
	type QuestionVideo,
	Scoreboard,
	useRemaining,
	VideoClip,
} from '@/components/game-views';
import { Centered, PlayerList, PrimaryButton } from '@/components/player-screen';
import { useGame } from '@/hooks/use-game';
import type { GameState } from '@/lib/game-types';
import type { QuestionType } from '@/lib/quiz';
import { cn } from '@/lib/utils';

type Action = 'start' | 'next' | 'pause' | 'resume' | 'end' | 'reveal' | 'judge' | 'cancel';

export function HostScreen({
	code,
	videos,
}: {
	code: string;
	// soru sırası → YouTube klibi (sadece host'a; oyuncu state'inde video yok)
	videos: Record<number, QuestionVideo>;
}) {
	const { state, notFound, refresh, offset } = useGame(code, null);
	const remaining = useRemaining(state?.question ?? null, offset, !!state?.reveal, refresh);
	const [origin, setOrigin] = useState('');
	const [busy, setBusy] = useState(false);
	// "Önceki soru": sadece bu ekranda gösterilir, oyunu ve oyuncuları etkilemez.
	const [viewing, setViewing] = useState<PastQuestion | null>(null);
	const [copied, setCopied] = useState(false);
	const router = useRouter();

	async function showQuestion(index: number) {
		const res = await fetch(`/api/host/games/${code}/questions/${index}`, {
			cache: 'no-store',
		});
		if (res.ok) setViewing(await res.json());
	}
	useEffect(() => setOrigin(window.location.origin), []);

	// Cevaplar Realtime'da yayınlanmıyor (gizli); "kaç kişi cevapladı" için soru sırasında yokla.
	const phase = state?.game.phase;
	useEffect(() => {
		if (phase !== 'question') return;
		const id = setInterval(refresh, 2000);
		return () => clearInterval(id);
	}, [phase, refresh]);

	async function act(action: Action, verdict?: 'correct' | 'wrong'): Promise<boolean> {
		setBusy(true);
		try {
			const res = await fetch(`/api/host/games/${code}/action`, {
				method: 'POST',
				body: JSON.stringify({ action, verdict }),
			});
			if (!res.ok) alert((await res.json()).error ?? 'İşlem başarısız');
			// İptal edilen oda artık yok; yenilemek "bulunamadı" ekranını gösterirdi.
			else if (action === 'cancel') return true;
			await refresh();
			return res.ok;
		} catch {
			alert('Bağlantı koptu, tekrar dene.');
			return false;
		} finally {
			// Ağ hatasında da butonlar tekrar açılsın; yoksa oyun ortasında kilitlenir.
			setBusy(false);
		}
	}

	if (notFound) return <Centered>Oda bulunamadı.</Centered>;
	if (!state) return <Centered>Yükleniyor…</Centered>;

	const { game, question, reveal, scores } = state;
	const joinUrl = `${origin}/play/${code}`;
	const isLast = game.currentIndex >= game.questionCount - 1;
	// Sıralama/finalde az önce sorulan soru, soru ve sonuç ekranında bir önceki soru.
	const previousIndex = viewing
		? viewing.index - 1
		: game.phase === 'leaderboard' || game.phase === 'finished'
			? game.currentIndex
			: game.currentIndex - 1;
	const playerCount = state.players.length;

	const control = (label: string, action: Action, disabled = false) => (
		<PrimaryButton
			className="lg:h-14 lg:px-8 lg:text-lg"
			disabled={busy || disabled}
			onClick={() => act(action)}
		>
			{label}
		</PrimaryButton>
	);

	const secondary = (label: string, action: Action) => (
		<button type="button" disabled={busy} onClick={() => act(action)} className={SECONDARY}>
			{label}
		</button>
	);

	return (
		<main className="stage flex flex-col">
			<header className="border-b bg-white">
				<div className={cn(CONTAINER, 'flex items-center justify-between gap-4 py-3')}>
					<div className="flex min-w-0 items-center gap-4">
						<Link href="/host" aria-label="Panele dön" className="shrink-0">
							<Wordmark className="text-2xl" />
						</Link>
						<Breadcrumbs
							className="hidden sm:block"
							items={[
								{ label: 'Quizlerim', href: '/host' },
								{ label: state.quiz.title },
								{ label: `Oda ${code}` },
							]}
						/>
					</div>
					<div className="flex shrink-0 items-center gap-4">
						{['question', 'reveal', 'leaderboard'].includes(game.phase) && (
							<button
								type="button"
								disabled={busy}
								onClick={() => {
									if (
										confirm(
											'Oyun şimdi bitsin mi? O ana kadarki puanlarla sonuçlar gösterilir.',
										)
									) {
										setViewing(null);
										act('end');
									}
								}}
								className="flex h-11 shrink-0 items-center rounded-full border-[1.5px] border-ink-300 bg-white px-4 text-sm font-semibold text-wrong hover:bg-wrong-bg disabled:opacity-50"
							>
								Oyunu bitir
							</button>
						)}
						{game.phase === 'lobby' && (
							<button
								type="button"
								disabled={busy}
								onClick={async () => {
									if (
										!confirm(
											'Oda iptal edilsin mi? Katılan oyuncular odadan çıkar.',
										)
									)
										return;
									if (await act('cancel')) router.replace('/host');
								}}
								className="flex h-11 shrink-0 items-center rounded-full border-[1.5px] border-ink-300 bg-white px-4 text-sm font-semibold text-wrong hover:bg-wrong-bg disabled:opacity-50"
							>
								Odayı iptal et
							</button>
						)}
					</div>
				</div>
			</header>

			<div className={cn(CONTAINER, 'flex flex-1 flex-col gap-6 py-8 pb-32 lg:gap-8')}>
				{viewing ? (
					<PastQuestionView state={state} past={viewing} />
				) : (
					<>
						{game.phase === 'lobby' && (
							<div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-8">
								<section className="flex flex-col items-center gap-5 rounded-3xl bg-ink-900 p-6 text-center text-white lg:p-8">
									<p className="font-mono text-sm tracking-[0.08em] text-accent-200 uppercase">
										Oda kodu
									</p>
									<p className="font-mono text-6xl font-medium tracking-[0.08em] text-white lg:text-7xl">
										{code}
									</p>
									{origin && (
										<>
											<p className="text-accent-200">
												{origin.replace(/^https?:\/\//, '')}
											</p>
											<JoinQr url={joinUrl} />
											<button
												type="button"
												onClick={() => {
													navigator.clipboard?.writeText(joinUrl);
													setCopied(true);
												}}
												className="flex h-11 items-center gap-2 rounded-full border-[1.5px] border-white/40 px-4 text-sm font-semibold hover:bg-white/10"
											>
												<Copy className="size-4" aria-hidden />
												{copied ? 'Kopyalandı' : 'Linki kopyala'}
											</button>
										</>
									)}
								</section>
								<section aria-label="Katılanlar" className="flex flex-col gap-4">
									<h1>{playerCount} oyuncu katıldı</h1>
									{playerCount ? (
										<PlayerList players={state.players} />
									) : (
										<p className="text-lg text-ink-600">
											İlk oyuncu bekleniyor…
										</p>
									)}
								</section>
							</div>
						)}

						{(game.phase === 'question' || game.phase === 'reveal') &&
							question?.type === 'buzzer' && (
								<BuzzerHostView state={state} code={code} remaining={remaining} />
							)}

						{(game.phase === 'question' || game.phase === 'reveal') &&
							question &&
							question.type !== 'buzzer' && (
								<>
									<div className="flex items-start justify-between gap-6">
										<div className="flex flex-col gap-2">
											<p className="font-mono font-medium text-ink-600 uppercase lg:text-lg">
												Soru {game.currentIndex + 1}/{game.questionCount}
											</p>
											<h1 className="text-3xl leading-tight lg:text-5xl">
												{question.text}
											</h1>
										</div>
										{!reveal && (
											<Countdown
												remaining={remaining}
												limitMs={game.timeLimitSec * 1000}
												paused={!!question.pausedAt}
												size="lg"
											/>
										)}
									</div>
									{!reveal && (
										<div
											className="h-2 overflow-hidden rounded-full bg-ink-200"
											aria-hidden
										>
											<div
												className="h-full rounded-full bg-accent-400 transition-[width] duration-300 ease-linear"
												style={{
													width: `${(Math.min(remaining, game.timeLimitSec * 1000) / (game.timeLimitSec * 1000)) * 100}%`,
												}}
											/>
										</div>
									)}
									{videos[game.currentIndex] ? (
										<VideoClip
											video={videos[game.currentIndex]}
											reveal={!!reveal}
										/>
									) : (
										<QuestionImage
											src={question.imageUrl}
											className="max-h-72"
										/>
									)}
									<Choices state={state} open={false} size="host" />
									{reveal?.explanation && (
										<p className="rounded-3xl border bg-white p-5 text-lg text-ink-700 lg:text-xl">
											{reveal.explanation}
										</p>
									)}
								</>
							)}

						{game.phase === 'leaderboard' && scores && (
							<>
								<h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
									{game.currentIndex + 1}. sorudan sonra sıralama
								</h1>
								<Scoreboard scores={scores} />
							</>
						)}

						{game.phase === 'finished' && scores && (
							<>
								<h1 className="text-center text-4xl font-bold tracking-tight lg:text-5xl">
									Kazananlar
								</h1>
								<Podium scores={scores} />
								<Scoreboard scores={scores} />
							</>
						)}
					</>
				)}
			</div>

			<footer className="fixed inset-x-0 bottom-0 border-t bg-white/90 py-3 backdrop-blur lg:py-4">
				<div className={cn(CONTAINER, 'flex items-center justify-between gap-4')}>
					{viewing ? (
						<p className="font-medium text-ink-600">
							Önceki soruya bakıyorsun; oyun devam ediyor.
						</p>
					) : game.phase === 'question' && question?.type === 'buzzer' ? (
						<p className="font-medium text-ink-600">
							{question.answeredCount} kişi bastı
						</p>
					) : game.phase === 'question' && question ? (
						<AnsweredBar answered={question.answeredCount} total={playerCount} />
					) : (
						<p className="font-medium text-ink-600">{playerCount} oyuncu</p>
					)}
					<div className="flex gap-3">
						{game.phase !== 'lobby' && previousIndex >= 0 && (
							<button
								type="button"
								onClick={() => showQuestion(previousIndex)}
								className={SECONDARY}
							>
								Önceki soru
							</button>
						)}
						{viewing && (
							<PrimaryButton
								className="lg:h-14 lg:px-8 lg:text-lg"
								onClick={() => setViewing(null)}
							>
								Güncel ekrana dön
							</PrimaryButton>
						)}
						{!viewing && (
							<>
								{game.phase === 'lobby' &&
									control(
										'Başlat',
										'start',
										game.questionCount === 0 || playerCount === 0,
									)}
								{game.phase === 'question' && question?.type === 'buzzer' && (
									<>
										{state.buzzer?.queue.some(b => !b.verdict) && (
											<>
												<button
													type="button"
													disabled={busy}
													onClick={() => act('judge', 'wrong')}
													className="h-12 rounded-full bg-wrong px-6 font-semibold text-white hover:bg-wrong/90 disabled:opacity-50 lg:h-14 lg:px-8 lg:text-lg"
												>
													Yanlış
												</button>
												<button
													type="button"
													disabled={busy}
													onClick={() => act('judge', 'correct')}
													className="h-12 rounded-full bg-ink-900 px-6 font-semibold text-white hover:bg-ink-700 disabled:opacity-50 lg:h-14 lg:px-8 lg:text-lg"
												>
													Doğru
												</button>
											</>
										)}
										<button
											type="button"
											disabled={busy}
											onClick={() => act('reveal')}
											className="h-12 rounded-full border-[1.5px] border-ink-300 bg-white px-5 font-semibold text-ink-900 hover:bg-ink-50 disabled:opacity-50 lg:h-14 lg:px-6 lg:text-lg"
										>
											Cevabı göster
										</button>
									</>
								)}
								{game.phase === 'question' && question?.type !== 'buzzer' && (
									<>
										{remaining <= game.timeLimitSec * 1000 &&
											secondary(
												question?.pausedAt ? 'Devam et' : 'Duraklat',
												question?.pausedAt ? 'resume' : 'pause',
											)}
										{secondary('Cevabı göster', 'reveal')}
									</>
								)}
								{game.phase === 'reveal' && control('Sıralamayı göster', 'next')}
								{game.phase === 'leaderboard' &&
									control(isLast ? 'Sonuçları göster' : 'Sonraki soru', 'next')}
								{game.phase === 'finished' && (
									<Link
										href="/host"
										className="flex h-12 items-center rounded-full border-[1.5px] border-ink-300 bg-white px-6 font-semibold lg:h-14"
									>
										Panele dön
									</Link>
								)}
							</>
						)}
					</div>
				</div>
			</footer>
		</main>
	);
}

function AnsweredBar({ answered, total }: { answered: number; total: number }) {
	return (
		<div className="flex min-w-0 flex-1 items-center gap-3">
			<div className="h-2.5 max-w-sm flex-1 overflow-hidden rounded-full bg-ink-200">
				<div
					className="h-full rounded-full bg-accent-400 transition-[width] duration-500"
					style={{ width: `${total ? (answered / total) * 100 : 0}%` }}
				/>
			</div>
			<p className="shrink-0 font-medium tabular-nums">
				{answered}/{total} cevapladı
			</p>
		</div>
	);
}

// Telefon kamerasıyla okutunca doğrudan oyuncu sayfası açılır.
function JoinQr({ url }: { url: string }) {
	const svg = useMemo(() => renderSVG(url, { border: 1 }), [url]);
	return (
		<div
			role="img"
			aria-label="Katılmak için QR kod"
			className="size-48 shrink-0 rounded-2xl bg-white p-2 lg:size-56 [&>svg]:size-full"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG kendi ürettiğimiz oda linkinden, kullanıcı girdisi değil
			dangerouslySetInnerHTML={{ __html: svg }}
		/>
	);
}

type PastQuestion = {
	index: number;
	type: QuestionType;
	text: string;
	imageUrl: string | null;
	choices: string[];
	correctIndex: number;
	explanation: string | null;
	counts: number[];
};

function PastQuestionView({ state, past }: { state: GameState; past: PastQuestion }) {
	// Choices bileşenini sonuç modunda kullanmak için state'i bu soruyla doldur.
	const view: GameState = {
		...state,
		question: {
			type: past.type,
			text: past.text,
			imageUrl: past.imageUrl,
			choices: past.choices,
			deadline: 0,
			pausedAt: null,
			answeredCount: 0,
			myChoice: null,
		},
		reveal: {
			correctIndex: past.correctIndex,
			counts: past.counts,
			explanation: past.explanation,
			myPoints: null,
		},
	};
	return (
		<>
			<div className="flex flex-col gap-2">
				<p className="font-mono font-medium text-ink-600 uppercase lg:text-lg">
					Önceki soru: Soru {past.index + 1}/{state.game.questionCount}
				</p>
				<h1 className="text-3xl leading-tight lg:text-5xl">{past.text}</h1>
			</div>
			<QuestionImage src={past.imageUrl} className="max-h-72" />
			<Choices state={view} open={false} size="host" />
			{past.explanation && (
				<p className="rounded-3xl border bg-white p-5 text-lg text-ink-700 lg:text-xl">
					{past.explanation}
				</p>
			)}
		</>
	);
}

// Bulanık görsel: büyük görsel + basış sırası. Cevap metni soru sırasında gösterilmez
// (ekran Meet'te paylaşılıyor); cevap gösteriminde net görsel, cevap ve bilen kişi.
function BuzzerHostView({
	state,
	code,
	remaining,
}: {
	state: GameState;
	code: string;
	remaining: number;
}) {
	const { question, reveal, game } = state;
	if (!question) return null;
	const queue = state.buzzer?.queue ?? [];
	const answeringId = queue.find(b => !b.verdict)?.id;
	return (
		<div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-8">
			<div className="flex flex-col gap-4">
				<div className="flex items-start justify-between gap-6">
					<div className="flex flex-col gap-2">
						<p className="font-mono font-medium text-ink-600 uppercase lg:text-lg">
							Soru {game.currentIndex + 1}/{game.questionCount}
						</p>
						<h1 className="text-3xl leading-tight lg:text-5xl">
							{reveal ? reveal.answerText : question.text || 'Bu ne?'}
						</h1>
					</div>
					{!reveal && (
						<Countdown
							remaining={remaining}
							limitMs={game.timeLimitSec * 1000}
							paused={!!question.pausedAt}
							size="lg"
						/>
					)}
				</div>
				<BuzzerImage
					code={code}
					level={question.blurLevel}
					src={reveal ? question.imageUrl : null}
					className="max-h-[55vh]"
				/>
				{reveal && (
					<p className="text-center text-xl font-semibold lg:text-2xl">
						{reveal.winner
							? `${reveal.winner.name} bildi, +${reveal.winner.points}`
							: 'Kimse bilemedi'}
					</p>
				)}
				{reveal?.explanation && (
					<p className="rounded-3xl border bg-white p-5 text-lg text-ink-700 lg:text-xl">
						{reveal.explanation}
					</p>
				)}
			</div>
			<section aria-label="Basış sırası" className="flex flex-col gap-2">
				<h2 className="font-semibold text-ink-600 lg:text-lg">Basış sırası</h2>
				{!queue.length && <p className="text-ink-600">Henüz kimse basmadı.</p>}
				<ol className="flex flex-col gap-1.5">
					{queue.map((b, i) => (
						<li
							key={b.id}
							className={cn(
								'flex items-center gap-3 rounded-xl border bg-white px-4 py-2.5 lg:text-lg',
								b.id === answeringId && 'border-ink-900 bg-accent-50 font-semibold',
								b.verdict === 'wrong' && 'text-ink-600 line-through',
								b.verdict === 'correct' &&
									'border-ink-900 bg-accent-50 font-semibold',
							)}
						>
							<span className="w-6 text-right font-bold tabular-nums">{i + 1}</span>
							<span className="flex-1 truncate">{b.name}</span>
							<span className="text-sm no-underline">
								{b.verdict === 'correct'
									? 'Doğru'
									: b.verdict === 'wrong'
										? '−300'
										: b.id === answeringId
											? 'Cevaplıyor'
											: 'Bekliyor'}
							</span>
						</li>
					))}
				</ol>
			</section>
		</div>
	);
}

const SECONDARY =
	'h-12 rounded-full border-[1.5px] border-ink-300 bg-white px-5 font-semibold text-ink-900 hover:bg-ink-50 disabled:opacity-50 lg:h-14 lg:px-6 lg:text-lg';

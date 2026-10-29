import {
	Check,
	ChevronDown,
	Clapperboard,
	Pause,
	QrCode,
	Trophy,
	UserRound,
	X,
} from 'lucide-react';
import Link from 'next/link';

import { CONTAINER, FIELD, LETTERS, LogoMark, Wordmark } from '@/components/brand';
import { FORMATS } from '@/components/formats';
import { PrimaryButton } from '@/components/player-screen';
import { ScrollEffects } from '@/components/scroll-effects';
import { SiteHeader } from '@/components/site-header';
import { getHost } from '@/lib/auth';
import { cn } from '@/lib/utils';

const STEPS = [
	{ Icon: QrCode, title: 'Kodu gir', text: "QR'ı okut ya da kodu yaz" },
	{ Icon: UserRound, title: 'Adını yaz', text: 'Hesap gerekmez' },
	{ Icon: Trophy, title: 'Oyna', text: 'Cevapla, puanı topla' },
];

export default async function Home() {
	const host = await getHost();
	return (
		// Zemin rengi kaydırdıkça bölüme göre yumuşakça değişir (ScrollEffects, data-bg).
		<div
			data-home
			className="flex min-h-dvh flex-col transition-[background-color] duration-700 ease-out"
			style={{ backgroundColor: '#ffc83d' }}
		>
			<ScrollEffects />
			<div
				data-bg="#ffc83d"
				className="relative flex min-h-dvh snap-start flex-col overflow-hidden"
			>
				<FloatingBubbles />
				<SiteHeader tone="accent" />
				<section
					className={cn(
						CONTAINER,
						'relative grid flex-1 grid-cols-1 content-center items-center gap-8 py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-12',
					)}
				>
					<div>
						<h1 className="hero-mark text-[clamp(5.5rem,19vw,15rem)] leading-[0.85] font-extrabold tracking-[-0.06em] text-ink-900">
							vigiz
						</h1>
						<p className="mt-5 font-mono text-xs tracking-[0.12em] text-ink-900 uppercase sm:text-sm">
							Aylık quiz gecesi
						</p>
					</div>
					<div
						className="reveal flex flex-col gap-6"
						style={{ transitionDelay: '500ms' }}
					>
						<p className="text-2xl leading-tight font-semibold tracking-tight text-ink-900 sm:text-3xl">
							Kodu gir, adını yaz, oyna. Hesap gerekmez.
						</p>
						<form action="/play" className="flex flex-col gap-2">
							<label
								htmlFor="code"
								className="font-mono text-xs tracking-[0.12em] text-ink-900 uppercase"
							>
								Oda kodu
							</label>
							<div className="flex gap-2">
								<input
									id="code"
									name="code"
									placeholder="3SZ6PU"
									autoComplete="off"
									autoCapitalize="characters"
									maxLength={6}
									required
									className={cn(
										FIELD,
										'min-w-0 flex-1 rounded-full border-ink-900 px-5 font-mono text-xl tracking-[0.2em] uppercase placeholder:tracking-[0.2em] placeholder:text-ink-300',
									)}
								/>
								<PrimaryButton type="submit" className="shrink-0 px-6">
									Katıl
								</PrimaryButton>
							</div>
							<p className="flex items-center gap-2 text-sm text-ink-900">
								<QrCode className="size-4 shrink-0" aria-hidden />
								Ya da host'un ekranındaki QR kodu telefonunla okut.
							</p>
						</form>
					</div>
				</section>
				<a
					href="#how"
					aria-label="Nasıl oynanır bölümüne in"
					className="relative mx-auto mb-6 flex size-11 items-center justify-center rounded-full text-ink-900 hover:bg-ink-900/10"
				>
					<ChevronDown className="size-6" aria-hidden />
				</a>
			</div>

			<main className="flex flex-col">
				{/* 2. ekran: nasıl oynanır + formatlar */}
				<div data-bg="#ffffff" className="flex min-h-dvh snap-start items-center">
					<div className={cn(CONTAINER, 'flex flex-col gap-14 py-16')}>
						<section aria-labelledby="how" className="flex flex-col gap-6">
							<h2 id="how" className="reveal">
								Nasıl oynanır
							</h2>
							<ol className="grid gap-3 sm:grid-cols-3">
								{STEPS.map(({ Icon, title, text }, i) => (
									<li
										key={title}
										className="reveal flex items-center gap-4 rounded-3xl border bg-white p-5"
										style={{ transitionDelay: `${(i + 1) * 120}ms` }}
									>
										<span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-50 text-accent-800">
											<Icon className="size-6" aria-hidden />
										</span>
										<span>
											<span className="block font-semibold">
												{i + 1}. {title}
											</span>
											<span className="block text-sm text-ink-600">
												{text}
											</span>
										</span>
									</li>
								))}
							</ol>
						</section>

						<section aria-labelledby="formats" className="flex flex-col gap-6">
							<h2 id="formats" className="reveal">
								Soru formatları
							</h2>
							<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
								<FormatCard type="choice">
									<div className="grid grid-cols-2 gap-1.5">
										{LETTERS.slice(0, 4)
											.split('')
											.map((l, i) => (
												<span
													key={l}
													className={cn(
														'flex h-8 items-center gap-2 rounded-lg border px-2 text-xs font-bold',
														i === 1
															? 'border-ink-900 bg-accent-50 text-accent-800'
															: 'text-brand-ink',
													)}
												>
													{l}
													<span className="h-1.5 flex-1 rounded-full bg-current opacity-20" />
												</span>
											))}
									</div>
								</FormatCard>
								<FormatCard type="truefalse">
									<div className="grid grid-cols-2 gap-1.5">
										<span className="flex h-[4.25rem] items-center justify-center rounded-lg border border-ink-900 bg-accent-50 text-accent-800">
											<Check className="size-6" strokeWidth={3} />
										</span>
										<span className="flex h-[4.25rem] items-center justify-center rounded-lg border text-muted-foreground">
											<X className="size-6" strokeWidth={3} />
										</span>
									</div>
								</FormatCard>
								<FormatCard type="buzzer">
									<div className="relative h-[4.25rem] overflow-hidden rounded-lg bg-brand-tint">
										{/* Gerçekten bulanık küçük bir örnek: ne olduğunu açıklamadan gösterir */}
										<svg
											viewBox="0 0 120 60"
											className="size-full scale-110 blur-[6px]"
											aria-hidden
										>
											<rect width="120" height="60" fill="#9fd8e6" />
											<circle cx="92" cy="16" r="9" fill="#f5b400" />
											<path
												d="M0 60 L30 26 L52 44 L74 18 L120 60Z"
												fill="#0b7b93"
											/>
										</svg>
										<span className="absolute right-1.5 bottom-1.5 rounded-md bg-ink-900 px-2 py-0.5 text-[10px] font-bold text-white">
											BİLDİM!
										</span>
									</div>
								</FormatCard>
								{/* Video ayrı bir format değil, şıklı sorulara ek; kartı elle */}
								<li className="reveal flex flex-col gap-4 rounded-3xl border bg-white p-5">
									<div className="relative flex h-[4.25rem] flex-col justify-end overflow-hidden rounded-lg bg-ink p-2">
										<Pause
											className="absolute top-1/2 left-1/2 size-6 -translate-1/2 text-white"
											fill="currentColor"
											aria-hidden
										/>
										<span className="relative h-1 rounded-full bg-white/25">
											<span className="absolute inset-y-0 left-0 w-3/5 rounded-full bg-brand" />
										</span>
									</div>
									<div className="flex items-start gap-3">
										<Clapperboard
											className="mt-0.5 size-5 shrink-0 text-brand-ink"
											aria-hidden
										/>
										<span>
											<span className="block font-semibold">
												Sonra ne oldu?
											</span>
											<span className="block text-sm text-muted-foreground">
												Video en kritik anda durur, tahmin et
											</span>
										</span>
									</div>
								</li>
							</ul>
						</section>
					</div>
				</div>

				{/* 3. ekran: kapanış + footer, tek lacivert ekran */}
				<div
					data-bg="#181430"
					className="relative flex min-h-dvh snap-start flex-col overflow-hidden text-cream"
				>
					{/* Buzz'daki gibi arkada dev ve bulanık logo; sayfanın sonunda ekranın ortasında */}
					<p
						aria-hidden
						className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(8rem,30vw,26rem)] leading-none font-extrabold tracking-[-0.06em] text-accent-400 opacity-10 blur-md select-none"
					>
						vigiz
					</p>
					<section className="relative flex flex-1 items-center">
						<div
							className={cn(
								CONTAINER,
								'relative flex flex-col items-start gap-8 py-16 sm:flex-row sm:items-center sm:justify-between',
							)}
						>
							<div className="reveal flex flex-col gap-2">
								<h2 className="text-4xl leading-tight sm:text-5xl">
									Kendi quizini hazırla
								</h2>
								<p className="text-lg text-ink-200">
									Sorularını yaz, oda aç, herkesi davet et.
								</p>
							</div>
							<div
								className="reveal flex flex-wrap items-center gap-2"
								style={{ transitionDelay: '200ms' }}
							>
								<Link
									href={host ? '/host' : '/register'}
									className="flex h-12 items-center rounded-full bg-accent-400 px-6 font-semibold text-ink-900 hover:bg-accent-300"
								>
									{host ? 'Panele git' : 'Hesap oluştur'}
								</Link>
								{!host && (
									<Link
										href="/login"
										className="flex h-12 items-center rounded-full px-4 font-semibold text-cream underline-offset-4 hover:underline"
									>
										Giriş yap
									</Link>
								)}
							</div>
						</div>
					</section>
					<footer className="relative">
						<div
							className={cn(
								CONTAINER,
								'flex items-center justify-between gap-4 py-6 text-sm text-ink-300',
							)}
						>
							<Wordmark dark className="text-lg" />
							<span>Canlı quiz gecesi</span>
						</div>
					</footer>
				</div>
			</main>
		</div>
	);
}

// Hero'da yavaşça süzülen soru balonları (dekor). Konum, boyut ve hız sabit: sunucu ve
// istemci aynı çizer. Mobilde ilk onu görünür.
const BUBBLES = [
	{ x: '6%', y: '16%', size: 28, dur: 26, dark: true },
	{ x: '44%', y: '9%', size: 22, dur: 34, dark: false },
	{ x: '88%', y: '20%', size: 34, dur: 30, dark: true },
	{ x: '72%', y: '80%', size: 24, dur: 38, dark: false },
	{ x: '16%', y: '86%', size: 20, dur: 32, dark: false },
	{ x: '58%', y: '62%', size: 18, dur: 28, dark: true },
	{ x: '93%', y: '58%', size: 22, dur: 36, dark: false },
	{ x: '30%', y: '34%', size: 16, dur: 40, dark: true },
	{ x: '80%', y: '42%', size: 26, dur: 33, dark: true },
	{ x: '3%', y: '52%', size: 22, dur: 29, dark: false },
	{ x: '24%', y: '64%', size: 30, dur: 35, dark: true },
	{ x: '64%', y: '28%', size: 20, dur: 31, dark: false },
	{ x: '50%', y: '88%', size: 26, dur: 27, dark: true },
	{ x: '36%', y: '74%', size: 14, dur: 39, dark: false },
	{ x: '97%', y: '88%', size: 18, dur: 37, dark: true },
	{ x: '12%', y: '38%', size: 16, dur: 41, dark: false },
	{ x: '70%', y: '6%', size: 16, dur: 30, dark: true },
	{ x: '86%', y: '70%', size: 14, dur: 34, dark: false },
	{ x: '48%', y: '46%', size: 14, dur: 42, dark: false },
	{ x: '20%', y: '8%', size: 18, dur: 28, dark: true },
];

function FloatingBubbles() {
	return (
		<div aria-hidden className="pointer-events-none absolute inset-0">
			{BUBBLES.map((b, i) => (
				<span
					key={`${b.x}${b.y}`}
					className={cn(
						'bubble absolute',
						i >= 10 && 'hidden sm:block',
						b.dark ? 'opacity-25' : 'opacity-80',
					)}
					style={{
						left: b.x,
						top: b.y,
						animationDuration: `${b.dur}s`,
						animationDelay: `-${i * 3}s`,
					}}
				>
					<LogoMark
						bubble={b.dark ? '#181430' : '#ffffff'}
						mark={b.dark ? '#ffc83d' : '#181430'}
						size={b.size}
					/>
				</span>
			))}
		</div>
	);
}

function FormatCard({ type, children }: { type: keyof typeof FORMATS; children: React.ReactNode }) {
	const { label, short, Icon } = FORMATS[type];
	return (
		<li className="reveal flex flex-col gap-4 rounded-3xl border bg-white p-5">
			{children}
			<div className="flex items-start gap-3">
				<Icon className="mt-0.5 size-5 shrink-0 text-brand-ink" aria-hidden />
				<span>
					<span className="block font-semibold">{label}</span>
					<span className="block text-sm text-muted-foreground">{short}</span>
				</span>
			</div>
		</li>
	);
}

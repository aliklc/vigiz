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
		// Zemin rengi kaydırdıkça bölümlerin renkleri (data-bg) arasında akar: mercan → krem →
		// mercan (ScrollEffects). JS yoksa bölümler kendi zeminleriyle görünür.
		<div data-home className="relative flex min-h-dvh flex-col bg-shell text-cocoa">
			<ScrollEffects />
			<FloatingBubbles />
			<div data-bg="#ff8f70" className="relative flex min-h-dvh snap-start flex-col bg-coral">
				<SiteHeader tone="hero" />
				<section
					className={cn(
						CONTAINER,
						'relative grid flex-1 grid-cols-1 content-center items-center gap-10 py-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12',
					)}
				>
					<div>
						<h1 className="hero-mark text-[clamp(5.5rem,17vw,12rem)] leading-[0.85] font-extrabold tracking-[-0.06em] text-cocoa">
							vigiz
						</h1>
						<p className="mt-5 font-mono text-xs tracking-[0.12em] text-cocoa uppercase sm:text-sm">
							Aylık quiz gecesi
						</p>
						<div
							className="reveal mt-10 flex max-w-lg flex-col gap-6"
							style={{ transitionDelay: '500ms' }}
						>
							<p className="text-2xl leading-tight font-semibold tracking-tight text-cocoa sm:text-3xl">
								Kodu gir, adını yaz, oyna. Hesap gerekmez.
							</p>
							<form action="/play" className="flex flex-col gap-2">
								<label
									htmlFor="code"
									className="font-mono text-xs tracking-[0.12em] text-cocoa uppercase"
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
											'min-w-0 flex-1 rounded-full border-cocoa px-5 font-mono text-xl tracking-[0.2em] uppercase placeholder:tracking-[0.2em] placeholder:text-ink-300',
										)}
									/>
									<PrimaryButton
										type="submit"
										className="shrink-0 bg-cocoa px-6 text-white hover:bg-cocoa/90"
									>
										Katıl
									</PrimaryButton>
								</div>
								<p className="flex items-center gap-2 text-sm text-cocoa">
									<QrCode className="size-4 shrink-0" aria-hidden />
									Ya da host'un ekranındaki QR kodu telefonunla okut.
								</p>
							</form>
						</div>
					</div>
					<SampleQuestion />
				</section>
				<a
					href="#how"
					aria-label="Nasıl oynanır bölümüne in"
					className="relative mx-auto mb-6 flex size-11 items-center justify-center rounded-full text-cocoa hover:bg-cocoa/10"
				>
					<ChevronDown className="size-6" aria-hidden />
				</a>
			</div>

			<main className="flex flex-col">
				{/* 2. ekran: nasıl oynanır + formatlar */}
				<div
					data-bg="#fff8f2"
					className="relative flex min-h-dvh snap-start items-center bg-shell"
				>
					<div className={cn(CONTAINER, 'flex flex-col gap-16 py-20')}>
						<section aria-labelledby="how" className="flex flex-col gap-8">
							<h2 id="how" className="reveal text-4xl sm:text-5xl">
								Nasıl oynanır
							</h2>
							<ol className="grid gap-4 md:grid-cols-3">
								{STEPS.map(({ Icon, title, text }, i) => (
									<li
										key={title}
										className="reveal flex items-center gap-5 rounded-3xl border border-cocoa/10 bg-white p-6 lg:p-8"
										style={{ transitionDelay: `${(i + 1) * 120}ms` }}
									>
										<span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-peach/50 text-forest">
											<Icon className="size-8" aria-hidden />
										</span>
										<span>
											<span className="block text-xl font-semibold">
												{i + 1}. {title}
											</span>
											<span className="block text-base text-cocoa/75">
												{text}
											</span>
										</span>
									</li>
								))}
							</ol>
						</section>

						<section aria-labelledby="formats" className="flex flex-col gap-8">
							<h2 id="formats" className="reveal text-4xl sm:text-5xl">
								Soru formatları
							</h2>
							<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
								<FormatCard type="choice">
									<div className="grid grid-cols-2 gap-1.5">
										{LETTERS.slice(0, 4)
											.split('')
											.map((l, i) => (
												<span
													key={l}
													className={cn(
														'flex h-[3.25rem] items-center gap-2 rounded-xl border px-3 text-sm font-bold',
														i === 1
															? 'border-forest bg-forest/10 text-forest'
															: 'text-cocoa/70',
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
										<span className="flex h-28 items-center justify-center rounded-xl border border-forest bg-forest/10 text-forest">
											<Check className="size-9" strokeWidth={3} />
										</span>
										<span className="flex h-28 items-center justify-center rounded-xl border text-cocoa/60">
											<X className="size-9" strokeWidth={3} />
										</span>
									</div>
								</FormatCard>
								<FormatCard type="buzzer">
									<div className="relative h-28 overflow-hidden rounded-lg bg-peach/50">
										{/* Gerçekten bulanık küçük bir örnek: ne olduğunu açıklamadan gösterir */}
										<svg
											viewBox="0 0 120 60"
											className="size-full scale-110 blur-[6px]"
											aria-hidden
										>
											<rect width="120" height="60" fill="#ffd7c7" />
											<circle cx="92" cy="16" r="9" fill="#ff8f70" />
											<path
												d="M0 60 L30 26 L52 44 L74 18 L120 60Z"
												fill="#1f5c4a"
											/>
										</svg>
										<span className="absolute right-1.5 bottom-1.5 rounded-md bg-cocoa px-2.5 py-1 text-xs font-bold text-shell">
											BİLDİM!
										</span>
									</div>
								</FormatCard>
								{/* Video ayrı bir format değil, şıklı sorulara ek; kartı elle */}
								<li className="reveal flex flex-col gap-4 rounded-3xl border border-cocoa/10 bg-white p-6 lg:p-7">
									<div className="relative flex h-28 flex-col justify-end overflow-hidden rounded-lg bg-cocoa p-2">
										<Pause
											className="absolute top-1/2 left-1/2 size-9 -translate-1/2 text-white"
											fill="currentColor"
											aria-hidden
										/>
										<span className="relative h-1.5 rounded-full bg-white/25">
											<span className="absolute inset-y-0 left-0 w-3/5 rounded-full bg-coral" />
										</span>
									</div>
									<div className="flex items-start gap-3">
										<Clapperboard
											className="mt-0.5 size-6 shrink-0 text-forest"
											aria-hidden
										/>
										<span>
											<span className="block text-xl font-semibold">
												Sonra ne oldu?
											</span>
											<span className="block text-base text-cocoa/75">
												Video en kritik anda durur, tahmin et
											</span>
										</span>
									</div>
								</li>
							</ul>
						</section>
					</div>
				</div>

				{/* 3. ekran: kapanış + footer, yine mercan */}
				<div
					data-bg="#ff8f70"
					className="relative flex min-h-dvh snap-start flex-col overflow-hidden bg-coral"
				>
					<section className="relative flex flex-1 items-center justify-center">
						{/* Buzz'daki gibi arkada dev ve bulanık logo; içerik tam üstünde ortalı */}
						<p
							aria-hidden
							className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pb-[0.12em] text-[clamp(12rem,48vw,36rem)] leading-none font-extrabold tracking-[-0.06em] text-cocoa opacity-10 blur-md select-none"
						>
							vigiz
						</p>
						<div
							className={cn(
								CONTAINER,
								'relative flex flex-col items-center gap-8 py-16 text-center',
							)}
						>
							<div className="reveal flex flex-col items-center gap-3">
								<h2 className="text-5xl leading-tight sm:text-6xl">
									Kendi quizini hazırla
								</h2>
								<p className="text-lg text-cocoa/80 sm:text-xl">
									Sorularını yaz, oda aç, herkesi davet et.
								</p>
							</div>
							<div
								className="reveal flex flex-wrap items-center justify-center gap-2"
								style={{ transitionDelay: '200ms' }}
							>
								<Link
									href={host ? '/host' : '/register'}
									className="flex h-14 items-center rounded-full bg-cocoa px-7 text-lg font-semibold text-white hover:bg-cocoa/90"
								>
									{host ? 'Panele git' : 'Hesap oluştur'}
								</Link>
								{!host && (
									<Link
										href="/login"
										className="flex h-14 items-center rounded-full px-5 text-lg font-semibold text-cocoa underline-offset-4 hover:underline"
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
								'flex items-center justify-between gap-4 py-6 text-sm text-cocoa/80',
							)}
						>
							<Wordmark
								className="text-lg text-cocoa"
								colors={{ bubble: '#fff8f2', mark: '#ff8f70' }}
							/>
							<span>Canlı quiz gecesi</span>
						</div>
					</footer>
				</div>
			</main>
		</div>
	);
}

// Tüm sayfa boyunca arkada yavaşça süzülen soru balonları (sabit katman, dekor). Konum, boyut
// ve hız sabit: sunucu ve istemci aynı çizer. Mobilde ilk onu görünür.
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
		<div aria-hidden className="pointer-events-none fixed inset-0">
			{BUBBLES.map((b, i) => (
				<span
					key={`${b.x}${b.y}`}
					className={cn(
						'bubble absolute',
						i >= 10 && 'hidden sm:block',
						b.dark ? 'opacity-90' : 'opacity-70',
					)}
					style={{
						left: b.x,
						top: b.y,
						animationDuration: `${b.dur}s`,
						animationDelay: `-${i * 3}s`,
					}}
				>
					<LogoMark
						bubble={b.dark ? '#fff8f2' : '#ffd7c7'}
						mark={b.dark ? '#ff8f70' : '#3b1e1a'}
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
		<li className="reveal flex flex-col gap-4 rounded-3xl border border-cocoa/10 bg-white p-6 lg:p-7">
			{children}
			<div className="flex items-start gap-3">
				<Icon className="mt-0.5 size-6 shrink-0 text-forest" aria-hidden />
				<span>
					<span className="block text-xl font-semibold">{label}</span>
					<span className="block text-base text-cocoa/75">{short}</span>
				</span>
			</div>
		</li>
	);
}

// Hero'nun sağındaki örnek soru: oyuncunun telefonda ne göreceğini gösterir (tıklanamaz).
function SampleQuestion() {
	return (
		<div
			aria-hidden
			className="reveal flex w-full flex-col gap-4 rounded-3xl border-2 border-cocoa bg-white p-6 lg:max-w-md lg:justify-self-end"
			style={{ transitionDelay: '800ms' }}
		>
			<div className="flex items-center justify-between">
				<span className="font-mono text-sm font-medium text-cocoa/70 uppercase">
					Soru 3 / 10
				</span>
				<span className="flex size-10 items-center justify-center rounded-full border-4 border-coral font-mono text-sm font-medium">
					14
				</span>
			</div>
			<div className="h-1.5 rounded-full bg-peach/60">
				<div className="h-full w-3/5 rounded-full bg-coral" />
			</div>
			<p className="eyebrow text-forest">Çoktan seçmeli</p>
			<p className="text-xl font-semibold tracking-tight">
				Güneş sistemindeki en büyük gezegen hangisi?
			</p>
			<div className="flex flex-col gap-2">
				{['Satürn', 'Jüpiter', 'Neptün'].map((c, i) => (
					<span
						key={c}
						className={cn(
							'flex items-center gap-3 rounded-2xl border-2 p-2.5 font-medium',
							i === 1 ? 'border-cocoa bg-peach/40' : 'border-cocoa/15',
						)}
					>
						<span
							className={cn(
								'flex size-8 items-center justify-center rounded-lg text-sm font-bold',
								i === 1 ? 'bg-coral text-cocoa' : 'bg-shell text-cocoa/80',
							)}
						>
							{LETTERS[i]}
						</span>
						{c}
					</span>
				))}
			</div>
		</div>
	);
}

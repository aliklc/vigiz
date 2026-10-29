import { Check, Clapperboard, Pause, QrCode, Trophy, UserRound, X } from 'lucide-react';
import Link from 'next/link';

import { FIELD, LETTERS, Wordmark } from '@/components/brand';
import { FORMATS } from '@/components/formats';
import { PrimaryButton } from '@/components/player-screen';
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
		<div className="stage flex flex-col">
			<SiteHeader />
			<main className="flex flex-col">
				<section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-20">
					<div className="flex flex-col gap-5">
						<p className="eyebrow">Aylık quiz gecesi</p>
						<h1 className="text-4xl leading-tight font-bold sm:text-5xl">
							Kodu gir, adını yaz, oyna
						</h1>
						<p className="max-w-md text-lg text-ink-600">
							Host'un ekranındaki 6 karakterlik kodla odaya katıl. Hesap gerekmez.
						</p>
						<form action="/play" className="flex max-w-md flex-col gap-2">
							<label htmlFor="code" className="text-sm font-medium">
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
										'min-w-0 flex-1 text-xl font-semibold tracking-[0.2em] uppercase placeholder:tracking-[0.2em] placeholder:text-ink-300',
									)}
								/>
								<PrimaryButton type="submit">Katıl</PrimaryButton>
							</div>
							<p className="flex items-center gap-2 text-sm text-ink-600">
								<QrCode className="size-4" aria-hidden />
								Ya da host'un ekranındaki QR kodu telefonunla okut.
							</p>
						</form>
					</div>
					<SampleQuestion />
				</section>

				<div className="bg-white">
					<div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-8">
						<section aria-labelledby="how" className="flex flex-col gap-6">
							<h2 id="how">Nasıl oynanır</h2>
							<ol className="grid gap-3 sm:grid-cols-3">
								{STEPS.map(({ Icon, title, text }, i) => (
									<li
										key={title}
										className="flex items-center gap-4 rounded-3xl border bg-white p-5"
									>
										<span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
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
							<h2 id="formats" className="text-2xl font-bold tracking-tight">
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
															? 'border-teal-500 bg-teal-50 text-teal-700'
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
										<span className="flex h-[4.25rem] items-center justify-center rounded-lg border border-teal-500 bg-teal-50 text-teal-700">
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
										<span className="absolute right-1.5 bottom-1.5 rounded-md bg-teal-700 px-2 py-0.5 text-[10px] font-bold text-white">
											BİLDİM!
										</span>
									</div>
								</FormatCard>
								{/* Video ayrı bir format değil, şıklı sorulara ek; kartı elle */}
								<li className="flex flex-col gap-4 rounded-3xl border bg-white p-5">
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

				<section className="bg-teal-50">
					<div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-8">
						<div className="flex flex-col gap-1">
							<h2>Kendi quizini hazırla</h2>
							<p className="text-ink-700">
								Sorularını yaz, oda aç, herkesi davet et.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							{host ? (
								<Link href="/host" className={SECONDARY}>
									Panele git
								</Link>
							) : (
								<>
									<Link href="/register" className={SECONDARY}>
										Hesap oluştur
									</Link>
									<Link
										href="/login"
										className="flex h-12 items-center rounded-xl px-4 font-semibold text-teal-700 hover:underline"
									>
										Giriş yap
									</Link>
								</>
							)}
						</div>
					</div>
				</section>
			</main>
			<footer className="border-t bg-white">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 text-sm text-ink-600 sm:px-8">
					<Wordmark className="text-lg" />
					<span>Canlı quiz gecesi</span>
				</div>
			</footer>
		</div>
	);
}

const SECONDARY =
	'flex h-12 items-center rounded-xl border-[1.5px] border-ink-300 bg-white px-5 font-semibold text-ink-900 hover:bg-ink-50';

// Hero'nun sağındaki örnek soru: oyuncunun telefonda ne göreceğini gösterir (tıklanamaz).
function SampleQuestion() {
	return (
		<div
			aria-hidden
			className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-3xl border bg-white p-6"
		>
			<div className="flex items-center justify-between">
				<span className="text-sm font-semibold text-ink-600">Soru 3 / 10</span>
				<span className="flex size-10 items-center justify-center rounded-full border-4 border-teal-500 text-sm font-bold">
					14
				</span>
			</div>
			<div className="h-1.5 rounded-full bg-ink-200">
				<div className="h-full w-3/5 rounded-full bg-teal-500" />
			</div>
			<p className="eyebrow">Çoktan seçmeli</p>
			<p className="text-xl font-semibold tracking-tight">
				Güneş sistemindeki en büyük gezegen hangisi?
			</p>
			<div className="flex flex-col gap-2">
				{['Satürn', 'Jüpiter', 'Neptün'].map((c, i) => (
					<span
						key={c}
						className={cn(
							'flex items-center gap-3 rounded-2xl border-2 p-2.5 font-medium',
							i === 1 ? 'border-teal-500 bg-teal-50' : 'border-ink-200',
						)}
					>
						<span
							className={cn(
								'flex size-8 items-center justify-center rounded-lg text-sm font-bold',
								i === 1 ? 'bg-teal-500 text-white' : 'bg-ink-100 text-ink-700',
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

function FormatCard({ type, children }: { type: keyof typeof FORMATS; children: React.ReactNode }) {
	const { label, short, Icon } = FORMATS[type];
	return (
		<li className="flex flex-col gap-4 rounded-3xl border bg-white p-5">
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

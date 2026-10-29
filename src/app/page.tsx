import { Check, Clapperboard, Pause, QrCode, Trophy, UserRound, X } from 'lucide-react';
import Link from 'next/link';

import { FIELD, LETTERS } from '@/components/brand';
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
			<main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-8 lg:gap-24 lg:py-16">
				<section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
					<div className="flex flex-col gap-4 text-center lg:text-left">
						<h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
							Ayın quiz gecesine katıl
						</h1>
						<p className="text-lg text-muted-foreground">
							Host'un ekranındaki kodu gir, adını yaz ve oyna.
						</p>
					</div>
					<form
						action="/play"
						className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-3xl border bg-white p-6 sm:p-8"
					>
						<div>
							<h2 className="text-xl font-semibold">Odaya gir</h2>
							<p className="text-sm text-muted-foreground">6 karakterlik oda kodu</p>
						</div>
						<label htmlFor="code" className="sr-only">
							Oda kodu
						</label>
						<input
							id="code"
							name="code"
							placeholder="ÖRN. 3SZ6PU"
							autoComplete="off"
							autoCapitalize="characters"
							maxLength={6}
							required
							className={cn(
								FIELD,
								'h-14 text-center text-2xl font-bold tracking-[0.25em] uppercase placeholder:text-base placeholder:font-normal placeholder:tracking-normal',
							)}
						/>
						<PrimaryButton type="submit">Katıl</PrimaryButton>
					</form>
				</section>

				<section aria-labelledby="how" className="flex flex-col gap-6">
					<h2 id="how" className="text-2xl font-bold tracking-tight">
						Nasıl oynanır
					</h2>
					<ol className="grid gap-3 sm:grid-cols-3">
						{STEPS.map(({ Icon, title, text }, i) => (
							<li
								key={title}
								className="flex items-center gap-4 rounded-2xl border bg-white p-5"
							>
								<span className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-ink">
									<Icon className="size-6" />
									<span className="absolute -top-2 -left-2 flex size-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
										{i + 1}
									</span>
								</span>
								<span>
									<span className="block font-semibold">{title}</span>
									<span className="block text-sm text-muted-foreground">
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
									<path d="M0 60 L30 26 L52 44 L74 18 L120 60Z" fill="#0b7b93" />
								</svg>
								<span className="absolute right-1.5 bottom-1.5 rounded-md bg-brand px-2 py-0.5 text-[10px] font-extrabold text-white">
									BİLDİM!
								</span>
							</div>
						</FormatCard>
						{/* Video ayrı bir format değil, şıklı sorulara ek; kartı elle */}
						<li className="flex flex-col gap-4 rounded-2xl border bg-white p-5">
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
									<span className="block font-semibold">Sonra ne oldu?</span>
									<span className="block text-sm text-muted-foreground">
										Video en kritik anda durur, tahmin et
									</span>
								</span>
							</div>
						</li>
					</ul>
				</section>

				<section className="flex flex-col items-center gap-4 rounded-3xl border bg-white p-8 text-center sm:p-10">
					<h2 className="text-2xl font-bold tracking-tight">Kendi quizini hazırla</h2>
					<p className="text-muted-foreground">Sorularını yaz, oda aç, ekibi davet et.</p>
					<div className="flex flex-wrap justify-center gap-3">
						{host ? (
							<Link
								href="/host"
								className="rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-600"
							>
								Panele git
							</Link>
						) : (
							<>
								<Link
									href="/register"
									className="rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-600"
								>
									Hesap oluştur
								</Link>
								<Link
									href="/login"
									className="rounded-xl border px-6 py-3 font-semibold hover:bg-muted"
								>
									Giriş yap
								</Link>
							</>
						)}
					</div>
				</section>
			</main>
		</div>
	);
}

function FormatCard({ type, children }: { type: keyof typeof FORMATS; children: React.ReactNode }) {
	const { label, short, Icon } = FORMATS[type];
	return (
		<li className="flex flex-col gap-4 rounded-2xl border bg-white p-5">
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

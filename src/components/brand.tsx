import { cn } from '@/lib/utils';

// Şıklar renk yerine harfle ayrılır (tek vurgu renkli sade dil).
export const LETTERS = 'ABCDE';

// Menü ve sayfa içeriği aynı yatay kabı kullanır; kenarlar her genişlikte hizalı kalır.
export const CONTAINER = 'mx-auto w-full max-w-6xl px-4 sm:px-8';

// Ortak input stili (sunucu bileşenlerinde de kullanılır; 'use client' dosyasında olmamalı).
export const FIELD =
	'h-14 rounded-xl border-[1.5px] border-ink-300 bg-white px-4 text-base text-ink outline-none placeholder:text-ink-500 focus-visible:border-ink-900 focus-visible:ring-3 focus-visible:ring-ink-900/20';

// Logo işareti: konuşma balonu içinde soru işareti. Uygulama ikonu da aynı çizimi kullanır.
export function LogoMark({
	bubble,
	mark,
	outline,
	className,
	size,
}: {
	bubble: string;
	mark: string;
	// Açık zeminde krem balon kaybolmasın diye ince kontur
	outline?: string;
	className?: string;
	size?: number; // piksel; verilmezse className belirler
}) {
	return (
		<svg viewBox="0 0 48 48" aria-hidden className={className} width={size} height={size}>
			{outline && (
				// Konturlu şekiller altta, dolgulu olanlar üstte: balon ile kuyruğun birleşimi tek parça görünür
				<g fill={outline} stroke={outline} strokeWidth="4" strokeLinejoin="round">
					<ellipse cx="25.5" cy="21" rx="20.5" ry="18.5" />
					<path d="M10 31 L6 45 L19 38.5 Z" />
				</g>
			)}
			<ellipse cx="25.5" cy="21" rx="20.5" ry="18.5" fill={bubble} />
			<path d="M10 31 L6 45 L19 38.5 Z" fill={bubble} />
			<path
				d="M19.5 15.5a6 6 0 1 1 9 5.2c-1.9 1.1-3 2.3-3 4.6"
				fill="none"
				stroke={mark}
				strokeWidth="4.6"
				strokeLinecap="round"
			/>
			<circle cx="25.5" cy="31.2" r="2.9" fill={mark} />
		</svg>
	);
}

// Logo: krem balon içinde mercan soru işareti + kalın "vigiz". Açık zeminde balonun yazı
// renginde ince konturu olur.
export function Wordmark({
	className,
	dark,
	colors,
}: {
	className?: string;
	dark?: boolean;
	// Konturu kapatmak ya da renkleri değiştirmek için (ör. mercan zemin); yazı rengi className'den
	colors?: { bubble: string; mark: string; outline?: string };
}) {
	return (
		<span
			role="img"
			aria-label="vigiz"
			className={cn(
				'inline-flex items-center gap-[0.22em] leading-none font-extrabold tracking-[-0.05em]',
				dark ? 'text-cream' : 'text-ink-900',
				className,
			)}
		>
			<LogoMark
				bubble={colors?.bubble ?? '#fff8f2'}
				mark={colors?.mark ?? '#ff8f70'}
				outline={colors ? colors.outline : dark ? undefined : 'currentColor'}
				className="size-[1.15em] shrink-0"
			/>
			<span aria-hidden className="pb-[0.12em]">
				vigiz
			</span>
		</span>
	);
}

// Oda kodu: her karakter ayrı bir kutu (projeksiyonda uzaktan okunur).
export function CodeTiles({ code, size = 'lg' }: { code: string; size?: 'md' | 'lg' }) {
	return (
		<span
			role="img"
			className="inline-flex gap-1.5 sm:gap-2.5"
			aria-label={`Oda kodu ${code.split('').join(' ')}`}
		>
			{code.split('').map((ch, i) => (
				<span
					key={i}
					aria-hidden
					className={cn(
						'flex items-center justify-center rounded-xl border border-accent-600/40 bg-accent-50 font-mono font-medium text-ink-900',
						size === 'lg'
							? 'h-16 w-12 text-4xl sm:h-28 sm:w-20 sm:text-7xl'
							: 'h-10 w-8 text-2xl',
					)}
				>
					{ch}
				</span>
			))}
		</span>
	);
}

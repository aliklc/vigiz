import { cn } from '@/lib/utils';

// Şıklar renk yerine harfle ayrılır (vignetim.com'un sade, tek vurgu renkli dili).
export const LETTERS = 'ABCDE';

// Ortak input stili (sunucu bileşenlerinde de kullanılır; 'use client' dosyasında olmamalı).
export const FIELD =
	'h-12 rounded-xl border border-[#c9d1d6] bg-white px-4 text-base text-ink outline-none placeholder:text-muted-foreground focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/25';

// "vignetim." logosuyla aynı aile: küçük harf, camgöbeği, sonda nokta.
export function Wordmark({ className, dark }: { className?: string; dark?: boolean }) {
	return (
		<span
			className={cn(
				'font-bold tracking-[-0.035em]',
				dark ? 'text-white' : 'text-ink-900',
				className,
			)}
		>
			vigiz<span className={dark ? 'text-teal-300' : 'text-teal-500'}>.</span>
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
						'flex items-center justify-center rounded-xl border border-brand/30 bg-brand-tint font-bold text-brand-ink',
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

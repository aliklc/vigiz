import { cn } from '@/lib/utils';

// Şıklar renk yerine harfle ayrılır (tek vurgu renkli sade dil).
export const LETTERS = 'ABCDE';

// Ortak input stili (sunucu bileşenlerinde de kullanılır; 'use client' dosyasında olmamalı).
export const FIELD =
	'h-14 rounded-xl border-[1.5px] border-ink-300 bg-white px-4 text-base text-ink outline-none placeholder:text-ink-500 focus-visible:border-teal-500 focus-visible:ring-3 focus-visible:ring-teal-500/20';

// Kelime markası: küçük harf, sıkı aralık, teal nokta.
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

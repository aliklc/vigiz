import { cn } from '@/lib/utils';

// Şık renkleri markanın kendisi: logo, oda kodu ve oyun aynı beş rengi kullanır.
export const CHOICE_BG = ['bg-c1', 'bg-c2', 'bg-c3', 'bg-c4', 'bg-c5'];
// Sarı üzerinde beyaz yazı okunmuyor; o şıkta koyu yazı.
export const CHOICE_TEXT = ['text-white', 'text-white', 'text-ink', 'text-white', 'text-white'];
const CHOICE_FILL = ['fill-c1', 'fill-c2', 'fill-c3', 'fill-c4', 'fill-c5'];

// Renk körleri için her şıkkın bir de şekli var.
const SHAPES = [
	<path key="0" d="M12 3 22 20H2Z" />,
	<path key="1" d="M12 2 22 12 12 22 2 12Z" />,
	<circle key="2" cx="12" cy="12" r="10" />,
	<rect key="3" x="3" y="3" width="18" height="18" rx="2" />,
	<path key="4" d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6Z" />,
];

export function ChoiceShape({ index, className }: { index: number; className?: string }) {
	return (
		<svg viewBox="0 0 24 24" aria-hidden className={cn('size-6 fill-current', className)}>
			{SHAPES[index]}
		</svg>
	);
}

export function Wordmark({ className }: { className?: string }) {
	return (
		<span
			role="img"
			aria-label="vigiz"
			className={cn(
				'inline-flex items-baseline font-display font-extrabold tracking-tight',
				className,
			)}
		>
			<span aria-hidden className="contents">
				v<DotI fill={CHOICE_FILL[0]} />g<DotI fill={CHOICE_FILL[2]} />z
			</span>
		</span>
	);
}

// "ı" + renkli şekil noktası (logo).
function DotI({ fill }: { fill: string }) {
	return (
		<span className="relative inline-block">
			ı
			<svg
				viewBox="0 0 24 24"
				aria-hidden
				className={cn(
					'absolute top-[0.02em] left-1/2 size-[0.32em] -translate-x-1/2',
					fill,
				)}
			>
				<circle cx="12" cy="12" r="11" />
			</svg>
		</span>
	);
}

// Oda kodu: her harf ayrı renkli bir karo (projeksiyondaki imza öğe).
export function CodeTiles({ code, size = 'lg' }: { code: string; size?: 'md' | 'lg' }) {
	return (
		<span
			role="img"
			className="inline-flex gap-1.5 sm:gap-3"
			aria-label={`Oda kodu ${code.split('').join(' ')}`}
		>
			{code.split('').map((ch, i) => (
				<span
					key={i}
					aria-hidden
					className={cn(
						'flex items-center justify-center rounded-xl font-display font-extrabold shadow-[0_6px_0_rgb(0_0_0/0.25)]',
						CHOICE_BG[i % 5],
						CHOICE_TEXT[i % 5],
						size === 'lg'
							? 'h-20 w-16 text-5xl sm:h-32 sm:w-24 sm:text-8xl'
							: 'h-12 w-10 text-3xl',
					)}
				>
					{ch}
				</span>
			))}
		</span>
	);
}

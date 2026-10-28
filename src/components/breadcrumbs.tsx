import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

// Host panelinde konum: "Quizlerim › Ekim Quiz Night › Oda 3SZ6PU". Son öğe link değildir.
export function Breadcrumbs({
	items,
	className,
}: {
	items: { label: string; href?: string }[];
	className?: string;
}) {
	return (
		<nav aria-label="Konum" className={cn('min-w-0', className)}>
			<ol className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
				{items.map((item, i) => {
					const last = i === items.length - 1;
					return (
						<li
							key={i}
							className={cn('flex min-w-0 items-center gap-1', last && 'shrink')}
						>
							{item.href && !last ? (
								<Link
									href={item.href}
									className="truncate hover:text-ink hover:underline"
								>
									{item.label}
								</Link>
							) : (
								<span
									aria-current={last ? 'page' : undefined}
									className={cn('truncate', last && 'font-medium text-ink')}
								>
									{item.label}
								</span>
							)}
							{!last && <ChevronRight className="size-4 shrink-0" aria-hidden />}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}

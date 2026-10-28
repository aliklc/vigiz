import Link from 'next/link';

import { Wordmark } from '@/components/brand';

// Herkese açık sayfaların üst menüsü (vignetim.com'daki gibi: logo solda, aksiyonlar sağda).
export function SiteHeader() {
	return (
		<header className="border-b bg-white/80 backdrop-blur">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
				<Link href="/" aria-label="Ana sayfa">
					<Wordmark className="text-2xl" />
				</Link>
				<nav className="flex items-center gap-1 text-sm font-medium sm:gap-3">
					<Link
						href="/host"
						className="rounded-lg bg-ink px-4 py-2 text-white hover:bg-ink/85"
					>
						Quiz hazırla
					</Link>
				</nav>
			</div>
		</header>
	);
}

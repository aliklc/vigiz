import Link from 'next/link';

import { CONTAINER, Wordmark } from '@/components/brand';
import { getHost } from '@/lib/auth';
import { cn } from '@/lib/utils';

// Herkese açık sayfaların üst menüsü: logo solda, aksiyonlar sağda.
// Sayfanın birincil aksiyonu içerikte; buradakiler ikincil.
export async function SiteHeader() {
	const host = await getHost();
	return (
		<header className="border-b bg-white">
			<div className={cn(CONTAINER, 'flex items-center justify-between gap-2 py-3')}>
				<Link href="/" aria-label="Ana sayfa" className="py-2">
					<Wordmark className="text-2xl" />
				</Link>
				<nav className="flex items-center gap-1 sm:gap-2">
					{host ? (
						<Link href="/host" className={SECONDARY}>
							Panele git
						</Link>
					) : (
						<>
							<Link href="/register" className={SECONDARY}>
								Quiz hazırla
							</Link>
							<Link
								href="/login"
								className="flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-teal-700 hover:bg-teal-50"
							>
								Giriş yap
							</Link>
						</>
					)}
				</nav>
			</div>
		</header>
	);
}

const SECONDARY =
	'flex h-11 items-center rounded-xl border-[1.5px] border-ink-300 bg-white px-4 text-sm font-semibold text-ink-900 hover:bg-ink-50';

import Link from 'next/link';

import { CONTAINER, Wordmark } from '@/components/brand';
import { getHost } from '@/lib/auth';
import { cn } from '@/lib/utils';

// Herkese açık sayfaların üst menüsü: logo solda, aksiyonlar sağda.
// Sayfanın birincil aksiyonu içerikte; buradakiler ikincil.
export async function SiteHeader({ tone }: { tone?: 'hero' }) {
	const host = await getHost();
	return (
		// tone="hero": ana sayfada mercan hero'nun içinde, zeminsiz ve çizgisiz.
		<header className={cn('relative', tone ? '' : 'border-b bg-white')}>
			<div className={cn(CONTAINER, 'flex items-center justify-between gap-2 py-3')}>
				<Link href="/" aria-label="Ana sayfa" className="py-2">
					{tone ? (
						<Wordmark
							className="text-2xl text-cocoa"
							colors={{ bubble: '#fff8f2', mark: '#ff8f70' }}
						/>
					) : (
						<Wordmark className="text-2xl" />
					)}
				</Link>
				<nav className="flex items-center gap-1 sm:gap-2">
					{host ? (
						<Link href="/host" className={cn(SECONDARY, tone && HERO)}>
							Panele git
						</Link>
					) : (
						<>
							<Link href="/register" className={cn(SECONDARY, tone && HERO)}>
								Quiz hazırla
							</Link>
							<Link
								href="/login"
								className={cn(
									'flex h-11 items-center rounded-full px-3 text-sm font-semibold hover:underline',
									tone ? 'text-cocoa' : 'text-accent-800',
								)}
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
	'flex h-11 items-center rounded-full border-[1.5px] border-ink-300 bg-white px-4 text-sm font-semibold text-ink-900 hover:bg-ink-50';

// Mercan zeminde: beyaz hap, kahve çerçeve ve yazı
const HERO = 'border-cocoa/30 text-cocoa hover:bg-shell';

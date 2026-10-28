import Link from 'next/link';

import { Wordmark } from '@/components/brand';
import { getHost } from '@/lib/auth';

// Herkese açık sayfaların üst menüsü (vignetim.com'daki gibi: logo solda, aksiyonlar sağda).
// Giriş yapmış host'a "Panele git", diğerlerine "Quiz hazırla".
export async function SiteHeader() {
	const host = await getHost();
	return (
		<header className="border-b bg-white/80 backdrop-blur">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
				<Link href="/" aria-label="Ana sayfa">
					<Wordmark className="text-2xl" />
				</Link>
				<Link
					href="/host"
					className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/85"
				>
					{host ? 'Panele git' : 'Quiz hazırla'}
				</Link>
			</div>
		</header>
	);
}

import { LogOut } from 'lucide-react';
import Link from 'next/link';

import { Wordmark } from '@/components/brand';
import { requireHost } from '@/lib/auth';

export default async function PanelLayout({ children }: LayoutProps<'/host'>) {
	const host = await requireHost();
	return (
		<div className="flex min-h-dvh flex-col">
			<header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
				<div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-6 sm:px-8">
					<Link href="/host" aria-label="Quizlerim">
						<Wordmark className="text-2xl" />
					</Link>
					<nav className="flex flex-1 gap-1 text-sm font-medium">
						<Link href="/host" className="rounded-lg px-3 py-2 hover:bg-muted">
							Quizlerim
						</Link>
					</nav>
					<span
						className="hidden truncate text-sm text-muted-foreground sm:block"
						title={host.email}
					>
						{host.name}
					</span>
					<form method="post" action="/api/auth/logout">
						<button
							type="submit"
							className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
						>
							<LogOut className="size-4" />
							<span className="sr-only sm:not-sr-only">Çıkış yap</span>
						</button>
					</form>
				</div>
			</header>
			<div className="flex-1">{children}</div>
		</div>
	);
}

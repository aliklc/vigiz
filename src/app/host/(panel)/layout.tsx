import { LogOut } from 'lucide-react';
import Link from 'next/link';

import { Wordmark } from '@/components/brand';
import { requireHost } from '@/lib/auth';

export default async function PanelLayout({ children }: LayoutProps<'/host'>) {
	const host = await requireHost();
	return (
		<div className="flex min-h-dvh flex-col md:flex-row">
			<aside className="flex shrink-0 items-center gap-4 bg-night px-4 py-3 text-white md:sticky md:top-0 md:h-dvh md:w-60 md:flex-col md:items-stretch md:gap-8 md:px-5 md:py-6">
				<Link href="/host" aria-label="Quizlerim">
					<Wordmark className="text-3xl md:text-4xl" />
				</Link>
				<nav className="flex flex-1 gap-1 md:flex-col">
					<NavLink href="/host">Quizlerim</NavLink>
					<NavLink href="/archive">Arşiv</NavLink>
				</nav>
				<div className="flex items-center gap-2 md:flex-col md:items-stretch">
					<p className="hidden truncate text-sm opacity-75 md:block" title={host.email}>
						{host.name}
					</p>
					<form method="post" action="/api/auth/logout">
						<button
							type="submit"
							className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm opacity-75 hover:bg-white/10 hover:opacity-100"
						>
							<LogOut className="size-4" />
							<span className="hidden md:inline">Çıkış yap</span>
							<span className="sr-only md:hidden">Çıkış yap</span>
						</button>
					</form>
				</div>
			</aside>
			<div className="min-w-0 flex-1">{children}</div>
		</div>
	);
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<Link
			href={href}
			className="rounded-xl px-3 py-2 font-semibold opacity-80 hover:bg-white/10 hover:opacity-100"
		>
			{children}
		</Link>
	);
}

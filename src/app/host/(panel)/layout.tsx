import { LogOut } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { CONTAINER, Wordmark } from '@/components/brand';
import { LanguageSwitch } from '@/components/language-switch';
import { Avatar } from '@/components/player-screen';
import { requireHost } from '@/lib/auth';
import { getDict } from '@/lib/locale';
import { cn } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getDict();
	return { title: t.meta.panel, robots: { index: false, follow: false } };
}

export default async function PanelLayout({ children }: LayoutProps<'/host'>) {
	const host = await requireHost();
	const t = await getDict();
	return (
		<div className="flex min-h-dvh flex-col">
			<header className="sticky top-0 z-10 border-b bg-white">
				<div className={cn(CONTAINER, 'flex items-center gap-2 py-3 sm:gap-6')}>
					<Link href="/host" aria-label={t.common.myQuizzes} className="py-2">
						<Wordmark className="text-2xl" />
					</Link>
					<nav className="flex flex-1 gap-1 text-sm font-medium">
						<Link
							href="/host"
							aria-current="page"
							className="flex h-11 items-center rounded-full bg-accent-50 px-4 font-semibold text-accent-800"
						>
							{t.common.myQuizzes}
						</Link>
					</nav>
					<LanguageSwitch className="text-ink-700" />
					<span className="flex items-center gap-2" title={host.email}>
						<Avatar name={host.name} className="size-9 text-sm" />
						<span className="hidden max-w-40 truncate text-sm text-ink-700 sm:block">
							{host.name}
						</span>
					</span>
					<form method="post" action="/api/auth/logout">
						<button
							type="submit"
							className="flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
						>
							<LogOut className="size-4" />
							<span className="sr-only sm:not-sr-only">{t.nav.logOut}</span>
						</button>
					</form>
				</div>
			</header>
			<div className="flex-1">{children}</div>
		</div>
	);
}

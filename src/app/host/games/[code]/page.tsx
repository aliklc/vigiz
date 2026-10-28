import { notFound } from 'next/navigation';

import { HostScreen } from '@/components/host-screen';
import { requireHost } from '@/lib/auth';
import { getOwnedGame } from '@/lib/game';

export default async function HostGamePage({ params }: PageProps<'/host/games/[code]'>) {
	const host = await requireHost();
	const { code } = await params;
	if (!(await getOwnedGame(code, host.id))) notFound();
	return <HostScreen code={code.toUpperCase()} />;
}

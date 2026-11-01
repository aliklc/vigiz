import type { Metadata } from 'next';
import { PlayerScreen } from '@/components/player-screen';
import { getDict } from '@/lib/locale';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getDict();
	return { title: t.meta.game, robots: { index: false, follow: false } };
}

export default async function PlayPage({ params }: PageProps<'/play/[code]'>) {
	const { code } = await params;
	return <PlayerScreen code={code.toUpperCase()} />;
}

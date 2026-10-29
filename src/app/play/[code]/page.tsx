import type { Metadata } from 'next';
import { PlayerScreen } from '@/components/player-screen';

export const metadata: Metadata = { title: 'Oyun', robots: { index: false, follow: false } };

export default async function PlayPage({ params }: PageProps<'/play/[code]'>) {
	const { code } = await params;
	return <PlayerScreen code={code.toUpperCase()} />;
}

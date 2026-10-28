import { PlayerScreen } from '@/components/player-screen';

export default async function PlayPage({ params }: PageProps<'/play/[code]'>) {
	const { code } = await params;
	return <PlayerScreen code={code.toUpperCase()} />;
}

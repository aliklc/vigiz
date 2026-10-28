import { HostScreen } from '@/components/host-screen';

export default async function HostGamePage({ params }: PageProps<'/host/games/[code]'>) {
	const { code } = await params;
	return <HostScreen code={code.toUpperCase()} />;
}

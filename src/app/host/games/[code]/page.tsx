import { notFound } from 'next/navigation';

import type { QuestionVideo } from '@/components/game-views';
import { HostScreen } from '@/components/host-screen';
import { requireHost } from '@/lib/auth';
import { getOwnedGame } from '@/lib/game';
import { db } from '@/lib/supabase/admin';

export default async function HostGamePage({ params }: PageProps<'/host/games/[code]'>) {
	const host = await requireHost();
	const { code } = await params;
	const game = await getOwnedGame(code, host.id);
	if (!game) notFound();
	// Klipler sadece host ekranına gider: oyuncu state'inde video ID'si olsaydı devamı açılabilirdi.
	const { data: questions } = await db
		.from('questions')
		.select('position, video_id, video_start, video_cut, video_end')
		.eq('quiz_id', game.quiz_id)
		.not('video_id', 'is', null);
	const videos: Record<number, QuestionVideo> = {};
	for (const q of questions ?? []) {
		videos[q.position] = {
			id: q.video_id ?? '',
			start: q.video_start ?? 0,
			cut: q.video_cut ?? 0,
			end: q.video_end,
		};
	}
	return <HostScreen code={code.toUpperCase()} videos={videos} />;
}

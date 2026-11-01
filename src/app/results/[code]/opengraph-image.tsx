import { ImageResponse } from 'next/og';

import { LogoMark } from '@/components/brand';
import { getGame, getScores } from '@/lib/game';

export const alt = 'vigiz';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Paylaşılan sonucun önizlemesi: quiz adı ve ilk üç. Dil gerektirmeyen metin (adlar, puanlar).
export default async function ResultsImage({ params }: { params: Promise<{ code: string }> }) {
	const game = await getGame((await params).code);
	const top = game?.phase === 'finished' ? (await getScores(game.id)).slice(0, 3) : [];
	return new ImageResponse(
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				gap: 28,
				padding: '0 96px',
				background: '#ff8f70',
				color: '#3b1e1a',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
				<LogoMark bubble="#fff8f2" mark="#ff8f70" size={80} />
				<div style={{ fontSize: 80, fontWeight: 800, letterSpacing: '-0.06em' }}>vigiz</div>
			</div>
			<div style={{ fontSize: 56, fontWeight: 700 }}>{game?.quiz.title ?? ''}</div>
			{/* Sayılar String(): Satori çıplak sayı çocuğunda yanıtı boş bırakıyor */}
			{top.map((s, i) => (
				<div key={s.id} style={{ display: 'flex', gap: 24, fontSize: 44 }}>
					<div style={{ width: 48, fontWeight: 800 }}>{String(i + 1)}</div>
					<div style={{ flex: 1 }}>{s.name}</div>
					<div>{String(s.score)}</div>
				</div>
			))}
		</div>,
		size,
	);
}

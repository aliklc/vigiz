import { ImageResponse } from 'next/og';

import { LogoMark } from '@/components/brand';

export const alt = 'vigiz: canlı quiz gecesi';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Link paylaşılınca görünen önizleme: mercan zemin, logo ve kısa açıklama.
export default function OpengraphImage() {
	return new ImageResponse(
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				padding: '0 96px',
				background: '#ff8f70',
				color: '#3b1e1a',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
				<LogoMark bubble="#fff8f2" mark="#ff8f70" size={190} />
				<div style={{ fontSize: 200, fontWeight: 800, letterSpacing: '-0.06em' }}>
					vigiz
				</div>
			</div>
			<div style={{ fontSize: 52, marginTop: 28 }}>
				Canlı quiz gecesi: kodu gir, adını yaz, oyna.
			</div>
		</div>,
		size,
	);
}

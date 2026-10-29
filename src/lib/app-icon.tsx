import { ImageResponse } from 'next/og';

import { LogoMark } from '@/components/brand';

// Uygulama simgesi: mercan yuvarlak köşeli kare içinde krem balon ve mercan soru işareti.
export function appIcon(size: number) {
	return new ImageResponse(
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: '#ff8f70',
				borderRadius: size * 0.22,
			}}
		>
			<LogoMark bubble="#fff8f2" mark="#ff8f70" size={size * 0.74} />
		</div>,
		{ width: size, height: size },
	);
}

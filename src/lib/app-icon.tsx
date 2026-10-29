import { ImageResponse } from 'next/og';

import { LogoMark } from '@/components/brand';

// Uygulama simgesi: sarı yuvarlak köşeli kare içinde lacivert balon ve sarı soru işareti.
export function appIcon(size: number) {
	return new ImageResponse(
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: '#ffc83d',
				borderRadius: size * 0.22,
			}}
		>
			<LogoMark bubble="#181430" mark="#ffc83d" size={size * 0.74} />
		</div>,
		{ width: size, height: size },
	);
}

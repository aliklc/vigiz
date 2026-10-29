import { ImageResponse } from 'next/og';

import { LogoMark } from '@/components/brand';

// Uygulama simgesi: teal-500 yuvarlak köşeli kare içinde koyu balon ve açık teal soru işareti.
export function appIcon(size: number) {
	return new ImageResponse(
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: '#049cb9',
				borderRadius: size * 0.22,
			}}
		>
			<LogoMark bubble="#161b1e" mark="#5fcee2" size={size * 0.74} />
		</div>,
		{ width: size, height: size },
	);
}

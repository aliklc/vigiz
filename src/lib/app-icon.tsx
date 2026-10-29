import { ImageResponse } from 'next/og';

// Uygulama simgesi: teal-500 yuvarlak köşeli kare içinde beyaz "v.".
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
				color: '#ffffff',
				fontSize: size * 0.62,
				fontWeight: 700,
				letterSpacing: '-0.05em',
				paddingBottom: size * 0.08,
			}}
		>
			v.
		</div>,
		{ width: size, height: size },
	);
}

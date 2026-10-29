import { appIcon } from '@/lib/app-icon';

export function generateImageMetadata() {
	return [32, 512].map(n => ({
		id: String(n),
		size: { width: n, height: n },
		contentType: 'image/png',
	}));
}

export default async function Icon({ id }: { id: Promise<string> }) {
	return appIcon(Number(await id));
}

import { ogCard } from '@/components/og-card';
import { en } from '@/lib/i18n/en';

export const alt = en.meta.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
	return ogCard(en.meta.ogTagline);
}

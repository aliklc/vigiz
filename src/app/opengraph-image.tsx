import { ogCard } from '@/components/og-card';
import { tr } from '@/lib/i18n/tr';

export const alt = tr.meta.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
	return ogCard(tr.meta.ogTagline);
}

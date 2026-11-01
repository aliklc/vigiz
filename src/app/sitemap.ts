import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';

// Ana sayfanın iki dili; her biri diğerini hreflang ile gösterir.
export default function sitemap(): MetadataRoute.Sitemap {
	const languages = { tr: `${SITE_URL}/`, en: `${SITE_URL}/en` };
	return Object.values(languages).map(url => ({
		url,
		changeFrequency: 'monthly',
		priority: 1,
		alternates: { languages },
	}));
}

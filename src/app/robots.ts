import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';

// Sadece ana sayfalar (/ ve /en) aranabilir; panel ve API taranmaz. Oyun odaları ve giriş sayfaları
// kendi noindex etiketleriyle dizin dışında kalır.
export default function robots(): MetadataRoute.Robots {
	return {
		rules: { userAgent: '*', allow: '/', disallow: ['/host', '/api'] },
		sitemap: `${SITE_URL}/sitemap.xml`,
	};
}

import type { MetadataRoute } from 'next';

// Sadece ana sayfa aranabilir; panel ve API taranmaz. Oyun odaları ve giriş sayfaları
// kendi noindex etiketleriyle dizin dışında kalır.
export default function robots(): MetadataRoute.Robots {
	const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
		? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
		: 'http://localhost:3000';
	return {
		rules: { userAgent: '*', allow: '/', disallow: ['/host', '/api'] },
		sitemap: `${base}/sitemap.xml`,
	};
}

// Vercel canlı adresi verir; lokalde localhost. Paylaşım görseli, canonical ve sitemap tam URL ister.
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
	? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
	: 'http://localhost:3000';

// Ana sayfanın dil karşılıkları (hreflang). Dil eşleşmeyen herkes İngilizceye gider.
export const LANGUAGE_ALTERNATES = { tr: '/', en: '/en', 'x-default': '/en' };

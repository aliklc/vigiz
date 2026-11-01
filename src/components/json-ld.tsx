import type { Dict, Locale } from '@/lib/i18n';
import { homePath } from '@/lib/i18n';
import { SITE_URL } from '@/lib/site';

// Arama motorları için yapısal veri: ücretsiz web uygulaması + sık sorulanlar.
export function JsonLd({ t, locale }: { t: Dict; locale: Locale }) {
	const data = [
		{
			'@context': 'https://schema.org',
			'@type': 'WebApplication',
			name: 'vigiz',
			url: `${SITE_URL}${homePath(locale)}`,
			description: t.meta.description,
			inLanguage: locale,
			applicationCategory: 'GameApplication',
			operatingSystem: 'Web',
			offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
		},
		{
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			inLanguage: locale,
			mainEntity: t.home.faq.map(({ q, a }) => ({
				'@type': 'Question',
				name: q,
				acceptedAnswer: { '@type': 'Answer', text: a },
			})),
		},
	];
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: kendi sabit metnimiz; < kaçırılır
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
		/>
	);
}

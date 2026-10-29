import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

import './globals.css';

const inter = Inter({
	variable: '--font-sans',
	subsets: ['latin', 'latin-ext'],
	weight: ['400', '500', '600', '700', '800'], // 800 sadece logo
});

// Oda kodu, soru sayacı ve küçük etiketler için
const mono = JetBrains_Mono({
	variable: '--font-mono',
	subsets: ['latin', 'latin-ext'],
	weight: ['400', '500'],
});

// Vercel canlı adresi verir; lokalde localhost. Paylaşım görseli ve canonical tam URL ister.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
	? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
	: 'http://localhost:3000';

const description =
	'Ekibinle canlı quiz gecesi: oda kodunu gir, adını yaz, telefonundan oyna. Çoktan seçmeli, doğru/yanlış, bulanık görsel ve video soruları.';

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: { default: 'vigiz · Canlı quiz gecesi', template: '%s · vigiz' },
	description,
	applicationName: 'vigiz',
	openGraph: {
		type: 'website',
		locale: 'tr_TR',
		siteName: 'vigiz',
		title: 'vigiz · Canlı quiz gecesi',
		description,
	},
	twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<'/'>) {
	return (
		<html lang="tr" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
			<body className="flex min-h-full flex-col">{children}</body>
		</html>
	);
}

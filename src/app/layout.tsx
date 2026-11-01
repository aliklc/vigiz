import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

import { LocaleProvider } from '@/components/locale-provider';
import { getDict, getLocale } from '@/lib/locale';
import { SITE_URL } from '@/lib/site';

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

export async function generateMetadata(): Promise<Metadata> {
	const t = await getDict();
	return {
		metadataBase: new URL(SITE_URL),
		title: { default: t.meta.title, template: t.meta.titleTemplate },
		description: t.meta.description,
		applicationName: 'vigiz',
		openGraph: {
			type: 'website',
			locale: t.meta.ogLocale,
			siteName: 'vigiz',
			title: t.meta.title,
			description: t.meta.description,
		},
		twitter: { card: 'summary_large_image' },
	};
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: LayoutProps<'/'>) {
	const locale = await getLocale();
	return (
		<html lang={locale} className={`${inter.variable} ${mono.variable} h-full antialiased`}>
			<body className="flex min-h-full flex-col">
				<LocaleProvider locale={locale}>{children}</LocaleProvider>
			</body>
		</html>
	);
}

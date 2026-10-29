import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

const inter = Inter({
	variable: '--font-sans',
	subsets: ['latin', 'latin-ext'],
	weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
	title: 'Vigiz — Quiz Night',
	description: 'Canlı quiz gecesi: kodu gir, adını yaz, oyna',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<'/'>) {
	return (
		<html lang="tr" className={`${inter.variable} h-full antialiased`}>
			<body className="flex min-h-full flex-col">{children}</body>
		</html>
	);
}

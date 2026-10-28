import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

// vignetim.com ile aynı yazı tipi; başlıklar da Inter (kalın, sıkı aralık).
const inter = Inter({ variable: '--font-sans', subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
	title: 'Vigiz — Quiz Night',
	description: 'Aylık şirket içi quiz gecesi',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<'/'>) {
	return (
		<html lang="tr" className={`${inter.variable} h-full antialiased`}>
			<body className="flex min-h-full flex-col">{children}</body>
		</html>
	);
}

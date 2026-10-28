import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';

import './globals.css';

const geist = Geist({ variable: '--font-sans', subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
	title: 'Vigiz — Quiz Night',
	description: 'Aylık şirket içi quiz gecesi',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<'/'>) {
	return (
		<html lang="tr" className={`${geist.variable} h-full antialiased`}>
			<body className="flex min-h-full flex-col">{children}</body>
		</html>
	);
}

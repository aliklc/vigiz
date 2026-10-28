import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Geist } from 'next/font/google';

import './globals.css';

const geist = Geist({ variable: '--font-sans', subsets: ['latin', 'latin-ext'] });
const display = Bricolage_Grotesque({
	variable: '--font-display',
	subsets: ['latin', 'latin-ext'],
	weight: ['600', '800'],
});

export const metadata: Metadata = {
	title: 'Vigiz — Quiz Night',
	description: 'Aylık şirket içi quiz gecesi',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<'/'>) {
	return (
		<html lang="tr" className={`${geist.variable} ${display.variable} h-full antialiased`}>
			<body className="flex min-h-full flex-col">{children}</body>
		</html>
	);
}

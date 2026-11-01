import type { Metadata } from 'next';

import { Home } from '@/components/home';
import { LANGUAGE_ALTERNATES } from '@/lib/site';

export const metadata: Metadata = {
	alternates: { canonical: '/en', languages: LANGUAGE_ALTERNATES },
};

export default function EnglishHome() {
	return <Home locale="en" />;
}

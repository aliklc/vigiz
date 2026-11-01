import 'server-only';
import { cookies, headers } from 'next/headers';

import { dicts, isLocale, type Locale, pickLocale } from '@/lib/i18n';

// Ana sayfalarda dil URL'den gelir (proxy x-locale koyar); uygulama ekranlarında çerez ya da tarayıcı dili.
export async function getLocale(): Promise<Locale> {
	const h = await headers();
	const forced = h.get('x-locale');
	if (isLocale(forced)) return forced;
	return pickLocale((await cookies()).get('lang')?.value, h.get('accept-language'));
}

export const getDict = async () => dicts[await getLocale()];

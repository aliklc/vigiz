import { en } from './en.ts';
import { type Dict, tr } from './tr.ts';

export type { Dict };
export type Locale = 'tr' | 'en';
export const dicts: Record<Locale, Dict> = { tr, en };

export const isLocale = (v: unknown): v is Locale => v === 'tr' || v === 'en';

// Herkese açık ana sayfanın her dildeki adresi (aranabilir sayfalar dili URL'de taşır).
export const homePath = (locale: Locale) => (locale === 'en' ? '/en' : '/');

// Çerez (kullanıcının seçimi) → tarayıcı dili → İngilizce. Türkçe tarayıcılar 'tr' gönderir.
export function pickLocale(cookie: string | undefined, acceptLanguage: string | null): Locale {
	if (isLocale(cookie)) return cookie;
	for (const part of (acceptLanguage ?? '').split(',')) {
		const lang = part.trim().slice(0, 2).toLowerCase();
		if (isLocale(lang)) return lang;
	}
	return 'en';
}

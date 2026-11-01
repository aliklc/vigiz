'use client';

import { createContext, useContext } from 'react';

import { dicts, type Locale } from '@/lib/i18n';

// Sözlükte fonksiyonlar var (sunucudan istemciye prop olarak geçemez); istemciye sadece dil gider.
const LocaleContext = createContext<Locale>('tr');

export function LocaleProvider({
	locale,
	children,
}: {
	locale: Locale;
	children: React.ReactNode;
}) {
	return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export const useLocale = () => useContext(LocaleContext);
export const useDict = () => dicts[useLocale()];

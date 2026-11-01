'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useDict, useLocale } from '@/components/locale-provider';
import { homePath } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// TR ↔ EN. Seçim çereze yazılır (uygulama ekranları onu okur). Ana sayfada gerçek bir link:
// arama motoru diğer dildeki sayfayı da bulur.
export function LanguageSwitch({ home, className }: { home?: boolean; className?: string }) {
	const locale = useLocale();
	const t = useDict();
	const router = useRouter();
	const other = locale === 'tr' ? 'en' : 'tr';
	const remember = () => {
		// biome-ignore lint/suspicious/noDocumentCookie: tek sabit değer; Cookie Store API her tarayıcıda yok
		document.cookie = `lang=${other}; path=/; max-age=31536000; samesite=lax`;
	};
	const cls = cn(
		'flex h-11 items-center rounded-full px-3 font-mono text-sm font-medium uppercase hover:underline',
		className,
	);
	return home ? (
		<Link
			href={homePath(other)}
			hrefLang={other}
			onClick={remember}
			aria-label={t.home.otherLanguage}
			className={cls}
		>
			{other}
		</Link>
	) : (
		<button
			type="button"
			onClick={() => {
				remember();
				router.refresh();
			}}
			aria-label={t.home.otherLanguage}
			className={cls}
		>
			{other}
		</button>
	);
}

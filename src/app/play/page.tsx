import { redirect } from 'next/navigation';

import { homePath } from '@/lib/i18n';
import { getLocale } from '@/lib/locale';

// Ana sayfadaki kod formu buraya GET ile gelir.
export default async function PlayRedirect({ searchParams }: PageProps<'/play'>) {
	const { code } = await searchParams;
	const clean = String(code ?? '')
		.trim()
		.toUpperCase();
	redirect(clean ? `/play/${clean}` : homePath(await getLocale()));
}

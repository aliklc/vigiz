import { redirect } from 'next/navigation';

// Ana sayfadaki kod formu buraya GET ile gelir.
export default async function PlayRedirect({ searchParams }: PageProps<'/play'>) {
	const { code } = await searchParams;
	const clean = String(code ?? '')
		.trim()
		.toUpperCase();
	redirect(clean ? `/play/${clean}` : '/');
}

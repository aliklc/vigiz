import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';
import { getDict } from '@/lib/locale';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getDict();
	return { title: t.auth.registerTitle, robots: { index: false, follow: false } };
}

export default async function RegisterPage({ searchParams }: PageProps<'/register'>) {
	const { error, from } = await searchParams;
	const t = (await getDict()).auth;
	return (
		<AuthForm
			mode="register"
			from={from === 'game' ? from : undefined}
			error={error ? (t.errors[String(error)] ?? t.registerFailed) : undefined}
		/>
	);
}

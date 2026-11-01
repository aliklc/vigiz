import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';
import { getDict } from '@/lib/locale';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getDict();
	return { title: t.auth.logInTitle, robots: { index: false, follow: false } };
}

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
	const { error, registered } = await searchParams;
	const t = (await getDict()).auth;
	return (
		<AuthForm
			mode="login"
			error={error ? t.wrongCredentials : undefined}
			notice={registered ? t.registered : undefined}
		/>
	);
}

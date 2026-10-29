import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';

export const metadata: Metadata = { title: 'Giriş yap', robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
	const { error, registered } = await searchParams;
	return (
		<AuthForm
			mode="login"
			error={error ? 'E-posta ya da şifre yanlış' : undefined}
			notice={
				registered
					? 'Hesabın oluşturuldu. E-postandaki onay linkine tıkla, sonra giriş yap.'
					: undefined
			}
		/>
	);
}

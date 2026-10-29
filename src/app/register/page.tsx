import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';

const ERRORS: Record<string, string> = {
	name: 'Adını yaz',
	user_already_exists: 'Bu e-postayla zaten bir hesap var',
	email_exists: 'Bu e-postayla zaten bir hesap var',
	weak_password: 'Şifre çok zayıf (en az 6 karakter)',
	email_address_invalid: 'Geçerli bir e-posta gir',
	over_email_send_rate_limit: 'Çok fazla deneme; biraz sonra tekrar dene',
};

export const metadata: Metadata = {
	title: 'Hesap oluştur',
	robots: { index: false, follow: false },
};

export default async function RegisterPage({ searchParams }: PageProps<'/register'>) {
	const { error } = await searchParams;
	return (
		<AuthForm
			mode="register"
			error={error ? (ERRORS[String(error)] ?? 'Kayıt olunamadı, tekrar dene') : undefined}
		/>
	);
}

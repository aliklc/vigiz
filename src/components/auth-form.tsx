import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// /login ve /register için ortak form (JS'siz, düz POST).
export function AuthForm({
	mode,
	error,
	notice,
}: {
	mode: 'login' | 'register';
	error?: string;
	notice?: string;
}) {
	const isLogin = mode === 'login';
	return (
		<main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center p-4">
			<form
				method="post"
				action={isLogin ? '/api/auth/login' : '/api/auth/register'}
				className="flex flex-col gap-3"
			>
				<h1 className="text-2xl font-bold">
					{isLogin ? 'Host girişi' : 'Host hesabı oluştur'}
				</h1>
				{notice && <p className="text-sm text-green-700">{notice}</p>}
				{!isLogin && (
					<Input name="name" placeholder="Adın soyadın" autoComplete="name" required />
				)}
				<Input
					name="email"
					type="email"
					placeholder="E-posta"
					autoComplete="email"
					required
				/>
				<Input
					name="password"
					type="password"
					placeholder="Şifre"
					autoComplete={isLogin ? 'current-password' : 'new-password'}
					minLength={isLogin ? undefined : 6}
					required
				/>
				{error && <p className="text-sm text-destructive">{error}</p>}
				<Button type="submit">{isLogin ? 'Giriş yap' : 'Kayıt ol'}</Button>
				<p className="text-center text-sm text-muted-foreground">
					{isLogin ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
					<Link href={isLogin ? '/register' : '/login'} className="underline">
						{isLogin ? 'Kayıt ol' : 'Giriş yap'}
					</Link>
				</p>
			</form>
		</main>
	);
}

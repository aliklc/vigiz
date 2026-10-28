import Link from 'next/link';

import { FIELD } from '@/components/brand';
import { PrimaryButton } from '@/components/player-screen';
import { SiteHeader } from '@/components/site-header';

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
		<div className="stage flex flex-col">
			<SiteHeader />
			<main className="flex flex-1 items-center justify-center px-4 py-10">
				<form
					method="post"
					action={isLogin ? '/api/auth/login' : '/api/auth/register'}
					className="flex w-full max-w-md flex-col gap-3 rounded-3xl border bg-white p-6 shadow-sm sm:p-8"
				>
					<div className="mb-2">
						<h1 className="text-2xl font-bold tracking-tight">
							{isLogin ? 'Giriş yap' : 'Hesap oluştur'}
						</h1>
						<p className="text-sm text-muted-foreground">
							{isLogin
								? 'Quizlerini hazırlamak ve oyun açmak için.'
								: 'Kendi quizlerini hazırla; sadece sen görürsün.'}
						</p>
					</div>
					{notice && (
						<p
							role="status"
							className="rounded-xl bg-brand-tint p-3 text-sm text-brand-ink"
						>
							{notice}
						</p>
					)}
					{!isLogin && (
						<input
							name="name"
							placeholder="Adın soyadın"
							autoComplete="name"
							required
							className={FIELD}
						/>
					)}
					<input
						name="email"
						type="email"
						placeholder="E-posta"
						autoComplete="email"
						required
						className={FIELD}
					/>
					<input
						name="password"
						type="password"
						placeholder={isLogin ? 'Şifre' : 'Şifre (en az 6 karakter)'}
						autoComplete={isLogin ? 'current-password' : 'new-password'}
						minLength={isLogin ? undefined : 6}
						required
						className={FIELD}
					/>
					{error && (
						<p role="alert" className="text-sm text-destructive">
							{error}
						</p>
					)}
					<PrimaryButton type="submit" className="mt-2">
						{isLogin ? 'Giriş yap' : 'Hesabı oluştur'}
					</PrimaryButton>
					<p className="text-center text-sm text-muted-foreground">
						{isLogin ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
						<Link
							href={isLogin ? '/register' : '/login'}
							className="font-medium text-brand-ink hover:underline"
						>
							{isLogin ? 'Hesap oluştur' : 'Giriş yap'}
						</Link>
					</p>
				</form>
			</main>
		</div>
	);
}

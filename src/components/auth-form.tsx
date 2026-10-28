import Link from 'next/link';

import { Wordmark } from '@/components/brand';
import { BigButton } from '@/components/player-screen';

const field =
	'h-12 rounded-xl bg-white px-4 text-ink outline-none placeholder:text-ink/45 focus-visible:ring-4 focus-visible:ring-c3';

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
		<main className="stage flex flex-col items-center justify-center gap-8 p-6">
			<Link href="/" aria-label="Ana sayfa">
				<Wordmark className="text-5xl" />
			</Link>
			<form
				method="post"
				action={isLogin ? '/api/auth/login' : '/api/auth/register'}
				className="flex w-full max-w-sm flex-col gap-3"
			>
				<h1 className="text-center font-display text-2xl font-extrabold">
					{isLogin ? 'Quiz hazırlamak için giriş yap' : 'Quiz hazırlamak için hesap aç'}
				</h1>
				{notice && (
					<p role="status" className="rounded-xl bg-c4 p-3 text-center text-sm">
						{notice}
					</p>
				)}
				{!isLogin && (
					<input
						name="name"
						placeholder="Adın soyadın"
						autoComplete="name"
						required
						className={field}
					/>
				)}
				<input
					name="email"
					type="email"
					placeholder="E-posta"
					autoComplete="email"
					required
					className={field}
				/>
				<input
					name="password"
					type="password"
					placeholder={isLogin ? 'Şifre' : 'Şifre (en az 6 karakter)'}
					autoComplete={isLogin ? 'current-password' : 'new-password'}
					minLength={isLogin ? undefined : 6}
					required
					className={field}
				/>
				{error && (
					<p role="alert" className="text-center text-c3">
						{error}
					</p>
				)}
				<BigButton type="submit" className="mt-2">
					{isLogin ? 'Giriş yap' : 'Hesabı oluştur'}
				</BigButton>
				<p className="text-center text-sm opacity-80">
					{isLogin ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
					<Link
						href={isLogin ? '/register' : '/login'}
						className="font-semibold underline"
					>
						{isLogin ? 'Hesap aç' : 'Giriş yap'}
					</Link>
				</p>
			</form>
		</main>
	);
}

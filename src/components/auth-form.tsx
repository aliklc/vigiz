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
					className="flex w-full max-w-md flex-col gap-4 rounded-3xl border bg-white p-6 sm:p-8"
				>
					<div className="mb-2 flex flex-col gap-1">
						<h1>{isLogin ? 'Giriş yap' : 'Hesap oluştur'}</h1>
						<p className="text-ink-600">
							{isLogin
								? 'Quizlerini hazırlamak ve oyun açmak için.'
								: 'Kendi quizlerini hazırla; sadece sen görürsün.'}
						</p>
					</div>
					{notice && (
						<p
							role="status"
							className="rounded-xl bg-teal-50 p-3 text-sm text-teal-700"
						>
							{notice}
						</p>
					)}
					{!isLogin && (
						<Field label="Ad soyad" htmlFor="name">
							<input
								id="name"
								name="name"
								autoComplete="name"
								required
								className={FIELD}
							/>
						</Field>
					)}
					<Field label="E-posta" htmlFor="email">
						<input
							id="email"
							name="email"
							type="email"
							autoComplete="email"
							required
							className={FIELD}
						/>
					</Field>
					<Field
						label="Şifre"
						htmlFor="password"
						hint={isLogin ? undefined : 'En az 6 karakter'}
					>
						<input
							id="password"
							name="password"
							type="password"
							autoComplete={isLogin ? 'current-password' : 'new-password'}
							minLength={isLogin ? undefined : 6}
							required
							className={FIELD}
						/>
					</Field>
					{error && (
						<p role="alert" className="text-sm text-destructive">
							{error}
						</p>
					)}
					<PrimaryButton type="submit" className="mt-2">
						{isLogin ? 'Giriş yap' : 'Hesabı oluştur'}
					</PrimaryButton>
					<p className="text-center text-sm text-ink-600">
						{isLogin ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
						<Link
							href={isLogin ? '/register' : '/login'}
							className="font-semibold text-teal-700 underline-offset-4 hover:underline"
						>
							{isLogin ? 'Hesap oluştur' : 'Giriş yap'}
						</Link>
					</p>
				</form>
			</main>
		</div>
	);
}

function Field({
	label,
	htmlFor,
	hint,
	children,
}: {
	label: string;
	htmlFor: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={htmlFor} className="text-sm font-medium">
				{label}
			</label>
			{children}
			{hint && <p className="text-sm text-ink-600">{hint}</p>}
		</div>
	);
}

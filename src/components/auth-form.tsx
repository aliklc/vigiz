import Link from 'next/link';

import { FIELD } from '@/components/brand';
import { PrimaryButton } from '@/components/player-screen';
import { SiteHeader } from '@/components/site-header';
import { getDict } from '@/lib/locale';

// /login ve /register için ortak form (JS'siz, düz POST).
export async function AuthForm({
	mode,
	error,
	notice,
	from,
}: {
	mode: 'login' | 'register';
	// Kayıt kaynağı (oyun sonu çağrısı); formla birlikte gönderilir
	from?: string;
	error?: string;
	notice?: string;
}) {
	const isLogin = mode === 'login';
	const t = (await getDict()).auth;
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
						<h1>{isLogin ? t.logInTitle : t.registerTitle}</h1>
						<p className="text-ink-600">{isLogin ? t.logInLead : t.registerLead}</p>
					</div>
					{notice && (
						<p
							role="status"
							className="rounded-xl bg-accent-50 p-3 text-sm text-accent-800"
						>
							{notice}
						</p>
					)}
					{from && <input type="hidden" name="from" value={from} />}
					{!isLogin && (
						<Field label={t.name} htmlFor="name">
							<input
								id="name"
								name="name"
								autoComplete="name"
								required
								className={FIELD}
							/>
						</Field>
					)}
					<Field label={t.email} htmlFor="email">
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
						label={t.password}
						htmlFor="password"
						hint={isLogin ? undefined : t.passwordHint}
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
						{isLogin ? t.submitLogIn : t.submitRegister}
					</PrimaryButton>
					<p className="text-center text-sm text-ink-600">
						{isLogin ? t.noAccount : t.haveAccount}
						<Link
							href={isLogin ? '/register' : '/login'}
							className="font-semibold text-accent-800 underline-offset-4 hover:underline"
						>
							{isLogin ? t.registerTitle : t.logInTitle}
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

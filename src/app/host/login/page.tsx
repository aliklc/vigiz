'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
	const router = useRouter();
	const [error, setError] = useState('');
	const [pending, setPending] = useState(false);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setPending(true);
		const password = new FormData(e.currentTarget).get('password');
		const res = await fetch('/api/host/login', {
			method: 'POST',
			body: JSON.stringify({ password }),
		});
		setPending(false);
		if (!res.ok) return setError('Şifre yanlış');
		router.replace('/host');
		router.refresh();
	}

	return (
		<main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center p-4">
			<form onSubmit={onSubmit} className="flex flex-col gap-3">
				<h1 className="text-2xl font-bold">Host girişi</h1>
				<Input
					name="password"
					type="password"
					placeholder="Yönetici şifresi"
					autoFocus
					required
				/>
				{error && <p className="text-sm text-destructive">{error}</p>}
				<Button type="submit" disabled={pending}>
					Giriş
				</Button>
			</form>
		</main>
	);
}

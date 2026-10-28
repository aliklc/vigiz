import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function LoginPage({ searchParams }: PageProps<'/host/login'>) {
	const { error } = await searchParams;
	return (
		<main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center p-4">
			<form method="post" action="/api/host/login" className="flex flex-col gap-3">
				<h1 className="text-2xl font-bold">Host girişi</h1>
				<Input
					name="password"
					type="password"
					placeholder="Yönetici şifresi"
					autoFocus
					required
				/>
				{error && <p className="text-sm text-destructive">Şifre yanlış</p>}
				<Button type="submit">Giriş</Button>
			</form>
		</main>
	);
}

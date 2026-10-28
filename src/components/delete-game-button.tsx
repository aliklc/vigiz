'use client';

import { Button } from '@/components/ui/button';

export function DeleteGameButton({ code }: { code: string }) {
	return (
		<form
			method="post"
			action={`/api/host/games/${code}/delete`}
			onSubmit={e => {
				if (!confirm('Bu oyun ve sonuçları kalıcı olarak silinsin mi?')) e.preventDefault();
			}}
		>
			<Button type="submit" variant="ghost" size="sm" className="text-destructive">
				Sil
			</Button>
		</form>
	);
}

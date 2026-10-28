import { FIELD } from '@/components/brand';
import { PrimaryButton } from '@/components/player-screen';
import { SiteHeader } from '@/components/site-header';
import { cn } from '@/lib/utils';

export default function Home() {
	return (
		<div className="stage flex flex-col">
			<SiteHeader />
			<main className="mx-auto grid w-full max-w-6xl flex-1 content-center items-center gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2 lg:gap-16">
				<div className="flex flex-col gap-4 text-center lg:text-left">
					<h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
						Ayın quiz gecesine katıl
					</h1>
					<p className="text-lg text-muted-foreground">
						Hesap açmana gerek yok. Host'un ekranındaki kodu gir, adını yaz ve oyna.
					</p>
				</div>
				<form
					action="/play"
					className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-3xl border bg-white p-6 shadow-sm sm:p-8"
				>
					<div>
						<h2 className="text-xl font-semibold">Odaya gir</h2>
						<p className="text-sm text-muted-foreground">6 karakterlik oda kodu</p>
					</div>
					<label htmlFor="code" className="sr-only">
						Oda kodu
					</label>
					<input
						id="code"
						name="code"
						placeholder="ÖRN. 3SZ6PU"
						autoComplete="off"
						autoCapitalize="characters"
						maxLength={6}
						required
						className={cn(
							FIELD,
							'h-14 text-center text-2xl font-bold tracking-[0.25em] uppercase placeholder:text-base placeholder:font-normal placeholder:tracking-normal',
						)}
					/>
					<PrimaryButton type="submit">Katıl</PrimaryButton>
				</form>
			</main>
		</div>
	);
}

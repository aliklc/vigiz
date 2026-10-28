'use client';

import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { LETTERS } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { QuestionInput, QuizInput } from '@/lib/quiz';
import { cn } from '@/lib/utils';

const emptyQuestion = (): QuestionInput => ({
	text: '',
	image_url: null,
	explanation: null,
	choices: ['', ''],
	correct_index: 0,
});

const emptyQuiz = (authorName = ''): QuizInput => ({
	title: '',
	topic: '',
	author_name: authorName,
	quiz_date: new Date().toISOString().slice(0, 10),
	time_limit_sec: 20,
	status: 'draft',
	questions: [emptyQuestion()],
});

export function QuizEditor({
	id,
	initial,
	authorName,
}: {
	id?: string;
	initial?: QuizInput;
	authorName?: string;
}) {
	const router = useRouter();
	const [quiz, setQuiz] = useState<QuizInput>(() => initial ?? emptyQuiz(authorName));
	const [error, setError] = useState('');
	const [saved, setSaved] = useState('');
	const [pending, setPending] = useState(false);

	const set = <K extends keyof QuizInput>(key: K, value: QuizInput[K]) =>
		setQuiz(q => ({ ...q, [key]: value }));

	const setQuestion = (i: number, patch: Partial<QuestionInput>) =>
		set(
			'questions',
			quiz.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)),
		);

	const moveQuestion = (i: number, dir: -1 | 1) => {
		const qs = [...quiz.questions];
		[qs[i], qs[i + dir]] = [qs[i + dir], qs[i]];
		set('questions', qs);
	};

	async function save(status: QuizInput['status']) {
		setPending(true);
		setError('');
		setSaved('');
		const res = await fetch(id ? `/api/host/quizzes/${id}` : '/api/host/quizzes', {
			method: id ? 'PUT' : 'POST',
			body: JSON.stringify({ ...quiz, status }),
		});
		const body = await res.json();
		setPending(false);
		if (!res.ok) return setError(body.error ?? 'Kaydedilemedi');
		set('status', status);
		setSaved(status === 'ready' ? 'Hazır olarak kaydedildi' : 'Taslak kaydedildi');
		if (!id) router.replace(`/host/quizzes/${body.id}`);
	}

	async function remove() {
		if (!id || !confirm('Bu quiz silinsin mi?')) return;
		const res = await fetch(`/api/host/quizzes/${id}`, { method: 'DELETE' });
		if (!res.ok) return setError((await res.json()).error);
		router.replace('/host');
	}

	return (
		<main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8">
			<div className="flex items-center justify-between gap-4">
				<div>
					<Link href="/host" className="text-sm text-muted-foreground hover:underline">
						Quizlerim
					</Link>
					<h1 className="text-3xl font-bold tracking-tight">
						{id ? quiz.title || 'Adsız quiz' : 'Yeni quiz'}
					</h1>
				</div>
				{id && (
					<Button variant="ghost" size="sm" className="text-destructive" onClick={remove}>
						Quizi sil
					</Button>
				)}
			</div>

			<section className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-6">
				<Field label="Başlık">
					<Input value={quiz.title} onChange={e => set('title', e.target.value)} />
				</Field>
				<Field label="Konu">
					<Input value={quiz.topic} onChange={e => set('topic', e.target.value)} />
				</Field>
				<Field label="Hazırlayan">
					<Input
						value={quiz.author_name}
						onChange={e => set('author_name', e.target.value)}
					/>
				</Field>
				<Field label="Tarih">
					<Input
						type="date"
						value={quiz.quiz_date}
						onChange={e => set('quiz_date', e.target.value)}
					/>
				</Field>
				<Field label="Soru süresi (sn)">
					<Input
						type="number"
						min={5}
						max={120}
						value={quiz.time_limit_sec}
						onChange={e => set('time_limit_sec', Number(e.target.value))}
					/>
				</Field>
			</section>

			{quiz.questions.map((q, i) => (
				<section
					key={i}
					className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:p-6"
				>
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">Soru {i + 1}</h2>
						<div className="flex gap-1">
							<IconButton
								label="Yukarı"
								disabled={i === 0}
								onClick={() => moveQuestion(i, -1)}
							>
								<ArrowUp />
							</IconButton>
							<IconButton
								label="Aşağı"
								disabled={i === quiz.questions.length - 1}
								onClick={() => moveQuestion(i, 1)}
							>
								<ArrowDown />
							</IconButton>
							<IconButton
								label="Soruyu sil"
								onClick={() =>
									set(
										'questions',
										quiz.questions.filter((_, j) => j !== i),
									)
								}
							>
								<Trash2 />
							</IconButton>
						</div>
					</div>
					<Textarea
						placeholder="Soru metni"
						value={q.text}
						onChange={e => setQuestion(i, { text: e.target.value })}
					/>
					<div className="flex flex-col gap-2" role="radiogroup" aria-label="Şıklar">
						{q.choices.map((c, ci) => (
							<div key={ci} className="flex items-center gap-2">
								<label
									title="Doğru cevap olarak işaretle"
									className={cn(
										'relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sm font-bold transition has-focus-visible:ring-3 has-focus-visible:ring-ring',
										q.correct_index === ci
											? 'bg-green-600 text-white'
											: 'bg-brand-tint text-brand-ink hover:bg-brand/20',
									)}
								>
									<input
										type="radio"
										name={`correct-${i}`}
										aria-label={`Şık ${ci + 1} doğru cevap`}
										checked={q.correct_index === ci}
										onChange={() => setQuestion(i, { correct_index: ci })}
										className="sr-only"
									/>
									{q.correct_index === ci ? (
										<Check className="size-5" strokeWidth={3} />
									) : (
										LETTERS[ci]
									)}
								</label>
								<Input
									placeholder={`Şık ${ci + 1}`}
									value={c}
									onChange={e =>
										setQuestion(i, {
											choices: q.choices.map((x, k) =>
												k === ci ? e.target.value : x,
											),
										})
									}
								/>
								<IconButton
									label="Şıkkı sil"
									disabled={q.choices.length <= 2}
									onClick={() =>
										setQuestion(i, {
											choices: q.choices.filter((_, k) => k !== ci),
											correct_index:
												q.correct_index === ci
													? 0
													: q.correct_index > ci
														? q.correct_index - 1
														: q.correct_index,
										})
									}
								>
									<Trash2 />
								</IconButton>
							</div>
						))}
						{q.choices.length < 5 && (
							<Button
								variant="outline"
								size="sm"
								className="self-start"
								onClick={() => setQuestion(i, { choices: [...q.choices, ''] })}
							>
								<Plus /> Şık ekle
							</Button>
						)}
						<p className="text-xs text-muted-foreground">
							Doğru cevabı soldaki harfe basarak işaretle (yeşil olan doğru cevap).
						</p>
					</div>
					<Input
						placeholder="Görsel URL (isteğe bağlı)"
						value={q.image_url ?? ''}
						onChange={e => setQuestion(i, { image_url: e.target.value || null })}
					/>
					<Input
						placeholder="Cevaptan sonra gösterilecek açıklama (isteğe bağlı)"
						value={q.explanation ?? ''}
						onChange={e => setQuestion(i, { explanation: e.target.value || null })}
					/>
				</section>
			))}

			<Button
				variant="outline"
				onClick={() => set('questions', [...quiz.questions, emptyQuestion()])}
			>
				<Plus /> Soru ekle
			</Button>

			<footer className="sticky bottom-0 -mx-4 border-t bg-background/95 p-3 backdrop-blur sm:-mx-8 sm:px-8">
				<div className="flex flex-col gap-2">
					{error && <p className="text-sm text-destructive">{error}</p>}
					{saved && <p className="text-sm text-green-700">{saved}</p>}
					<div className="flex gap-2">
						<Button
							variant="outline"
							className="flex-1"
							disabled={pending}
							onClick={() => save('draft')}
						>
							Taslak kaydet
						</Button>
						<Button className="flex-1" disabled={pending} onClick={() => save('ready')}>
							Hazır olarak kaydet
						</Button>
					</div>
				</div>
			</footer>
		</main>
	);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<Label className="flex flex-col items-stretch gap-1.5">
			{label}
			{children}
		</Label>
	);
}

function IconButton({ label, ...props }: React.ComponentProps<typeof Button> & { label: string }) {
	return <Button variant="ghost" size="icon-sm" aria-label={label} title={label} {...props} />;
}

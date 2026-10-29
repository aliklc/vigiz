'use client';

import { ArrowDown, ArrowUp, Check, ImageUp, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LETTERS } from '@/components/brand';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { FORMATS } from '@/components/formats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	formatTime,
	parseTime,
	QUESTION_TYPES,
	type QuestionInput,
	type QuestionType,
	type QuizInput,
	TRUE_FALSE,
	youtubeId,
} from '@/lib/quiz';
import { cn } from '@/lib/utils';

const emptyQuestion = (type: QuestionType = 'choice'): QuestionInput => ({
	type,
	text: '',
	image_url: null,
	explanation: null,
	answer_text: null,
	video_id: null,
	choices: type === 'choice' ? ['', ''] : type === 'truefalse' ? TRUE_FALSE : [],
	correct_index: 0,
});

const emptyQuiz = (authorName = ''): QuizInput => ({
	title: '',
	topic: '',
	author_name: authorName,
	// Yerel tarih (toISOString UTC verir; Türkiye'de gece 00-03 arası dünün tarihi olurdu).
	quiz_date: new Date().toLocaleDateString('sv-SE'),
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
	// Kaydedilmemiş değişiklik varken sekmeyi kapatma/yenileme uyarısı.
	const [dirty, setDirty] = useState(false);
	useEffect(() => {
		if (!dirty) return;
		const warn = (e: BeforeUnloadEvent) => e.preventDefault();
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, [dirty]);

	const set = <K extends keyof QuizInput>(key: K, value: QuizInput[K]) => {
		setQuiz(q => ({ ...q, [key]: value }));
		setDirty(true);
	};

	const setQuestion = (i: number, patch: Partial<QuestionInput>) =>
		set(
			'questions',
			quiz.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)),
		);

	// Format değişince şıklar formata uygun hale gelir (metin, görsel, açıklama korunur).
	const changeType = (i: number, type: QuestionType) => {
		const q = quiz.questions[i];
		const choices =
			type === 'truefalse'
				? TRUE_FALSE
				: type === 'choice'
					? q.type === 'choice' && q.choices.length >= 2
						? q.choices
						: ['', '']
					: [];
		setQuestion(i, {
			type,
			choices,
			correct_index: type === 'buzzer' ? 0 : Math.min(q.correct_index, choices.length - 1),
		});
	};

	const moveQuestion = (i: number, dir: -1 | 1) => {
		const qs = [...quiz.questions];
		[qs[i], qs[i + dir]] = [qs[i + dir], qs[i]];
		set('questions', qs);
	};

	async function save(status: QuizInput['status']) {
		setPending(true);
		setError('');
		setSaved('');
		try {
			const res = await fetch(id ? `/api/host/quizzes/${id}` : '/api/host/quizzes', {
				method: id ? 'PUT' : 'POST',
				body: JSON.stringify({ ...quiz, status }),
			});
			const body = await res.json();
			if (!res.ok) return setError(body.error ?? 'Kaydedilemedi');
			set('status', status);
			setDirty(false);
			setSaved(status === 'ready' ? 'Hazır olarak kaydedildi' : 'Taslak kaydedildi');
			if (!id) router.replace(`/host/quizzes/${body.id}`);
		} catch {
			setError('Bağlantı koptu, kaydedilemedi. Sayfayı kapatmadan tekrar dene.');
		} finally {
			setPending(false);
		}
	}

	async function remove() {
		if (!id || !confirm('Bu quiz ve oynandığı oyunların sonuçları silinsin mi?')) return;
		const res = await fetch(`/api/host/quizzes/${id}`, { method: 'DELETE' });
		if (!res.ok) return setError((await res.json()).error);
		router.replace('/host');
	}

	return (
		<main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8">
			<div className="flex items-center justify-between gap-4">
				<div className="flex min-w-0 flex-col gap-1">
					<Breadcrumbs
						items={[
							{ label: 'Quizlerim', href: '/host' },
							{ label: id ? quiz.title || 'Adsız quiz' : 'Yeni quiz' },
						]}
					/>
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

			<section className="grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2 sm:p-6">
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
					className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:p-6"
				>
					<div className="flex items-start justify-between gap-3">
						<div className="flex flex-wrap items-center gap-3">
							<h2 className="text-lg font-semibold">Soru {i + 1}</h2>
							<FormatPicker
								value={q.type ?? 'choice'}
								onChange={type => changeType(i, type)}
							/>
						</div>
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
					{(q.type ?? 'choice') === 'buzzer' ? (
						<>
							<p className="text-sm text-muted-foreground">
								Görsel bulanık başlar ve süre boyunca netleşir. Bilen oyuncular
								buzzer'a basar, sırayla sesli cevap verir; sen Doğru ya da Yanlış
								dersin.
							</p>
							<ImageField
								value={q.image_url}
								onChange={image_url => setQuestion(i, { image_url })}
								blurredPreview
							/>
							<Input
								placeholder="Doğru cevap (sadece cevap ekranında görünür)"
								value={q.answer_text ?? ''}
								onChange={e =>
									setQuestion(i, { answer_text: e.target.value || null })
								}
							/>
							<Input
								placeholder="Soru (isteğe bağlı, örn. Bu hangi şehir?)"
								value={q.text}
								onChange={e => setQuestion(i, { text: e.target.value })}
							/>
						</>
					) : (
						<>
							<Textarea
								placeholder="Soru metni"
								value={q.text}
								onChange={e => setQuestion(i, { text: e.target.value })}
							/>
							{q.type === 'truefalse' ? (
								<div
									className="flex gap-2"
									role="radiogroup"
									aria-label="Doğru cevap"
								>
									{TRUE_FALSE.map((label, ci) => (
										<label
											key={label}
											className={cn(
												'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-3 font-semibold transition has-focus-visible:ring-3 has-focus-visible:ring-ring',
												q.correct_index === ci
													? 'border-teal-500 bg-teal-50 text-teal-800'
													: 'border-border hover:bg-muted',
											)}
										>
											<input
												type="radio"
												name={`tf-${i}`}
												checked={q.correct_index === ci}
												onChange={() =>
													setQuestion(i, { correct_index: ci })
												}
												className="sr-only"
											/>
											{q.correct_index === ci && (
												<Check className="size-4" strokeWidth={3} />
											)}
											{label}
										</label>
									))}
								</div>
							) : (
								<div
									className="flex flex-col gap-2"
									role="radiogroup"
									aria-label="Şıklar"
								>
									{q.choices.map((c, ci) => (
										<div key={ci} className="flex items-center gap-2">
											<label
												title="Doğru cevap olarak işaretle"
												className={cn(
													'relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sm font-bold transition has-focus-visible:ring-3 has-focus-visible:ring-ring',
													q.correct_index === ci
														? 'bg-teal-500 text-white'
														: 'bg-brand-tint text-brand-ink hover:bg-brand/20',
												)}
											>
												<input
													type="radio"
													name={`correct-${i}`}
													aria-label={`Şık ${ci + 1} doğru cevap`}
													checked={q.correct_index === ci}
													onChange={() =>
														setQuestion(i, { correct_index: ci })
													}
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
														choices: q.choices.filter(
															(_, k) => k !== ci,
														),
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
											onClick={() =>
												setQuestion(i, { choices: [...q.choices, ''] })
											}
										>
											<Plus /> Şık ekle
										</Button>
									)}
									<p className="text-xs text-muted-foreground">
										Doğru cevabı soldaki harfe basarak işaretle (yeşil olan
										doğru cevap).
									</p>
								</div>
							)}
							<ImageField
								value={q.image_url}
								onChange={image_url => setQuestion(i, { image_url })}
							/>
							<VideoField question={q} onChange={patch => setQuestion(i, patch)} />
						</>
					)}
					<Input
						placeholder="Cevaptan sonra gösterilecek açıklama (isteğe bağlı)"
						value={q.explanation ?? ''}
						onChange={e => setQuestion(i, { explanation: e.target.value || null })}
					/>
				</section>
			))}

			<div className="flex flex-wrap gap-2">
				{QUESTION_TYPES.map(type => {
					const { label, Icon } = FORMATS[type];
					return (
						<Button
							key={type}
							variant="outline"
							onClick={() =>
								set('questions', [...quiz.questions, emptyQuestion(type)])
							}
						>
							<Plus /> <Icon /> {label}
						</Button>
					);
				})}
			</div>

			<footer className="sticky bottom-0 -mx-4 border-t bg-background/95 p-3 backdrop-blur sm:-mx-8 sm:px-8">
				<div className="flex flex-col gap-2">
					{error && <p className="text-sm text-destructive">{error}</p>}
					{saved && <p className="text-sm text-teal-700">{saved}</p>}
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

// YouTube "Sonra ne oldu?": soruda Başla → Dur arası oynar, cevapta Dur → Bitir.
// Metin alanları yerel: "1:" gibi yarım yazılan süre geçersiz diye silinmesin.
function VideoField({
	question,
	onChange,
}: {
	question: QuestionInput;
	onChange: (patch: Partial<QuestionInput>) => void;
}) {
	const [link, setLink] = useState(
		question.video_id ? `https://youtu.be/${question.video_id}` : '',
	);
	const [times, setTimes] = useState(() => ({
		video_start: formatTime(question.video_start ?? 0),
		video_cut: question.video_cut != null ? formatTime(question.video_cut) : '',
		video_end: question.video_end != null ? formatTime(question.video_end) : '',
	}));
	const id = question.video_id;
	const invalidLink = !!link.trim() && !youtubeId(link);

	function setTime(key: keyof typeof times, text: string) {
		setTimes(t => ({ ...t, [key]: text }));
		onChange({ [key]: text.trim() ? parseTime(text) : null });
	}

	return (
		<div className="flex flex-col gap-2">
			<Field label="YouTube videosu (isteğe bağlı)">
				<Input
					placeholder="https://youtu.be/…"
					value={link}
					aria-invalid={invalidLink}
					onChange={e => {
						setLink(e.target.value);
						const next = youtubeId(e.target.value);
						onChange({
							video_id: next,
							video_start: next ? (parseTime(times.video_start) ?? 0) : null,
							video_cut: next ? parseTime(times.video_cut) : null,
							video_end: next ? parseTime(times.video_end) : null,
						});
					}}
				/>
			</Field>
			{invalidLink && (
				<p className="text-sm text-destructive">Geçerli bir YouTube linki değil</p>
			)}
			{id && (
				<>
					<div className="grid grid-cols-3 gap-2">
						{(
							[
								['video_start', 'Başla'],
								['video_cut', 'Dur (soru)'],
								['video_end', 'Bitir (cevap)'],
							] as const
						).map(([key, label]) => (
							<Field key={key} label={label}>
								<Input
									inputMode="numeric"
									placeholder={key === 'video_end' ? 'sonuna kadar' : 'dk:sn'}
									value={times[key]}
									onChange={e => setTime(key, e.target.value)}
								/>
							</Field>
						))}
					</div>
					<p className="text-xs text-muted-foreground">
						Soruda video Başla → Dur arası oynar, süre video durunca başlar. Cevap
						ekranında Dur'dan devam eder. Video sadece host ekranında oynar.
					</p>
					<iframe
						src={`https://www.youtube-nocookie.com/embed/${id}?start=${question.video_start ?? 0}&rel=0`}
						title="Video önizleme"
						allow="encrypted-media; picture-in-picture"
						className="aspect-video w-full max-w-md rounded-xl bg-ink"
					/>
				</>
			)}
		</div>
	);
}

// Görsel: URL yapıştır ya da dosya yükle (Supabase Storage, /api/host/uploads).
function ImageField({
	value,
	onChange,
	blurredPreview,
}: {
	value: string | null;
	onChange: (url: string | null) => void;
	// Bulanık görsel sorusu: oyuncuların başta göreceği hali de göster
	blurredPreview?: boolean;
}) {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState('');

	async function upload(file: File) {
		setUploading(true);
		setError('');
		try {
			const form = new FormData();
			form.append('file', file);
			const res = await fetch('/api/host/uploads', { method: 'POST', body: form });
			const body = await res.json();
			if (!res.ok) return setError(body.error ?? 'Görsel yüklenemedi');
			onChange(body.url);
		} catch {
			setError('Bağlantı koptu, görsel yüklenemedi. Tekrar dene.');
		} finally {
			setUploading(false);
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex gap-2">
				<Input
					placeholder="Görsel URL (isteğe bağlı)"
					value={value ?? ''}
					onChange={e => onChange(e.target.value || null)}
				/>
				<label
					className={cn(
						'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border bg-white px-3 text-sm font-medium hover:bg-muted has-focus-visible:ring-3 has-focus-visible:ring-ring',
						uploading && 'pointer-events-none opacity-60',
					)}
				>
					<input
						type="file"
						accept="image/jpeg,image/png,image/webp,image/gif"
						className="sr-only"
						disabled={uploading}
						onChange={e => {
							const file = e.target.files?.[0];
							if (file) upload(file);
							e.target.value = '';
						}}
					/>
					<ImageUp className="size-4" />
					{uploading ? 'Yükleniyor…' : 'Görsel yükle'}
				</label>
			</div>
			{value && (
				<div className="flex items-center gap-3">
					{blurredPreview && (
						<figure className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
							<span className="h-20 overflow-hidden rounded-lg border">
								{/* biome-ignore lint/performance/noImgElement: dış URL'ler için next/image domain ayarı gerekir */}
								<img
									src={value}
									alt=""
									className="h-20 scale-110 object-contain blur-md"
								/>
							</span>
							<figcaption>Başta</figcaption>
						</figure>
					)}
					<figure className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
						{/* biome-ignore lint/performance/noImgElement: dış URL'ler için next/image domain ayarı gerekir */}
						<img
							src={value}
							alt="Soru görseli önizleme"
							className="h-20 rounded-lg border object-contain"
						/>
						{blurredPreview && <figcaption>Sonunda</figcaption>}
					</figure>
					<Button variant="ghost" size="sm" onClick={() => onChange(null)}>
						Kaldır
					</Button>
				</div>
			)}
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	);
}

function FormatPicker({
	value,
	onChange,
}: {
	value: QuestionType;
	onChange: (t: QuestionType) => void;
}) {
	return (
		<div
			className="flex rounded-lg border bg-muted/50 p-0.5"
			role="radiogroup"
			aria-label="Soru formatı"
		>
			{QUESTION_TYPES.map(type => {
				const { label, Icon } = FORMATS[type];
				return (
					<label
						key={type}
						title={label}
						className={cn(
							'flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition has-focus-visible:ring-2 has-focus-visible:ring-ring',
							value === type
								? 'bg-white text-ink'
								: 'text-muted-foreground hover:text-ink',
						)}
					>
						<input
							type="radio"
							checked={value === type}
							onChange={() => onChange(type)}
							className="sr-only"
						/>
						<Icon className="size-3.5" />
						<span className="hidden sm:inline">{label}</span>
					</label>
				);
			})}
		</div>
	);
}

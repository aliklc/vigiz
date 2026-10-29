import { z } from 'zod';

export const QUESTION_TYPES = ['choice', 'truefalse', 'buzzer'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];
export const TRUE_FALSE = ['Doğru', 'Yanlış'];

// Taslakta boş alanlara izin var (yarım quiz kaydedilebilsin). Veritabanının da istediği
// kurallar her zaman; dolu olma kuralları sadece "Hazır"da.
export const questionSchema = z
	.object({
		type: z.enum(QUESTION_TYPES).default('choice'),
		text: z.string().trim(),
		image_url: z.url('Geçerli bir görsel URL girin').nullable(),
		explanation: z.string().trim().nullable(),
		choices: z.array(z.string().trim()).max(5, 'En fazla 5 şık'),
		correct_index: z.number().int().min(0),
		// buzzer: cevap ekranında gösterilen doğru cevap
		answer_text: z.string().trim().nullish(),
		// YouTube "Sonra ne oldu?": soruda start → cut oynar, cevapta cut → end (saniye)
		video_id: z
			.string()
			.regex(/^[\w-]{11}$/, 'Geçerli bir YouTube linki girin')
			.nullish(),
		video_start: z.number().int().min(0).nullish(),
		video_cut: z.number().int().min(1).nullish(),
		video_end: z.number().int().min(1).nullish(),
	})
	.transform(q => {
		const video = q.type !== 'buzzer' && q.video_id ? q : null;
		const base = {
			...q,
			video_id: video?.video_id ?? null,
			video_start: video ? (q.video_start ?? 0) : null,
			video_cut: video?.video_cut ?? null,
			video_end: video?.video_end ?? null,
		};
		return q.type === 'truefalse'
			? { ...base, choices: TRUE_FALSE, correct_index: Math.min(q.correct_index, 1) }
			: q.type === 'buzzer'
				? { ...base, choices: [], correct_index: 0 }
				: base;
	})
	.superRefine((q, ctx) => {
		if (q.video_id) {
			const issue = (message: string) =>
				ctx.addIssue({ code: 'custom', message, path: ['video_cut'] });
			if (q.video_cut == null || q.video_cut <= (q.video_start ?? 0)) {
				issue('Videonun duracağı an başlangıçtan sonra olmalı');
			} else if (q.video_end != null && q.video_end <= q.video_cut) {
				issue('Cevaptaki bitiş, duruş anından sonra olmalı');
			}
		}
		if (q.type !== 'choice') return;
		if (q.choices.length < 2) ctx.addIssue({ code: 'custom', message: 'En az 2 şık' });
		if (q.correct_index >= q.choices.length) {
			ctx.addIssue({
				code: 'custom',
				message: 'Doğru şık seçilmeli',
				path: ['correct_index'],
			});
		}
	});

export const quizSchema = z
	.object({
		title: z.string().trim(),
		topic: z.string().trim(),
		author_name: z.string().trim(),
		quiz_date: z.iso.date('Tarih gerekli'),
		time_limit_sec: z.number().int().min(5).max(120),
		status: z.enum(['draft', 'ready']),
		questions: z.array(questionSchema),
	})
	.superRefine((quiz, ctx) => {
		if (quiz.status !== 'ready') return;
		const missing = (message: string) => ctx.addIssue({ code: 'custom', message });
		if (!quiz.title) missing('Hazır bir quizin başlığı olmalı');
		if (!quiz.topic) missing('Hazır bir quizin konusu olmalı');
		if (!quiz.author_name) missing('Hazırlayan adı gerekli');
		if (!quiz.questions.length) missing('Hazır bir quizin en az bir sorusu olmalı');
		quiz.questions.forEach((q, i) => {
			const n = `Soru ${i + 1}`;
			if (q.type === 'buzzer') {
				if (!q.image_url) missing(`${n}: bulanık görsel sorusunun görseli olmalı`);
				if (!q.answer_text) missing(`${n}: doğru cevabı yaz`);
				return;
			}
			if (!q.text) missing(`${n}: soru metni boş`);
			if (q.choices.some(c => !c)) missing(`${n}: boş şık var`);
		});
	});

// youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, /embed/ID ya da çıplak ID → ID.
export function youtubeId(input: string): string | null {
	const s = input.trim();
	if (/^[\w-]{11}$/.test(s)) return s;
	try {
		const url = new URL(s);
		const host = url.hostname.replace(/^(www|m)\./, '');
		const id =
			host === 'youtu.be'
				? url.pathname.slice(1)
				: host === 'youtube.com' || host === 'youtube-nocookie.com'
					? (url.searchParams.get('v') ??
						url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1])
					: null;
		return id && /^[\w-]{11}$/.test(id) ? id : null;
	} catch {
		return null;
	}
}

// "75", "1:15" ya da "0:01:15" → saniye; geçersizse null.
export function parseTime(input: string): number | null {
	const parts = input.trim().split(':');
	if (parts.length > 3 || parts.some(p => !/^\d+$/.test(p))) return null;
	return parts.reduce((sum, p) => sum * 60 + Number(p), 0);
}

export const formatTime = (sec: number) =>
	`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

export type QuizInput = z.input<typeof quizSchema>;
export type QuestionInput = z.input<typeof questionSchema>;

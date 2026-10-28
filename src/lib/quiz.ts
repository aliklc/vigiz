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
	})
	.transform(q =>
		q.type === 'truefalse'
			? { ...q, choices: TRUE_FALSE, correct_index: Math.min(q.correct_index, 1) }
			: q.type === 'buzzer'
				? { ...q, choices: [], correct_index: 0 }
				: q,
	)
	.superRefine((q, ctx) => {
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

export type QuizInput = z.input<typeof quizSchema>;
export type QuestionInput = z.input<typeof questionSchema>;

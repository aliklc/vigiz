import { z } from 'zod';

// Taslakta boş alanlara izin var (yarım quiz kaydedilebilsin). Veritabanının da istediği
// kurallar (2-5 şık, geçerli doğru şık) her zaman; dolu olma kuralları sadece "Hazır"da.
export const questionSchema = z
	.object({
		text: z.string().trim(),
		image_url: z.url('Geçerli bir görsel URL girin').nullable(),
		explanation: z.string().trim().nullable(),
		choices: z.array(z.string().trim()).min(2, 'En az 2 şık').max(5, 'En fazla 5 şık'),
		correct_index: z.number().int().min(0),
	})
	.refine(q => q.correct_index < q.choices.length, {
		message: 'Doğru şık seçilmeli',
		path: ['correct_index'],
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
			if (!q.text) missing(`Soru ${i + 1}: soru metni boş`);
			if (q.choices.some(c => !c)) missing(`Soru ${i + 1}: boş şık var`);
		});
	});

export type QuizInput = z.infer<typeof quizSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;

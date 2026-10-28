import { z } from 'zod';

export const questionSchema = z
	.object({
		text: z.string().trim().min(1, 'Soru metni boş olamaz'),
		image_url: z.url('Geçerli bir görsel URL girin').nullable(),
		explanation: z.string().trim().nullable(),
		choices: z
			.array(z.string().trim().min(1, 'Şık boş olamaz'))
			.min(2, 'En az 2 şık')
			.max(5, 'En fazla 5 şık'),
		correct_index: z.number().int().min(0),
	})
	.refine(q => q.correct_index < q.choices.length, {
		message: 'Doğru şık seçilmeli',
		path: ['correct_index'],
	});

export const quizSchema = z
	.object({
		title: z.string().trim().min(1, 'Başlık gerekli'),
		topic: z.string().trim().min(1, 'Konu gerekli'),
		author_name: z.string().trim().min(1, 'Hazırlayan gerekli'),
		quiz_date: z.iso.date('Tarih gerekli'),
		time_limit_sec: z.number().int().min(5).max(120),
		status: z.enum(['draft', 'ready']),
		questions: z.array(questionSchema),
	})
	.refine(q => q.status === 'draft' || q.questions.length > 0, {
		message: 'Hazır bir quizin en az bir sorusu olmalı',
		path: ['questions'],
	});

export type QuizInput = z.infer<typeof quizSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;

import { notFound } from 'next/navigation';

import { QuizEditor } from '@/components/quiz-editor';
import { requireHost } from '@/lib/auth';
import type { QuestionType, QuizInput } from '@/lib/quiz';
import { db } from '@/lib/supabase/admin';

export default async function EditQuizPage({ params }: PageProps<'/host/quizzes/[id]'>) {
	const host = await requireHost();
	const { id } = await params;
	const { data: quiz } = await db
		.from('quizzes')
		.select(
			'title, topic, author_name, quiz_date, time_limit_sec, status, questions(type, text, image_url, explanation, answer_text, choices, correct_index, position, video_id, video_start, video_cut, video_end)',
		)
		.eq('id', id)
		.eq('owner_id', host.id)
		.order('position', { referencedTable: 'questions' })
		.maybeSingle();
	if (!quiz) notFound();

	const { questions, ...rest } = quiz;
	return (
		<QuizEditor
			id={id}
			initial={{
				...rest,
				status: rest.status as QuizInput['status'],
				questions: questions.map(({ position, ...q }) => ({
					...q,
					type: q.type as QuestionType,
				})),
			}}
		/>
	);
}

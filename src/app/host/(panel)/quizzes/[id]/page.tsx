import { notFound } from 'next/navigation';

import { QuizEditor } from '@/components/quiz-editor';
import { requireHost } from '@/lib/auth';
import type { QuizInput } from '@/lib/quiz';
import { db } from '@/lib/supabase/admin';

export default async function EditQuizPage({ params }: PageProps<'/host/quizzes/[id]'>) {
	const host = await requireHost();
	const { id } = await params;
	const { data: quiz } = await db
		.from('quizzes')
		.select(
			'title, topic, author_name, quiz_date, time_limit_sec, status, questions(text, image_url, explanation, choices, correct_index, position)',
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
				questions: questions.map(({ position, ...q }) => q),
			}}
		/>
	);
}

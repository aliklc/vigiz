import { QuizEditor } from '@/components/quiz-editor';
import { requireHost } from '@/lib/auth';

export default async function NewQuizPage() {
	const host = await requireHost();
	return <QuizEditor authorName={host.name} />;
}

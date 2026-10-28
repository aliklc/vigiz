import { saveQuiz } from '@/lib/save-quiz';

export function POST(request: Request) {
	return saveQuiz(request, null);
}

import { getHost, unauthorized } from '@/lib/auth';
import { saveQuiz } from '@/lib/save-quiz';

export async function POST(request: Request) {
	const host = await getHost();
	if (!host) return unauthorized();
	return saveQuiz(request, null, host.id);
}

// Kullanım: pnpm seed [dosya.json]   (varsayılan: seed/quiz.json)
// Her çalıştırmada YENİ bir quiz ekler; mevcutlara dokunmaz.
import { readFileSync } from 'node:fs';

import { createClient } from '@supabase/supabase-js';

const file = process.argv[2] ?? 'seed/quiz.json';
const quiz = JSON.parse(readFileSync(file, 'utf8'));
quiz.questions = quiz.questions.map(q => ({
	image_url: null,
	explanation: null,
	...q,
}));

const db = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const { data, error } = await db.rpc('save_quiz', { p_id: null, p_quiz: quiz });
if (error) {
	console.error('Seed başarısız:', error.message);
	process.exit(1);
}
console.log(`Quiz eklendi: ${quiz.title} (${quiz.questions.length} soru) → /host/quizzes/${data}`);

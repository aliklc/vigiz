// Kullanım: pnpm seed [dosya.json]   (varsayılan: seed/quiz.json)
// SEED_OWNER_EMAIL'deki host'a her çalıştırmada YENİ bir quiz ekler; mevcutlara dokunmaz.
import { readFileSync } from 'node:fs';

import { createClient } from '@supabase/supabase-js';

const file = process.argv[2] ?? 'seed/quiz.json';
const quiz = JSON.parse(readFileSync(file, 'utf8'));
quiz.questions = quiz.questions.map(q => ({
	image_url: null,
	explanation: null,
	...q,
}));

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const email = process.env.SEED_OWNER_EMAIL;
const { data: users } = await db.auth.admin.listUsers({ perPage: 1000 });
const owner = users?.users.find(u => u.email === email);
if (!owner) {
	console.error(`SEED_OWNER_EMAIL (${email}) ile kayıtlı host yok. Önce /register'dan kayıt ol.`);
	process.exit(1);
}
const { data, error } = await db.rpc('save_quiz', { p_id: null, p_owner: owner.id, p_quiz: quiz });
if (error) {
	console.error('Seed başarısız:', error.message);
	process.exit(1);
}
console.log(`Quiz eklendi: ${quiz.title} (${quiz.questions.length} soru) → /host/quizzes/${data}`);

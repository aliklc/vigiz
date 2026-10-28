import { createClient } from '@supabase/supabase-js';

// Anon key: sadece Realtime aboneliği için (games ve players okunabilir).
export const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
	{ auth: { persistSession: false } },
);

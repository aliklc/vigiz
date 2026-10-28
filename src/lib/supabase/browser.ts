import { createClient } from '@supabase/supabase-js';

// Publishable key: sadece Realtime aboneliği için (games ve players okunabilir).
export const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
	{ auth: { persistSession: false } },
);

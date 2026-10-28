import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Secret key: RLS'i aşar. Sadece sunucuda kullanılır.
export const db = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SECRET_KEY!,
	{ auth: { persistSession: false } },
);

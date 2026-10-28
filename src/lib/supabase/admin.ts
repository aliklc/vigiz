import 'server-only';
import { createClient } from '@supabase/supabase-js';

import type { Database } from './types';

// Secret key: RLS'i aşar. Sadece sunucuda kullanılır.
export const db = createClient<Database>(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SECRET_KEY!,
	{ auth: { persistSession: false } },
);

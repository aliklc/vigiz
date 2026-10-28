import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-role: RLS'i aşar. Sadece sunucuda kullanılır.
export const db = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
	{ auth: { persistSession: false } },
);

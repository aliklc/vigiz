import 'server-only';
import { cookies } from 'next/headers';

import { ADMIN_COOKIE, adminToken } from '@/lib/admin-auth';

// Herkese açık sayfalarda host'a özel butonları göstermek için.
export async function isAdmin(): Promise<boolean> {
	return (await cookies()).get(ADMIN_COOKIE)?.value === (await adminToken());
}

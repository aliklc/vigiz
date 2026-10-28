export const ADMIN_COOKIE = 'vigiz_admin';

// Cookie değeri = HMAC(secret, password). Şifre değişince tüm oturumlar düşer.
export async function adminToken(): Promise<string> {
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		enc.encode(process.env.ADMIN_COOKIE_SECRET),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const sig = await crypto.subtle.sign('HMAC', key, enc.encode(process.env.ADMIN_PASSWORD));
	return Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, '0')).join('');
}

import { NextResponse } from 'next/server';

import { getHost, unauthorized } from '@/lib/auth';
import { db } from '@/lib/supabase/admin';

const BUCKET = 'question-images';
const MAX_BYTES = 4 * 1024 * 1024; // Vercel fonksiyon gövde sınırı ~4.5 MB
const EXT: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
};

// Editördeki "Görsel yükle". Dosya host'un klasörüne rastgele bir adla yazılır, herkese açık URL döner.
// shortcut: silinen soruların görselleri bucket'ta kalır; depolama dolarsa temizlik işi eklenir.
export async function POST(request: Request) {
	const host = await getHost();
	if (!host) return unauthorized();

	const file = (await request.formData().catch(() => null))?.get('file');
	if (!(file instanceof File)) {
		return NextResponse.json({ error: 'Dosya seçilmedi' }, { status: 400 });
	}
	const ext = EXT[file.type];
	if (!ext) {
		return NextResponse.json(
			{ error: 'Sadece JPG, PNG, WebP ya da GIF yüklenebilir' },
			{ status: 400 },
		);
	}
	if (file.size > MAX_BYTES) {
		return NextResponse.json({ error: 'Görsel en fazla 4 MB olabilir' }, { status: 400 });
	}

	const path = `${host.id}/${crypto.randomUUID()}.${ext}`;
	const { error } = await db.storage.from(BUCKET).upload(path, file, { contentType: file.type });
	if (error) return NextResponse.json({ error: 'Görsel yüklenemedi' }, { status: 500 });
	return NextResponse.json({ url: db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl });
}

import sharp from 'sharp';

import { deadlineOf, getCurrentQuestion, getGame } from '@/lib/game';
import { BLUR_LEVELS, blurLevel } from '@/lib/scoring';

// Bulanık görsel: net hal cevap gösterimine kadar tarayıcıya gitmez. Netlik seviyesi sunucuda,
// kalan süreden hesaplanır; istekteki parametre sadece önbellek kırıcıdır, ona güvenilmez.
const MAX_SIGMA = 40;
// Aynı sunucu örneğinde aynı soru + seviye tekrar işlenmesin (30 oyuncu aynı anda ister).
const cache = new Map<string, Buffer>();

export async function GET(_: Request, ctx: RouteContext<'/api/games/[code]/image'>) {
	const game = await getGame((await ctx.params).code);
	if (game?.phase !== 'question') return new Response(null, { status: 404 });
	const question = await getCurrentQuestion(game);
	if (question?.type !== 'buzzer' || !question.image_url?.startsWith('https://')) {
		return new Response(null, { status: 404 });
	}

	const pausedAt = game.paused_at ? Date.parse(game.paused_at) : Date.now();
	const level = blurLevel(deadlineOf(game) - pausedAt, game.limitMs);
	const key = `${question.id}:${level}`;
	let image = cache.get(key);
	if (!image) {
		const source = await fetch(question.image_url);
		if (!source.ok) return new Response(null, { status: 502 });
		const sigma = (MAX_SIGMA * (BLUR_LEVELS - level)) / BLUR_LEVELS;
		let pipeline = sharp(Buffer.from(await source.arrayBuffer()))
			.rotate()
			.resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true });
		if (sigma > 0.3) pipeline = pipeline.blur(sigma);
		image = await pipeline.jpeg({ quality: 80 }).toBuffer();
		if (cache.size > 100) cache.clear();
		cache.set(key, image);
	}
	return new Response(new Uint8Array(image), {
		headers: {
			'Content-Type': 'image/jpeg',
			'Cache-Control': 'no-store',
			'X-Blur-Level': String(level),
		},
	});
}

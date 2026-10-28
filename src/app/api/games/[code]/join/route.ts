import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getGame } from '@/lib/game';
import { db } from '@/lib/supabase/admin';

const joinSchema = z.object({
	token: z.uuid().nullish(),
	name: z.string().trim().min(1, 'İsim gerekli').max(30, 'İsim en fazla 30 karakter').nullish(),
});

// token bu oyunda geçerliyse aynı oyuncu döner (yeniden bağlanma); yoksa isimle yeni oyuncu açılır.
// Token gizlidir: cevap verme ve yeniden bağlanma sadece onunla yapılır.
export async function POST(request: Request, ctx: RouteContext<'/api/games/[code]/join'>) {
	const game = await getGame((await ctx.params).code);
	if (!game) return NextResponse.json({ error: 'Oda bulunamadı' }, { status: 404 });

	const parsed = joinSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
	}
	const { token, name } = parsed.data;

	if (token) {
		const { data: existing } = await db
			.from('player_tokens')
			.select('players!inner(id, name, game_id)')
			.eq('token', token)
			.eq('players.game_id', game.id)
			.maybeSingle();
		if (existing) return NextResponse.json({ token, name: existing.players.name });
		if (!name) return NextResponse.json({ error: 'Bu odada kaydın yok' }, { status: 400 });
	}

	if (!name) return NextResponse.json({ error: 'İsim gerekli' }, { status: 400 });
	if (game.phase === 'finished') {
		return NextResponse.json({ error: 'Bu oyun bitti' }, { status: 409 });
	}

	const id = crypto.randomUUID();
	const { error } = await db.from('players').insert({ id, game_id: game.id, name });
	if (error?.code === '23505') {
		return NextResponse.json(
			{ error: 'Bu isim alınmış, başka bir isim dene' },
			{ status: 409 },
		);
	}
	if (error) return NextResponse.json({ error: 'Katılınamadı' }, { status: 500 });

	const { data: created, error: tokenError } = await db
		.from('player_tokens')
		.insert({ player_id: id })
		.select('token')
		.single();
	if (tokenError) {
		// Token'sız oyuncu kimse tarafından kullanılamaz; ismi boşa tutmasın.
		await db.from('players').delete().eq('id', id);
		return NextResponse.json({ error: 'Katılınamadı' }, { status: 500 });
	}
	return NextResponse.json({ token: created.token, name });
}

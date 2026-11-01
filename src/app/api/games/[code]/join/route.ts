import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getGame } from '@/lib/game';
import type { Dict } from '@/lib/i18n';
import { getDict } from '@/lib/locale';
import { db } from '@/lib/supabase/admin';

const joinSchema = (t: Dict['api']) =>
	z.object({
		token: z.uuid().nullish(),
		name: z.string().trim().min(1, t.nameRequired).max(30, t.nameTooLong).nullish(),
	});

// token bu oyunda geçerliyse aynı oyuncu döner (yeniden bağlanma); yoksa isimle yeni oyuncu açılır.
// Token gizlidir: cevap verme ve yeniden bağlanma sadece onunla yapılır.
export async function POST(request: Request, ctx: RouteContext<'/api/games/[code]/join'>) {
	const t = (await getDict()).api;
	const game = await getGame((await ctx.params).code);
	if (!game) return NextResponse.json({ error: t.roomNotFound }, { status: 404 });

	const parsed = joinSchema(t).safeParse(await request.json().catch(() => null));
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
		if (!name) return NextResponse.json({ error: t.noRegistration }, { status: 400 });
	}

	if (!name) return NextResponse.json({ error: t.nameRequired }, { status: 400 });
	if (game.phase === 'finished') {
		return NextResponse.json({ error: t.gameOver }, { status: 409 });
	}

	const id = crypto.randomUUID();
	const { error } = await db.from('players').insert({ id, game_id: game.id, name });
	if (error?.code === '23505') {
		return NextResponse.json({ error: t.nameTaken }, { status: 409 });
	}
	if (error) return NextResponse.json({ error: t.joinFailed }, { status: 500 });

	const { data: created, error: tokenError } = await db
		.from('player_tokens')
		.insert({ player_id: id })
		.select('token')
		.single();
	if (tokenError) {
		// Token'sız oyuncu kimse tarafından kullanılamaz; ismi boşa tutmasın.
		await db.from('players').delete().eq('id', id);
		return NextResponse.json({ error: t.joinFailed }, { status: 500 });
	}
	return NextResponse.json({ token: created.token, name });
}

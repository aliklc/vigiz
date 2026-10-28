import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getGame } from '@/lib/game';
import { db } from '@/lib/supabase/admin';

const actionSchema = z.object({ action: z.literal('kick'), playerId: z.uuid() });

export async function POST(request: Request, ctx: RouteContext<'/api/host/games/[code]/action'>) {
	const game = await getGame((await ctx.params).code);
	if (!game) return NextResponse.json({ error: 'Oda bulunamadı' }, { status: 404 });

	const parsed = actionSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
	const body = parsed.data;

	if (body.action === 'kick') {
		await db
			.from('players')
			.update({ kicked: true })
			.eq('id', body.playerId)
			.eq('game_id', game.id);
	}
	return NextResponse.json({ ok: true });
}

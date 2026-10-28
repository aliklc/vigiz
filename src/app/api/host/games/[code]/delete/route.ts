import { NextResponse } from 'next/server';

import { getHost, notFoundJson, unauthorized } from '@/lib/auth';
import { getOwnedGame } from '@/lib/game';
import { db } from '@/lib/supabase/admin';

// Arşivdeki "Sil" butonu (sadece oyunun sahibi). Oyuncular ve cevaplar cascade ile silinir.
export async function POST(request: Request, ctx: RouteContext<'/api/host/games/[code]/delete'>) {
	const host = await getHost();
	if (!host) return unauthorized();
	const game = await getOwnedGame((await ctx.params).code, host.id);
	if (!game) return notFoundJson('Oyun bulunamadı');
	const { error } = await db.from('games').delete().eq('id', game.id);
	if (error) return NextResponse.json({ error: 'Silinemedi' }, { status: 500 });
	return NextResponse.redirect(new URL('/archive', request.url), 303);
}

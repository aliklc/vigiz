import { NextResponse } from 'next/server';

import { db } from '@/lib/supabase/admin';

// Arşivdeki "Sil" butonu. Oyuncular ve cevaplar cascade ile silinir.
export async function POST(request: Request, ctx: RouteContext<'/api/host/games/[code]/delete'>) {
	const { code } = await ctx.params;
	const { error } = await db.from('games').delete().eq('code', code.toUpperCase());
	if (error) return NextResponse.json({ error: 'Silinemedi' }, { status: 500 });
	return NextResponse.redirect(new URL('/archive', request.url), 303);
}

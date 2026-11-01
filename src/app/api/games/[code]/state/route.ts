import { NextResponse } from 'next/server';

import { buildState } from '@/lib/game';
import { getDict } from '@/lib/locale';

export async function GET(request: Request, ctx: RouteContext<'/api/games/[code]/state'>) {
	const t = (await getDict()).api;
	const token = new URL(request.url).searchParams.get('token');
	const state = await buildState((await ctx.params).code, token);
	if (!state) return NextResponse.json({ error: t.roomNotFound }, { status: 404 });
	return NextResponse.json(state, { headers: { 'Cache-Control': 'no-store' } });
}

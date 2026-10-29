'use client';

import { useCallback, useEffect, useState } from 'react';

import type { GameState } from '@/lib/game-types';
import { supabase } from '@/lib/supabase/browser';

// Oyunun tek kaynağı sunucudaki state'tir. games/players satırı her değiştiğinde,
// sekmeye geri dönüldüğünde ve bağlantı yeniden kurulduğunda state yeniden çekilir.
export function useGame(code: string, token: string | null) {
	const [state, setState] = useState<GameState | null>(null);
	const [notFound, setNotFound] = useState(false);
	// sunucu saati - cihaz saati; geri sayım cihaz saatinden bağımsız olsun diye
	const [offset, setOffset] = useState(0);

	const refresh = useCallback(async () => {
		const qs = token ? `?token=${token}` : '';
		try {
			const res = await fetch(`/api/games/${code}/state${qs}`, { cache: 'no-store' });
			if (res.status === 404) return setNotFound(true);
			if (!res.ok) return;
			const data: GameState = await res.json();
			setOffset(data.serverNow - Date.now());
			setState(data);
		} catch {
			// Ağ hatası: bir sonraki Realtime olayı, sekmeye dönüş ya da 'online' tekrar dener.
		}
	}, [code, token]);

	const gameId = state?.game.id;

	useEffect(() => {
		refresh();
		const onVisible = () => document.visibilityState === 'visible' && refresh();
		document.addEventListener('visibilitychange', onVisible);
		window.addEventListener('online', refresh);
		return () => {
			document.removeEventListener('visibilitychange', onVisible);
			window.removeEventListener('online', refresh);
		};
	}, [refresh]);

	useEffect(() => {
		if (!gameId) return;
		const channel = supabase
			.channel(`game:${gameId}`)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
				refresh,
			)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` },
				refresh,
			)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'buzzes', filter: `game_id=eq.${gameId}` },
				refresh,
			)
			// Silinen oda (host lobide iptal etti). DELETE olayları filtrelenemez; id'ye bakılır.
			.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'games' }, p => {
				if (p.old.id === gameId) refresh();
			})
			// Yeniden bağlanınca kaçırılmış değişiklikleri yakala.
			.subscribe(status => status === 'SUBSCRIBED' && refresh());
		return () => {
			supabase.removeChannel(channel);
		};
	}, [gameId, refresh]);

	return { state, notFound, refresh, offset };
}

'use client';

import { useEffect } from 'react';

// Ana sayfa: kaydırdıkça zemin rengi bölüme göre değişir (CSS geçişiyle yumuşak), .reveal
// öğeleri görünür alana girince bulanıktan netleşerek gelir. JS yoksa her şey normal görünür.
export function ScrollEffects() {
	useEffect(() => {
		const root = document.querySelector<HTMLElement>('[data-home]');
		const sections = [...document.querySelectorAll<HTMLElement>('[data-bg]')];
		if (!root) return;

		// Üst kenarı ekranın %60'ını geçen son bölümün rengi.
		let frame = 0;
		const paint = () => {
			frame = 0;
			const line = innerHeight * 0.6;
			const active = sections.filter(s => s.getBoundingClientRect().top < line).at(-1);
			if (active) root.style.backgroundColor = active.dataset.bg ?? '';
		};
		const onScroll = () => {
			frame ||= requestAnimationFrame(paint);
		};
		paint();
		addEventListener('scroll', onScroll, { passive: true });
		addEventListener('resize', onScroll);

		document.documentElement.classList.add('reveal-ready');
		const io = new IntersectionObserver(
			entries => {
				for (const e of entries) {
					if (!e.isIntersecting) continue;
					e.target.classList.add('is-visible');
					io.unobserve(e.target);
				}
			},
			{ rootMargin: '0px 0px -12% 0px' },
		);
		for (const el of document.querySelectorAll('.reveal')) io.observe(el);

		return () => {
			removeEventListener('scroll', onScroll);
			removeEventListener('resize', onScroll);
			cancelAnimationFrame(frame);
			io.disconnect();
			document.documentElement.classList.remove('reveal-ready');
		};
	}, []);
	return null;
}

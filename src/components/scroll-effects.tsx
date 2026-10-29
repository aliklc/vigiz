'use client';

import { useEffect } from 'react';

// Ana sayfa: .reveal öğeleri görünür alana girince bulanıktan netleşerek gelir.
// JS yoksa her şey normal görünür.
export function ScrollEffects() {
	useEffect(() => {
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
			io.disconnect();
			document.documentElement.classList.remove('reveal-ready');
		};
	}, []);
	return null;
}

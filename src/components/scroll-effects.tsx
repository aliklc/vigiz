'use client';

import { useEffect } from 'react';

const rgb = (hex: string) => [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16));

// Ana sayfa (Buzz'daki gibi):
// - Zemin rengi kaydırma konumuna bağlı olarak bölüm renkleri (data-bg) arasında akar; her bölüm
//   sınırında ekran yüksekliğinin %80'i boyunca karışır.
// - .reveal öğeleri görünür alana girince bulanıktan netleşerek gelir.
// JS yoksa bölümler kendi zeminleriyle, içerik de hep görünür.
export function ScrollEffects() {
	useEffect(() => {
		const root = document.querySelector<HTMLElement>('[data-home]');
		const sections = [...document.querySelectorAll<HTMLElement>('[data-bg]')];
		const colors = sections.map(s => rgb(s.dataset.bg ?? '#ffffff'));
		let frame = 0;
		const paint = () => {
			frame = 0;
			if (!root || !colors.length) return;
			const center = scrollY + innerHeight / 2;
			const width = innerHeight * 0.8;
			let color = colors[0];
			for (let i = 1; i < sections.length; i++) {
				const start = sections[i].offsetTop - width / 2;
				const t = Math.min(1, Math.max(0, (center - start) / width));
				color = color.map((c, k) => c + (colors[i][k] - c) * t);
			}
			root.style.backgroundColor = `rgb(${color.map(Math.round).join(' ')})`;
		};
		const onScroll = () => {
			frame ||= requestAnimationFrame(paint);
		};
		root?.classList.add('home-live');
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
			root?.classList.remove('home-live');
			document.documentElement.classList.remove('reveal-ready');
		};
	}, []);
	return null;
}

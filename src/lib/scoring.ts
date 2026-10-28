// Doğru cevap: 500 taban + en fazla 300 süre bonusu (burada, cevap anında)
// + en fazla 200 sıra bonusu (veritabanında answer_points view'ında hesaplanır).
export const BASE_POINTS = 500;
export const SPEED_POINTS = 300;
// Son saniyede basılan cevabın ağ gecikmesiyle reddedilmemesi için.
export const GRACE_MS = 300;

export function calcPoints(correct: boolean, remainingMs: number, limitMs: number): number {
	if (!correct) return 0;
	const ratio = Math.min(Math.max(remainingMs / limitMs, 0), 1);
	return BASE_POINTS + Math.round(SPEED_POINTS * ratio);
}

// Bulanık görsel (buzzer): doğru cevap 500 + görsel ne kadar bulanıkken basıldıysa en fazla 500.
// Puan basış anında hesaplanır; yanlış cevap eksi puan.
export const WRONG_BUZZ_POINTS = -300;

export function buzzerPoints(remainingMs: number, limitMs: number): number {
	const ratio = Math.min(Math.max(remainingMs / limitMs, 0), 1);
	return 500 + Math.round(500 * ratio);
}

// Görselin netlik seviyesi: 0 (en bulanık) … BLUR_LEVELS (net). Süre ilerledikçe artar.
export const BLUR_LEVELS = 10;

export function blurLevel(remainingMs: number, limitMs: number): number {
	const progress = 1 - Math.min(Math.max(remainingMs / limitMs, 0), 1);
	return Math.min(BLUR_LEVELS, Math.floor(progress * BLUR_LEVELS));
}

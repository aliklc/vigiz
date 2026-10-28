export const BASE_POINTS = 500;
export const SPEED_POINTS = 500;
// Son saniyede basılan cevabın ağ gecikmesiyle reddedilmemesi için.
export const GRACE_MS = 300;

export function calcPoints(correct: boolean, remainingMs: number, limitMs: number): number {
	if (!correct) return 0;
	const ratio = Math.min(Math.max(remainingMs / limitMs, 0), 1);
	return BASE_POINTS + Math.round(SPEED_POINTS * ratio);
}

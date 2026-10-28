import { ListChecks, ScanEye, ToggleLeft } from 'lucide-react';

import type { QuestionType } from '@/lib/quiz';

// Soru formatlarının ortak adı, ikonu ve tek satırlık açıklaması (editör, ana sayfa, panel).
export const FORMATS: Record<
	QuestionType,
	{ label: string; short: string; Icon: typeof ListChecks }
> = {
	choice: { label: 'Çoktan seçmeli', short: 'Şıklardan doğruyu seç', Icon: ListChecks },
	truefalse: { label: 'Doğru / Yanlış', short: 'İki seçenek, hızlı karar', Icon: ToggleLeft },
	buzzer: { label: 'Bulanık görsel', short: 'Görsel netleşir, ilk bilen kazanır', Icon: ScanEye },
};

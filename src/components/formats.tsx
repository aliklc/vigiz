import { ListChecks, ScanEye, ToggleLeft } from 'lucide-react';

import type { QuestionType } from '@/lib/quiz';

// Soru formatlarının ortak ikonu (editör, ana sayfa, panel). Adları sözlükte: t.formats[type].
export const FORMAT_ICONS: Record<QuestionType, typeof ListChecks> = {
	choice: ListChecks,
	truefalse: ToggleLeft,
	buzzer: ScanEye,
};

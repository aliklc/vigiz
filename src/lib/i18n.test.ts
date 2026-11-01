import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dicts, pickLocale } from './i18n/index.ts';

test('dil: çerez seçimi tarayıcı dilinden önce gelir', () => {
	assert.equal(pickLocale('tr', 'en-US,en;q=0.9'), 'tr');
	assert.equal(pickLocale('en', 'tr-TR'), 'en');
});

test('dil: tarayıcı dilleri sırayla denenir, eşleşmezse İngilizce', () => {
	assert.equal(pickLocale(undefined, 'de-DE,tr;q=0.8,en;q=0.5'), 'tr');
	assert.equal(pickLocale(undefined, 'EN-gb'), 'en');
	assert.equal(pickLocale('fr', 'de-DE'), 'en');
	assert.equal(pickLocale(undefined, null), 'en');
});

test('sözlük: İngilizcede eksik ya da boş metin yok', () => {
	const walk = (tr: unknown, en: unknown, path: string) => {
		if (typeof tr === 'object' && tr) {
			for (const key of Object.keys(tr)) {
				assert.ok(en && key in (en as object), `en eksik: ${path}.${key}`);
				walk(
					(tr as Record<string, unknown>)[key],
					(en as Record<string, unknown>)[key],
					`${path}.${key}`,
				);
			}
		} else if (typeof tr === 'string') {
			assert.ok(typeof en === 'string' && en.length > 0, `en boş: ${path}`);
		}
	};
	walk(dicts.tr, dicts.en, 't');
});

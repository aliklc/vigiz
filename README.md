# vigiz.

Şirket içi aylık quiz gecesi için canlı quiz sitesi. Her ay bir çalışan quizi hazırlar ve sunar; diğerleri telefonlarından aynı anda oynar.

- **Host:** e-posta ve şifreyle hesap açar. Sadece kendi quizlerini görür, oda açar, oyunu yönetir.
- **Oyuncu:** hesap açmaz. QR kodu okutur ya da oda kodunu girer, adını yazar ve oynar.

Next.js 16 (App Router) + TypeScript + Tailwind v4, Supabase (Postgres, Auth, Realtime), Vercel.

## Nasıl çalışır

- Oyunun tek doğruluk kaynağı `games` satırıdır. Fazlar: `lobby → question → reveal → leaderboard → … → finished`.
- Tarayıcılar Supabase Realtime ile `games` ve `players` değişikliklerini dinler. Her değişiklikte `GET /api/games/[code]/state` çağrılır ve ekran bu yanıta göre çizilir.
- Doğru cevap ve açıklama tarayıcıya sadece `reveal` fazında gönderilir. Cevap kontrolü ve puan hesabı sunucudadır.
- Zamanlama sunucudadır. Sorunun başlangıç zamanı veritabanında tutulur, süre bittikten sonra gelen cevap reddedilir (300 ms tolerans).
- Puan: doğru cevap için 500 taban, en fazla 300 süre bonusu (kalan süreyle orantılı) ve en fazla 200 sıra bonusu (doğru bilenler arasında ilk 200, son 0). Yanlış ya da boş cevap 0 puan. Cevap değiştirilemez.
- Oyuncu, telefonda saklanan gizli bir token ile tanınır (`player_tokens`, tarayıcıdan okunamaz). Sayfa yenilense de aynı oyuncu olarak devam eder.
- Tüm veri erişimi sunucuda secret key ile yapılır. Tarayıcı, RLS sayesinde sadece `games` ve `players` tablolarını okuyabilir.

## Lokal kurulum

Gerekenler: Node 22.18+, pnpm.

```sh
pnpm install
cp .env.example .env.local   # değerleri doldur (aşağıda)
pnpm db:push                 # şemayı Supabase'e uygular ve TypeScript tiplerini üretir
pnpm dev                     # http://localhost:3000
```

`/register` adresinden host hesabı aç, sonra `/host` paneline gir.

Telefonla lokal test: host ekranını Mac'in ağ IP'siyle aç (`pnpm dev` çıktısındaki "Network" satırı). Böylece lobideki QR kod telefonun açabileceği bir adres içerir.

### Ortam değişkenleri

| Değişken                               | Nereden                                             | Nerede gerekli                |
| -------------------------------------- | --------------------------------------------------- | ----------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → Project Settings → API                   | lokal + Vercel                |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → API Keys → publishable                   | lokal + Vercel                |
| `SUPABASE_SECRET_KEY`                  | Supabase → API Keys → secret (**gizli**)            | lokal + Vercel                |
| `SUPABASE_DB_URL`                      | Supabase → Connect → Session pooler bağlantı dizesi | sadece lokal (`pnpm db:push`) |
| `SEED_OWNER_EMAIL`                     | kayıtlı bir host'un e-postası                       | sadece lokal (`pnpm seed`)    |

`NEXT_PUBLIC_` ile başlayan değerler tarayıcıya açıktır. Secret key asla bu önekle tanımlanmamalı.

## Supabase kurulumu (bir kez)

1. supabase.com'da proje aç.
2. **Authentication → Sign In / Providers → Email → "Confirm email" kapat.** Açık kalırsa yeni host'lar onay maili beklemek zorunda kalır, Supabase'in ücretsiz mail limiti de çok düşük.
3. **Authentication → URL Configuration → Site URL** alanına canlı site adresini yaz.
4. `.env.local`'i doldurup `pnpm db:push` çalıştır. Realtime yayını da migration ile açılır, ayrıca ayar gerekmez.

## Veritabanı değişiklikleri

- Yeni migration: `supabase/migrations/<zaman damgası>_<ad>.sql` dosyası ekle, ardından:

  ```sh
  pnpm db:push --dry-run   # nelerin uygulanacağını gör
  pnpm db:push             # uygula + src/lib/supabase/types.ts'i yeniden üret
  ```
- Sadece henüz uygulanmamış migration'lar çalışır.
- **Sıra önemli:** önce migration, sonra koda push. Yoksa canlıdaki yeni kod veritabanında henüz olmayan bir kolonu arar ve hata verir.

## Örnek quiz (seed)

```sh
pnpm seed                    # seed/quiz.json → SEED_OWNER_EMAIL hesabına
pnpm seed sorularim.json     # kendi dosyan
```

Her çalıştırma yeni bir quiz ekler. Soru formatı `type` ile seçilir:
- `choice` (varsayılan, çoktan seçmeli).
- `truefalse` (şıklar otomatik `Doğru`/`Yanlış`, `correct_index` 0 = Doğru).
- `buzzer` (bulanık görsel: `image_url` ve `answer_text` zorunlu, şık yok).

Dosya formatı (`image_url` ve `explanation` isteğe bağlı, 2–5 şık, `correct_index` 0'dan başlar):

```json
{
	"title": "Ekim Quiz Night",
	"topic": "Uzay",
	"author_name": "Ali",
	"quiz_date": "2026-10-30",
	"time_limit_sec": 20,
	"status": "ready",
	"questions": [
		{
			"text": "En büyük gezegen hangisi?",
			"choices": ["Satürn", "Jüpiter", "Neptün"],
			"correct_index": 1,
			"explanation": "Jüpiter, diğer gezegenlerin toplamından ağır.",
			"image_url": "https://..."
		}
	]
}
```

## Test

```sh
pnpm typecheck && pnpm lint && pnpm test   # tipler, Biome, puanlama birim testi
pnpm test:e2e                               # çalışan bir sunucuya karşı tüm oyun (~1 dk)
E2E_URL=https://<site>.vercel.app pnpm test:e2e   # canlı siteye karşı
```

`test:e2e` gerçek Supabase projesini kullanır, ama kendi geçici host hesaplarını, quizini ve odasını oluşturup sonunda siler. Kontrol ettikleri:
- Tam oyun akışı.
- Puanlama ve sıra bonusu.
- Doğru cevabın erken sızmaması.
- Host'lar arası erişim yasağı ve oyuncu token'ının gizliliği.

## Vercel'e deploy

1. Vercel → Add New → Project → bu GitHub reposunu import et (framework: Next.js, ayarlar varsayılan).
2. **Deploy'dan önce** Environment Variables'a üç değişkeni ekle: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`. Build sırasında da gerekirler.
3. Deploy.

Sonrası otomatik:
- `main`'e her push canlıya deploy olur. Diğer dallar ayrı bir önizleme linki alır.
- Sorun çıkarsa Vercel panelinden önceki deploy'a tek tıkla dönülür.
- Fonksiyonlar `vercel.json` ile `dub1` (İrlanda) bölgesinde çalışır, Supabase projesinin yanında. Supabase projesi başka bölgedeyse bu ayarı ona göre değiştir. Yoksa her istek birkaç yüz ms yavaşlar.

## Proje yapısı

```
src/app/            sayfalar ve API route'ları
  api/games/        oyuncu: join, state, answer
  api/host/         host: quiz kaydet/sil, oda aç, oyun aksiyonları (giriş zorunlu)
  host/             panel, quiz editörü, projeksiyon ekranı
  play/[code]/      oyuncu ekranı
src/components/     ekranlar (host-screen, player-screen, game-views, quiz-editor)
src/lib/game.ts     oyun durumu, zamanlama, otomatik cevap gösterimi
src/lib/scoring.ts  puan hesabı
src/proxy.ts        oturum yenileme, /host koruması
supabase/migrations şema, RLS, view'lar, save_quiz fonksiyonu
scripts/            db-push, seed, e2e
```

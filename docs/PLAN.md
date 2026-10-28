# Vigiz — Canlı Quiz Night (plan)

## Context
Şirket içi aylık "quiz night" için Kahoot tarzı canlı quiz sitesi. 10–30 oyuncu, çoğu telefondan. Host ortam değişkenindeki tek şifreyle girer, quiz hazırlar ve oyunu yönetir. Oyuncular hesap açmadan oda linki + isimle katılır. Hedef: basit ve sağlam, gereksiz özellik yok.
`/Users/kilic/vigiz` boş; ayrı (monorepo dışı) bir Next.js projesi olacak.

## Senin yapman gerekenler (başlamadan)
1. github.com'da boş ve private bir `vigiz` reposu aç. README, .gitignore ve lisans ekleme. SSH URL'ini bana ver (`git@github.com:aliklc/vigiz.git` gibi).
2. supabase.com'da yeni bir proje aç (bölge: Frankfurt `eu-central-1`). Ardından Settings → API'den şu üç değeri al: Project URL, anon/publishable key, service_role/secret key. Bunları adım 1'in sonunda `.env.local`'e yazacağız. Repo ve iskelet için şimdilik gerekmiyor.
3. Bir admin şifresi belirle.
4. Vercel: adım 5'te lazım olacak, şimdilik bir şey yapman gerekmiyor.

## Git akışı
- `git init -b main`, `git remote add origin <URL>`, ardından `git push -u origin main`. gh CLI kullanılmıyor. İlk commit: plan + `.gitignore` + `.env.example`.
- Her adım (1–5) ve içindeki anlamlı parçalar ayrı commit olur. Her adımın sonunda push yapılır. `.env.local` asla commitlenmez.
- Paket yöneticisi pnpm. `engines.node >=22` (Vercel'in Node 22/24'üyle uyumlu; lokalde Node 26 var, sorun değil).

## vignetim-monorepo'dan alınanlar / alınmayanlar
**Kopyalanacak konvansiyonlar** (`apps/vignetim-web` ve `apps/vignetim-api`):
- Next 16 (App Router, Turbopack), React 19, TypeScript strict, `src/` yapısı, `@/*` alias (`apps/vignetim-web/tsconfig.json`)
- Tailwind v4 CSS-first: config dosyası yok, `@tailwindcss/postcss` + `globals.css` içinde `@import 'tailwindcss'` / `@theme inline` (`apps/vignetim-web/src/app/globals.css`, `postcss.config.mjs`)
- Next 16'da `middleware.ts` yerine `src/proxy.ts` (`apps/vignetim-web/src/proxy.ts`)
- shadcn/ui (new-york, neutral) + lucide; `cn()` helper (`apps/vignetim-web/src/lib/utils.ts`). Sadece button, input, card kullanılacak.
- Biome (tabs, width 100, tek tırnak) — `biome.json` monorepo kökünden kopyalanır; ESLint/Prettier yok
- DB isimlendirme (api'den): snake_case çoğul tablolar, uuid `id`, `created_at timestamptz`; migrations'lar elle yazılmış SQL
- `.env.example` stili: bölüm başlıkları, `NEXT_PUBLIC_*` uyarısı, sahte değerler (`apps/vignetim-web/.env.example`)

**Bilinçli olarak alınmayanlar:** monorepo'daki Postgres/RDS + socket.io + Redis + RabbitMQ + Infisical + ECS altyapısı. Kendi Postgres'i ve kendi Realtime'ı olan Supabase, ve Vercel bu işi tek başına karşılıyor. 30 kişilik bir oyun için ayrı websocket sunucusu çalıştırmaya gerek yok. next-intl de yok: tek dil Türkçe, metinler doğrudan JSX'te. Sentry, react-query ve zustand da yok.

## Mimari (tek cümle)
Oyunun tek doğruluk kaynağı `games` satırıdır. Tarayıcılar Supabase Realtime ile yalnızca `games` ve `players` değişikliklerini dinler. Değişiklik olunca `GET /api/games/[code]/state` çağrılır ve ekran buna göre çizilir. Soru ve cevap verisi tarayıcıya **sadece** bu API üzerinden, faza göre süzülerek gider.

## Veritabanı şeması (`supabase/migrations/20261028000000_init.sql`)
```
quizzes    id uuid pk, title, topic, author_name, quiz_date date,
           time_limit_sec int default 20, status text check in ('draft','ready'), created_at
questions  id uuid pk, quiz_id fk cascade, position int, text, image_url null,
           explanation null, choices text[] check (array_length between 2 and 5),
           correct_index int check (correct_index < array_length(choices))
games      id uuid pk, quiz_id fk, code text unique (6 karakter, 0/O/1/I yok),
           phase text check in ('lobby','question','reveal','leaderboard','finished'),
           current_index int default -1, question_started_at timestamptz null,
           paused_at timestamptz null, created_at, finished_at null
players    id uuid pk (istemcide üretilir, localStorage'da), game_id fk cascade,
           name text, kicked boolean default false, joined_at
           unique(game_id, lower(name))
answers    game_id, player_id fk, question_id fk, choice_index int, points int, answered_at
           primary key (player_id, question_id)   -- tek cevap kuralını DB garanti eder
```
- **RLS:** her tabloda RLS açık. anon için yalnızca `games` ve `players` üzerinde SELECT policy var (Realtime için gerekiyor). Bu iki tabloda gizli bilgi yok. Diğer her şeye yalnızca sunucudaki service-role key ile erişilir.
- `alter publication supabase_realtime add table games, players;`
- **View `game_scores`:** oyun başına oyuncu puanı, yani `sum(answers.points)`. Ayrı bir skor kolonu yok, böylece skorlar arasında tutarsızlık oluşamaz.
- **View `yearly_scores`:** biten oyunlarda `lower(trim(name))` bazında puan toplamı, yıla göre filtrelenir.

## Oyun durum akışı
```
lobby ──Başlat──▶ question(i) ──süre bitti / herkes cevapladı──▶ reveal(i)
                     ▲   │ duraklat/devam                         │ Sonraki
                     │                                            ▼
                     └────────Sonraki (soru varsa)──────────── leaderboard(i)
                                                                  │ Sonraki (son soruysa)
                                                                  ▼
                                                               finished
```
- **Zamanlama:** `deadline = question_started_at + time_limit`. State API `server_now` değerini de döndürür. İstemci bununla saat farkını düzeltir ve geri sayımı hesaplar.
- **Duraklatma:** `paused_at = now`. Devam edince `question_started_at += now - paused_at` yapılır ve `paused_at = null` olur. Duraklatılmışken gelen cevaplar reddedilir.
- **question → reveal geçişi tembel ve idempotent:** state ve answer route'ları "süre doldu mu ya da aktif oyuncuların hepsi cevapladı mı" diye bakar. Öyleyse koşullu bir update yapar: `update games set phase='reveal' where id=… and phase='question' and current_index=i`. Host ekranı açık olmasa da ilerler. İki istek aynı anda gelirse yalnızca biri geçer.
- **Faza göre state API çıktısı:**
  - `question`: soru metni, görsel ve şıklar gelir; `correct_index` gelmez.
  - `reveal`: ek olarak doğru şık, şık başına sayılar, açıklama ve oyuncunun kendi kazandığı puan gelir.
  - `leaderboard`: ilk 5 gelir.
  - `finished`: tam liste gelir (podyum bundan çizilir).

## Puanlama (`src/lib/scoring.ts`)
`points = correct ? 500 + Math.round(500 * remainingMs / limitMs) : 0`. `remainingMs` 0 ile limit arasında tutulur. Hesap sunucuda yapılır ve zaman olarak sunucu saati (`Date.now()`) kullanılır. `deadline` sonrası gelen cevap 409 ile reddedilir.
shortcut: ağ gecikmesi için tolerans yok. Son milisaniyede basan biri reddedilebilir. Şikâyet gelirse 300 ms tolerans eklenir.

## Sayfalar (`src/app`)
| Yol | İçerik |
|---|---|
| `/` | Oda kodu gir → `/play/[code]`; sıralama ve arşiv linkleri |
| `/play/[code]` | Oyuncu ekranı: isim → lobi → soru → reveal → ilk 5 → final. Tamamı tek client component, `phase`'e göre `switch` |
| `/host/login` | Şifre formu |
| `/host` | Quiz listesi (taslak/hazır) + "Oda aç" |
| `/host/quizzes/new`, `/host/quizzes/[id]` | Quiz editörü: meta alanlar + soru listesi (ekle, sil, ↑↓ ile sırala), "Taslak kaydet" / "Hazır" |
| `/host/games/[code]` | Host/projeksiyon ekranı: link + QR yerine büyük kod, oyuncu listesi (çıkar butonu), Başlat / Sonraki / Duraklat |
| `/leaderboard` | Yıllık sıralama + not: "Sunucu, sunduğu ayın quizinden puan almaz" |
| `/archive` | Biten oyunlar: konu, hazırlayan, tarih, kazanan |

## API route'ları (`src/app/api`)
- `POST /api/host/login` → `ADMIN_PASSWORD` kontrol edilir, httpOnly cookie verilir (HMAC, Web Crypto). `src/proxy.ts` `/host/*` ve `/api/host/*` yollarını bu cookie ile korur.
- `POST/PUT /api/host/quizzes[/id]`: quiz ve sorular birlikte kaydedilir. Kaydederken sorular silinip yeniden eklenir. zod ile doğrulanır.
- `POST /api/host/games` (quizId → code), `POST /api/host/games/[code]/action` ile `{start|next|pause|resume|kick, playerId?}`
- `POST /api/games/[code]/join` `{playerId, name}`: `playerId` oyunda zaten varsa o oyuncu döner (yeniden bağlanma). Çıkarılmış oyuncu ise 403.
- `GET /api/games/[code]/state?playerId=`: faza göre süzülmüş durum + `server_now` + oyuncunun bu soruya verdiği cevap
- `POST /api/games/[code]/answer` `{playerId, choiceIndex}`: PK çakışırsa "zaten cevapladın" döner. Süre kontrolü ve puan hesabı burada yapılır.

## Supabase istemcileri
`@supabase/supabase-js` yeterli. Kullanıcı oturumu olmadığı için `@supabase/ssr` gerekmiyor.
- `src/lib/supabase/browser.ts`: anon key; sadece Realtime için.
- `src/lib/supabase/admin.ts`: `import 'server-only'` + service role key; tüm okuma/yazma bununla.
- `src/hooks/use-game.ts`: kanala abone olur. Her değişiklikte, sayfaya dönüldüğünde (`visibilitychange`) ve geri sayım bittiğinde state'i yeniden çeker. Yeniden bağlanma da böylece kendiliğinden çalışır.

## Adımlar (her adım sonunda dur, test yolunu söyle)
1. **İskelet + şema + quiz editörü:** create-next-app, Tailwind v4, Biome, shadcn; migration; login + proxy; quiz CRUD; `seed/quiz.json` + `scripts/seed.mjs` (`node --env-file=.env.local scripts/seed.mjs`).
   *Test:* `npx supabase db push` (veya SQL editörü), seed'i çalıştır, `/host` → quizi gör/düzenle. Şifresiz `/host` → login'e yönlenmeli.
2. **Oda + lobi:** oda açma, join, Realtime oyuncu listesi, çıkarma, localStorage ile yeniden bağlanma.
   *Test:* host ekranı + 2 tarayıcı (biri gizli sekme). Sayfayı yenile → aynı oyuncu. Çıkar → oyuncu ekranı "çıkarıldınız" göstermeli.
3. **Oyun akışı + puanlama:** fazlar, geri sayım, cevap, reveal sayıları, ilk 5, final podyumu, duraklatma.
   *Test:* `node --test` ile `scoring.test.ts` çalıştırılır. Elle: DevTools Network'te soru fazında `correct_index` görünmemeli. Süre bitince cevap 409 dönmeli. Herkes cevaplayınca hemen reveal'a geçmeli.
4. **Sıralama + arşiv:** view'lar + 2 sayfa.
   *Test:* 2 oyun bitir, aynı isim farklı büyük/küçük harfle yazılsa bile toplamın birleştiğini kontrol et.
5. **README:** Supabase projesi açma, migration, Realtime publication, Vercel env'leri, seed JSON formatı.

## Ortam değişkenleri (`.env.example`)
```
# --- Public (tarayıcıya açık) ---
NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=dummy-anon-key
# --- Sunucu (asla NEXT_PUBLIC yapma) ---
SUPABASE_SECRET_KEY=dummy-service-role
ADMIN_PASSWORD=dummy-password
ADMIN_COOKIE_SECRET=dummy-random-32-chars
```

## Bilinçli olarak yapılmayanlar
QR kod, ses/animasyon, sürükle-bırak sıralama (↑↓ butonları yeterli), çoklu dil, Sentry, rate limiting, birden fazla eşzamanlı oyun için özel bir şey (kod bazlı olduğu için zaten çalışır).

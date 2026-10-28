#!/bin/sh
# Yeni migration'ları uzak Supabase veritabanına uygular (uygulanmışları atlar)
# ve TypeScript tiplerini yeniden üretir.
# Kullanım: pnpm db:push            (önce görmek için: pnpm db:push --dry-run)
set -e
set -a; . ./.env.local; set +a
supabase db push --db-url "$SUPABASE_DB_URL" "$@"
case "$*" in *--dry-run*) exit 0 ;; esac
supabase gen types typescript --db-url "$SUPABASE_DB_URL" > src/lib/supabase/types.ts
biome format --write src/lib/supabase/types.ts > /dev/null

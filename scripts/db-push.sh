#!/bin/sh
# Yeni migration'ları uzak Supabase veritabanına uygular (uygulanmışları atlar).
# Kullanım: pnpm db:push            (önce görmek için: pnpm db:push --dry-run)
set -e
set -a; . ./.env.local; set +a
exec supabase db push --db-url "$SUPABASE_DB_URL" "$@"

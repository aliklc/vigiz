-- Oyuncunun gizli anahtarı. players.id herkese açık (lobi listesi, Realtime);
-- cevap verme ve yeniden bağlanma sadece bu token ile yapılır. Tarayıcı bu tabloyu okuyamaz
-- (RLS açık, politika yok).
create table player_tokens (
	player_id uuid primary key references players (id) on delete cascade,
	token uuid not null unique default gen_random_uuid()
);
alter table player_tokens enable row level security;

insert into player_tokens (player_id) select id from players;

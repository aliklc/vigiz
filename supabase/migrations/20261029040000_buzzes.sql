-- Bulanık görsel (buzzer) basışları. Sıra buzzed_at'e göre; host sıradakine doğru/yanlış der.
-- Gizli bilgi yok (oyuncu id'leri zaten herkese açık); tarayıcı okuyabilir, Realtime ile dinlenir.
create table buzzes (
	game_id uuid not null references games (id) on delete cascade,
	question_id uuid not null references questions (id) on delete cascade,
	player_id uuid not null references players (id) on delete cascade,
	buzzed_at timestamptz not null default now(),
	points_if_correct int not null, -- basış anında hesaplanır: erken basan çok puan alır
	verdict text check (verdict in ('correct', 'wrong')),
	primary key (player_id, question_id) -- soru başına tek hak
);
create index buzzes_queue_idx on buzzes (game_id, question_id, buzzed_at);

alter table buzzes enable row level security;
create policy "anon buzzes okur" on buzzes for select to anon using (true);
alter publication supabase_realtime add table buzzes;

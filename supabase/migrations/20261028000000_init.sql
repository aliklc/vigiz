-- Vigiz şeması. Tarayıcı (anon) yalnızca games ve players'ı okuyabilir (Realtime için);
-- geri kalan her şeye sadece sunucu service-role key ile erişir.

create table quizzes (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	topic text not null,
	author_name text not null,
	quiz_date date not null,
	time_limit_sec int not null default 20 check (time_limit_sec between 5 and 120),
	status text not null default 'draft' check (status in ('draft', 'ready')),
	created_at timestamptz not null default now()
);

create table questions (
	id uuid primary key default gen_random_uuid(),
	quiz_id uuid not null references quizzes (id) on delete cascade,
	position int not null,
	text text not null,
	image_url text,
	explanation text,
	choices text[] not null check (array_length(choices, 1) between 2 and 5),
	correct_index int not null check (correct_index >= 0 and correct_index < array_length(choices, 1)),
	unique (quiz_id, position)
);

create table games (
	id uuid primary key default gen_random_uuid(),
	quiz_id uuid not null references quizzes (id), -- oynanmış quiz silinemez (arşiv korunur)
	code text not null unique,
	phase text not null default 'lobby'
		check (phase in ('lobby', 'question', 'reveal', 'leaderboard', 'finished')),
	current_index int not null default -1,
	question_started_at timestamptz,
	paused_at timestamptz,
	created_at timestamptz not null default now(),
	finished_at timestamptz
);

create table players (
	id uuid primary key,
	game_id uuid not null references games (id) on delete cascade,
	name text not null check (length(trim(name)) between 1 and 30),
	kicked boolean not null default false,
	joined_at timestamptz not null default now()
);
create unique index players_game_name_key on players (game_id, lower(trim(name)));

create table answers (
	game_id uuid not null references games (id) on delete cascade,
	player_id uuid not null references players (id) on delete cascade,
	question_id uuid not null references questions (id), -- cevaplanmış soru silinemez
	choice_index int not null,
	points int not null,
	answered_at timestamptz not null default now(),
	primary key (player_id, question_id)
);
create index answers_game_question_idx on answers (game_id, question_id);

-- Oyun içi puan: ayrı skor kolonu yok, cevaplardan hesaplanır.
create view game_scores with (security_invoker = true) as
select p.game_id, p.id as player_id, p.name, p.kicked, coalesce(sum(a.points), 0)::int as score
from players p
left join answers a on a.player_id = p.id
group by p.id;

-- Yıllık genel sıralama: biten oyunlar, isim bazında (büyük/küçük harf ve boşluk duyarsız).
create view yearly_scores with (security_invoker = true) as
select
	extract(year from g.finished_at)::int as year,
	lower(trim(p.name)) as name_key,
	max(trim(p.name)) as name,
	sum(coalesce(a.points, 0))::int as score,
	count(distinct g.id)::int as games_played
from players p
join games g on g.id = p.game_id and g.phase = 'finished'
left join answers a on a.player_id = p.id
where not p.kicked
group by 1, 2;

-- Quiz + soruları tek transaction'da kaydeder. Sorular silinip yeniden yazılır;
-- quiz daha önce oynandıysa (cevap varsa) sorular kilitlidir.
create function save_quiz(p_id uuid, p_quiz jsonb) returns uuid
language plpgsql as $$
declare
	v_id uuid := coalesce(p_id, gen_random_uuid());
begin
	insert into quizzes (id, title, topic, author_name, quiz_date, time_limit_sec, status)
	values (
		v_id, p_quiz->>'title', p_quiz->>'topic', p_quiz->>'author_name',
		(p_quiz->>'quiz_date')::date, (p_quiz->>'time_limit_sec')::int, p_quiz->>'status'
	)
	on conflict (id) do update set
		title = excluded.title, topic = excluded.topic, author_name = excluded.author_name,
		quiz_date = excluded.quiz_date, time_limit_sec = excluded.time_limit_sec,
		status = excluded.status;

	if exists (select 1 from answers a join questions q on q.id = a.question_id where q.quiz_id = v_id) then
		raise exception 'Bu quiz oynandı; soruları artık değiştirilemez' using errcode = 'P0001';
	end if;

	delete from questions where quiz_id = v_id;
	insert into questions (quiz_id, position, text, image_url, explanation, choices, correct_index)
	select v_id, (q.ord - 1)::int, q.val->>'text', nullif(q.val->>'image_url', ''),
		nullif(q.val->>'explanation', ''),
		array(select jsonb_array_elements_text(q.val->'choices')),
		(q.val->>'correct_index')::int
	from jsonb_array_elements(p_quiz->'questions') with ordinality as q(val, ord);

	return v_id;
end;
$$;
revoke execute on function save_quiz from public, anon, authenticated;

alter table quizzes enable row level security;
alter table questions enable row level security;
alter table games enable row level security;
alter table players enable row level security;
alter table answers enable row level security;

create policy "anon games okur" on games for select to anon using (true);
create policy "anon players okur" on players for select to anon using (true);

alter publication supabase_realtime add table games, players;

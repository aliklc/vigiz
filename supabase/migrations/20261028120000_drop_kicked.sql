-- Oyuncu çıkarma özelliği kaldırıldı.
drop view game_scores;
drop view yearly_scores;
alter table players drop column kicked;

create view game_scores with (security_invoker = true) as
select p.game_id, p.id as player_id, p.name, coalesce(sum(a.points), 0)::int as score
from players p
left join answers a on a.player_id = p.id
group by p.id;

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
group by 1, 2;

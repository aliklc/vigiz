-- Puan = answers.points (taban 500 + süre bonusu, cevap anında hesaplanır)
--      + sıra bonusu (doğru bilenler arasında ilk 200, son 0, aradakiler doğrusal).
-- Sıra bonusu saklanmaz, cevap zamanlarından hesaplanır: eşzamanlı cevaplarda yarış olmaz.
create view answer_points with (security_invoker = true) as
select
	a.*,
	a.points + case
		when a.points = 0 then 0
		when count(*) over correct = 1 then 200
		else round(
			200.0 * (count(*) over correct - rank() over (correct order by a.answered_at))
				/ (count(*) over correct - 1)
		)::int
	end as total
from answers a
window correct as (partition by a.game_id, a.question_id, a.points > 0);

drop view game_scores;
drop view yearly_scores;

create view game_scores with (security_invoker = true) as
select p.game_id, p.id as player_id, p.name, coalesce(sum(a.total), 0)::int as score
from players p
left join answer_points a on a.player_id = p.id
group by p.id;

create view yearly_scores with (security_invoker = true) as
select
	extract(year from g.finished_at)::int as year,
	lower(trim(p.name)) as name_key,
	max(trim(p.name)) as name,
	sum(coalesce(a.total, 0))::int as score,
	count(distinct g.id)::int as games_played
from players p
join games g on g.id = p.game_id and g.phase = 'finished'
left join answer_points a on a.player_id = p.id
group by 1, 2;

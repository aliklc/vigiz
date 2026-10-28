-- Soru formatları: choice (çoktan seçmeli), truefalse (doğru/yanlış), buzzer (bulanık görsel).
alter table questions add column answer_text text; -- buzzer: cevap ekranında gösterilen doğru cevap

-- Şık kuralları sadece şıklı formatlar için: önce mevcut check'leri kaldır.
do $$
declare r record;
begin
	for r in select conname from pg_constraint where conrelid = 'questions'::regclass and contype = 'c' loop
		execute format('alter table questions drop constraint %I', r.conname);
	end loop;
end $$;

alter table questions add column type text not null default 'choice'
	check (type in ('choice', 'truefalse', 'buzzer'));
alter table questions add constraint questions_choices_valid check (
	type = 'buzzer'
	or (array_length(choices, 1) between 2 and 5 and correct_index >= 0 and correct_index < array_length(choices, 1))
);

alter table answers alter column choice_index drop not null; -- buzzer cevabında şık yok

-- Puan: buzzer'da saklanan puan aynen (+ ya da −); şıklı formatlarda süre puanı + sıra bonusu.
-- Negatif ya da sıfır puan sıra bonusuna girmez.
create or replace view answer_points with (security_invoker = true) as
select
	a.*,
	a.points + case
		when q.type not in ('choice', 'truefalse') or a.points <= 0 then 0
		when count(*) over correct = 1 then 200
		else round(
			200.0 * (count(*) over correct - rank() over (correct order by a.answered_at))
				/ (count(*) over correct - 1)
		)::int
	end as total
from answers a
join questions q on q.id = a.question_id
window correct as (partition by a.game_id, a.question_id, a.points > 0);

create or replace function save_quiz(p_id uuid, p_owner uuid, p_quiz jsonb) returns uuid
language plpgsql as $$
declare
	v_id uuid;
	v_new jsonb;
	v_old jsonb;
begin
	if p_id is null then
		insert into quizzes (owner_id, title, topic, author_name, quiz_date, time_limit_sec, status)
		values (
			p_owner, p_quiz->>'title', p_quiz->>'topic', p_quiz->>'author_name',
			(p_quiz->>'quiz_date')::date, (p_quiz->>'time_limit_sec')::int, p_quiz->>'status'
		)
		returning id into v_id;
	else
		update quizzes set
			title = p_quiz->>'title', topic = p_quiz->>'topic', author_name = p_quiz->>'author_name',
			quiz_date = (p_quiz->>'quiz_date')::date,
			time_limit_sec = (p_quiz->>'time_limit_sec')::int, status = p_quiz->>'status'
		where id = p_id and owner_id = p_owner
		returning id into v_id;
		if v_id is null then
			raise exception 'Quiz bulunamadı' using errcode = 'P0002';
		end if;
	end if;

	if exists (select 1 from answers a join questions q on q.id = a.question_id where q.quiz_id = v_id) then
		select coalesce(jsonb_agg(jsonb_build_object(
			'text', q.val->>'text', 'image_url', nullif(q.val->>'image_url', ''),
			'explanation', nullif(q.val->>'explanation', ''), 'choices', q.val->'choices',
			'correct_index', (q.val->>'correct_index')::int,
			'type', coalesce(q.val->>'type', 'choice'), 'answer_text', nullif(q.val->>'answer_text', '')
		) order by q.ord), '[]')
		into v_new
		from jsonb_array_elements(p_quiz->'questions') with ordinality as q(val, ord);

		select coalesce(jsonb_agg(jsonb_build_object(
			'text', text, 'image_url', image_url, 'explanation', explanation,
			'choices', to_jsonb(choices), 'correct_index', correct_index,
			'type', type, 'answer_text', answer_text
		) order by position), '[]')
		into v_old
		from questions where quiz_id = v_id;

		if v_new is distinct from v_old then
			raise exception 'Bu quiz oynandı; soruları artık değiştirilemez (başlık, konu ve tarih değişebilir)'
				using errcode = 'P0001';
		end if;
		return v_id;
	end if;

	delete from questions where quiz_id = v_id;
	insert into questions
		(quiz_id, position, text, image_url, explanation, choices, correct_index, type, answer_text)
	select v_id, (q.ord - 1)::int, q.val->>'text', nullif(q.val->>'image_url', ''),
		nullif(q.val->>'explanation', ''),
		array(select jsonb_array_elements_text(coalesce(q.val->'choices', '[]'))),
		coalesce((q.val->>'correct_index')::int, 0),
		coalesce(q.val->>'type', 'choice'), nullif(q.val->>'answer_text', '')
	from jsonb_array_elements(p_quiz->'questions') with ordinality as q(val, ord);

	return v_id;
end;
$$;
revoke execute on function save_quiz from public, anon, authenticated;

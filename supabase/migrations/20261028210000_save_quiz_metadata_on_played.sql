-- Oynanmış quizde başlık/konu/tarih/süre düzenlenebilir; sadece sorular kilitli
-- (değişmedilerse kayıt geçer, değiştilerse reddedilir).
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
			'correct_index', (q.val->>'correct_index')::int
		) order by q.ord), '[]')
		into v_new
		from jsonb_array_elements(p_quiz->'questions') with ordinality as q(val, ord);

		select coalesce(jsonb_agg(jsonb_build_object(
			'text', text, 'image_url', image_url, 'explanation', explanation,
			'choices', to_jsonb(choices), 'correct_index', correct_index
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

-- Oynanmış quiz de düzenlenebilir. Sorular silinip yeniden yazılmaz: id'si gelen sorular yerinde
-- güncellenir (cevapları ve puanları korunur), id'siz olanlar eklenir, listede olmayanlar silinir.
create or replace function save_quiz(p_id uuid, p_owner uuid, p_quiz jsonb) returns uuid
language plpgsql as $$
declare
	v_id uuid;
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

	create temp table incoming on commit drop as
	select (q.ord - 1)::int as position,
		nullif(q.val->>'id', '')::uuid as id,
		q.val->>'text' as text,
		nullif(q.val->>'image_url', '') as image_url,
		nullif(q.val->>'explanation', '') as explanation,
		array(select jsonb_array_elements_text(q.val->'choices')) as choices,
		(q.val->>'correct_index')::int as correct_index
	from jsonb_array_elements(p_quiz->'questions') with ordinality as q(val, ord);

	-- Listeden çıkarılan sorular (ve cevapları) silinir.
	delete from questions t
	where t.quiz_id = v_id and not exists (select 1 from incoming i where i.id = t.id);

	-- unique(quiz_id, position) sıra değişiminde çakışmasın diye önce sıraları geçici olarak negatife al.
	update questions set position = -1 - position where quiz_id = v_id;

	update questions t set
		position = i.position, text = i.text, image_url = i.image_url,
		explanation = i.explanation, choices = i.choices, correct_index = i.correct_index
	from incoming i
	where t.quiz_id = v_id and t.id = i.id;

	-- id'si olmayan ya da bu quize ait olmayan (başka quizin id'si) sorular yeni eklenir.
	insert into questions (quiz_id, position, text, image_url, explanation, choices, correct_index)
	select v_id, i.position, i.text, i.image_url, i.explanation, i.choices, i.correct_index
	from incoming i
	where not exists (select 1 from questions t where t.quiz_id = v_id and t.id = i.id);

	return v_id;
end;
$$;
revoke execute on function save_quiz from public, anon, authenticated;

-- Her host kendi hesabıyla giriş yapar ve sadece kendi quizlerini görür.
-- Sahipsiz test verisi temizlenir (kullanıcı onayıyla).
delete from answers;
delete from players;
delete from games;
delete from questions;
delete from quizzes;

alter table quizzes
	add column owner_id uuid not null references auth.users (id) on delete cascade;
create index quizzes_owner_idx on quizzes (owner_id);

-- Oyunlar quiz üzerinden sahibine bağlı; host silinince oyunları da gider.
alter table games drop constraint games_quiz_id_fkey;
alter table games add constraint games_quiz_id_fkey
	foreign key (quiz_id) references quizzes (id) on delete cascade;
-- Oyun silinince cevaplar zaten cascade; soru silinince (quiz cascade'i) cevaplar da gitsin.
alter table answers drop constraint answers_question_id_fkey;
alter table answers add constraint answers_question_id_fkey
	foreign key (question_id) references questions (id) on delete cascade;

drop function save_quiz(uuid, jsonb);

-- Quiz + soruları tek transaction'da kaydeder. Güncelleme sadece quizin sahibi için çalışır.
-- Quiz daha önce oynandıysa (cevap varsa) sorular kilitlidir.
create function save_quiz(p_id uuid, p_owner uuid, p_quiz jsonb) returns uuid
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

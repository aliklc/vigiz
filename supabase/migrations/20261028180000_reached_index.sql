-- Oyunda sorulmuş en ileri soru. Host geri gidip tekrar ilerlediğinde bu indekse kadarki
-- sorular yeniden sorulmaz, sonuçları gösterilir.
alter table games add column reached_index int not null default -1;
update games set reached_index = current_index;

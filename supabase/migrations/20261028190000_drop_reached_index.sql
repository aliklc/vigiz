-- "Önceki soru" sadece host ekranında bir görüntüleme oldu; oyun durumunu değiştirmiyor.
alter table games drop column reached_index;

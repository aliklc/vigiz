-- Soru görselleri. Herkese açık okunur (görsel zaten soruyla birlikte oyunculara gösterilir);
-- yazma politikası yok: yükleme sadece sunucudan, secret key ile (/api/host/uploads).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'question-images',
	'question-images',
	true,
	4194304, -- 4 MB (Vercel fonksiyon gövde sınırı ~4.5 MB)
	array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

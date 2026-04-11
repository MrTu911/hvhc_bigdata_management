-- Migration: add_pgvector_embedding
--
-- Yêu cầu DBA (superuser) chạy trước:
--   CREATE EXTENSION IF NOT EXISTS vector;
--
-- Migration này tự phát hiện extension đã cài chưa.
-- Nếu chưa cài → bỏ qua (NOTICE), các column vector sẽ không tồn tại.
-- Nếu đã cài   → tạo column bình thường.
--
-- Sau khi DBA cài xong:
--   psql -U postgres -d hvhc_bigdata_89 -c "CREATE EXTENSION IF NOT EXISTS vector;"
-- Rồi chạy thủ công:
--   ALTER TABLE "nckh_projects"     ADD COLUMN IF NOT EXISTS "embedding"          vector(1536);
--   ALTER TABLE "scientific_works"  ADD COLUMN IF NOT EXISTS "abstractEmbedding"  vector(1536);
--   ALTER TABLE "library_items"     ADD COLUMN IF NOT EXISTS "textEmbedding"      vector(1536);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    ALTER TABLE "nckh_projects"
      ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

    ALTER TABLE "scientific_works"
      ADD COLUMN IF NOT EXISTS "abstractEmbedding" vector(1536);

    ALTER TABLE "library_items"
      ADD COLUMN IF NOT EXISTS "textEmbedding" vector(1536);

    RAISE NOTICE 'pgvector columns added successfully.';
  ELSE
    RAISE NOTICE 'pgvector extension not installed — embedding columns skipped. Install extension as superuser then add columns manually.';
  END IF;
END $$;

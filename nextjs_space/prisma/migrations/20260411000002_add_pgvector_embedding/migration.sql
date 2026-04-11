-- Migration: add_pgvector_embedding
-- Yêu cầu: postgresql-16-pgvector phải được cài trước khi chạy migration này.
--   sudo apt-get install -y postgresql-16-pgvector
--
-- Sau khi cài xong, chạy:
--   npx prisma migrate deploy
--
-- Ba embedding columns:
--   1. nckh_projects.embedding          – embedding đề tài (title + abstract)
--   2. scientific_works.abstractEmbedding – embedding tóm tắt công trình
--   3. library_items.textEmbedding       – embedding full-text tài liệu (sau indexing)

-- ─── Bật extension pgvector ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── NckhProject: embedding đề tài ──────────────────────────────────────────
ALTER TABLE "nckh_projects"
  ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

-- IVFFlat index cho ANN search trên đề tài (lists = sqrt(rows_estimate))
-- Bật sau khi backfill xong: CREATE INDEX CONCURRENTLY ...
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS "nckh_projects_embedding_ivfflat_idx"
--   ON "nckh_projects" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

-- ─── ScientificWork: abstractEmbedding ──────────────────────────────────────
ALTER TABLE "scientific_works"
  ADD COLUMN IF NOT EXISTS "abstractEmbedding" vector(1536);

-- ─── LibraryItem: textEmbedding ──────────────────────────────────────────────
ALTER TABLE "library_items"
  ADD COLUMN IF NOT EXISTS "textEmbedding" vector(1536);

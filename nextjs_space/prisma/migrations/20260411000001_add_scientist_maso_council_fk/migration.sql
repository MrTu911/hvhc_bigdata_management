-- Migration: add_scientist_maso_council_fk
-- [9]  Thêm maso (mã số cán bộ) vào NckhScientistProfile – dual-write, nullable
-- [10] Thêm scientistId FK tường minh vào ScientificCouncilMember → NckhScientistProfile

-- ─── [9] maso field on nckh_scientist_profiles ────────────────────────────────

ALTER TABLE "nckh_scientist_profiles"
  ADD COLUMN IF NOT EXISTS "maso" VARCHAR(255);

-- Nullable UNIQUE: PostgreSQL cho phép nhiều NULL trong unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "nckh_scientist_profiles_maso_key"
  ON "nckh_scientist_profiles" ("maso")
  WHERE "maso" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "nckh_scientist_profiles_maso_idx"
  ON "nckh_scientist_profiles" ("maso");

-- ─── [10] scientistId FK on scientific_council_members ───────────────────────

ALTER TABLE "scientific_council_members"
  ADD COLUMN IF NOT EXISTS "scientistId" VARCHAR(255);

ALTER TABLE "scientific_council_members"
  ADD CONSTRAINT "scientific_council_members_scientistId_fkey"
  FOREIGN KEY ("scientistId")
  REFERENCES "nckh_scientist_profiles" ("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE
  NOT VALID; -- NOT VALID: áp dụng cho row mới, không block table đối với dữ liệu cũ

CREATE INDEX IF NOT EXISTS "scientific_council_members_scientistId_idx"
  ON "scientific_council_members" ("scientistId");

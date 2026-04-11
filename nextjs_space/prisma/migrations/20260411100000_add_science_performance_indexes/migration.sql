-- Migration: add_science_performance_indexes
-- Sprint 13 – additive indexes only, no data loss, no downtime risk.

-- nckh_projects: deadline alert queries + sensitivity-guarded list
CREATE INDEX IF NOT EXISTS "nckh_projects_endDate_idx"      ON "nckh_projects" ("endDate");
CREATE INDEX IF NOT EXISTS "nckh_projects_sensitivity_idx"  ON "nckh_projects" ("sensitivity");

-- nckh_scientist_profiles: sensitivity-guarded list
CREATE INDEX IF NOT EXISTS "nckh_scientist_profiles_sensitivityLevel_idx" ON "nckh_scientist_profiles" ("sensitivityLevel");

-- scientific_works: download permission filter
CREATE INDEX IF NOT EXISTS "scientific_works_sensitivity_isDeleted_idx" ON "scientific_works" ("sensitivity", "isDeleted");

-- library_items: worker picks up pending index jobs
CREATE INDEX IF NOT EXISTS "library_items_isIndexed_isDeleted_idx" ON "library_items" ("isIndexed", "isDeleted");

-- scientific_councils: filter by result (PASS/FAIL/REVISE)
CREATE INDEX IF NOT EXISTS "scientific_councils_result_idx" ON "scientific_councils" ("result");

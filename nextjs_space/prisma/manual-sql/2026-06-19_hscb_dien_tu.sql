-- Surgical migration: Hồ sơ cán bộ điện tử (mẫu 99 trường) — M02 ext
-- Chỉ chứa thay đổi additive của tính năng này; KHÔNG đụng tới drift sẵn có
-- (notification_history, rank_declarations.promotionType, maso, personal_update_requests...).
-- Generated from prisma migrate diff, đã lọc bỏ statement phá dữ liệu.
BEGIN;

-- ===== Enums =====
-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('DAT', 'NHA', 'O_TO', 'TAI_SAN_KHAC');

-- CreateEnum
CREATE TYPE "EvaluationPeriodType" AS ENUM ('QUY', 'NAM');

-- CreateEnum
CREATE TYPE "CommandMgmtLevel" AS ENUM ('SO_CAP', 'TRUNG_CAP', 'CAO_CAP');

-- CreateEnum
CREATE TYPE "PoliticalTheoryLevel" AS ENUM ('SO_CAP', 'TRUNG_CAP', 'CAO_CAP', 'CU_NHAN');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('DOC_THAN', 'KET_HON', 'LY_HON', 'GOA');

-- ===== Extend family_relations (89) =====
-- AlterTable
ALTER TABLE "family_relations" ADD COLUMN     "hometownOld" TEXT,
ADD COLUMN     "isPartyMember" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSeniorOfficial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "partyPosition" TEXT,
ADD COLUMN     "politicalNote" TEXT,
ADD COLUMN     "residenceNew" TEXT;
-- ===== Extend personnel (26,27) =====
-- AlterTable
ALTER TABLE "personnel" ADD COLUMN     "currentResidenceAdminId" TEXT,
ADD COLUMN     "permanentAddressAdminId" TEXT;
-- ===== Extend users (scalars mẫu 99 trường) =====
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "academicDegreeId" VARCHAR(10),
ADD COLUMN     "academicTitleDate" TIMESTAMP(3),
ADD COLUMN     "academicTitleId" VARCHAR(10),
ADD COLUMN     "aliasName" TEXT,
ADD COLUMN     "cadreType" TEXT,
ADD COLUMN     "chronicDisease" TEXT,
ADD COLUMN     "commandMgmtLevel" "CommandMgmtLevel",
ADD COLUMN     "commandMgmtLevelDate" TIMESTAMP(3),
ADD COLUMN     "currentMainWork" TEXT,
ADD COLUMN     "currentSector" TEXT,
ADD COLUMN     "disabilityDetail" TEXT,
ADD COLUMN     "disabilityStatus" TEXT,
ADD COLUMN     "dischargeUnit" TEXT,
ADD COLUMN     "enlistmentUnit" TEXT,
ADD COLUMN     "entrySource" TEXT,
ADD COLUMN     "familyBackgroundId" VARCHAR(20),
ADD COLUMN     "generalEducationLevel" TEXT,
ADD COLUMN     "headcountIncreaseDate" TIMESTAMP(3),
ADD COLUMN     "headcountIncreaseReason" TEXT,
ADD COLUMN     "healthGrade" TEXT,
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "identifyingMarks" TEXT,
ADD COLUMN     "isCorrectPosition" BOOLEAN,
ADD COLUMN     "longestWork" TEXT,
ADD COLUMN     "maritalStatus" "MaritalStatus",
ADD COLUMN     "partyJoinPlace" TEXT,
ADD COLUMN     "partyOfficialPlace" TEXT,
ADD COLUMN     "personalBackgroundId" VARCHAR(20),
ADD COLUMN     "personalHobby" TEXT,
ADD COLUMN     "personalStrength" TEXT,
ADD COLUMN     "politicalTheoryDate" TIMESTAMP(3),
ADD COLUMN     "politicalTheoryLevel" "PoliticalTheoryLevel",
ADD COLUMN     "positionAllowanceCoeff" DECIMAL(6,2),
ADD COLUMN     "recommenderPartyPosition" TEXT,
ADD COLUMN     "recruitmentDate" TIMESTAMP(3),
ADD COLUMN     "recruitmentUnit" TEXT,
ADD COLUMN     "reenlistmentDate" TIMESTAMP(3),
ADD COLUMN     "reenlistmentUnit" TEXT,
ADD COLUMN     "revolutionJoinDate" TIMESTAMP(3),
ADD COLUMN     "salaryAmount" DECIMAL(18,2),
ADD COLUMN     "salaryCoefficient" DECIMAL(6,2),
ADD COLUMN     "salaryRaiseCount" INTEGER,
ADD COLUMN     "salaryRaiseDate" TIMESTAMP(3),
ADD COLUMN     "warMartyrFamily" TEXT,
ADD COLUMN     "weight" DOUBLE PRECISION,
ADD COLUMN     "workStrength" TEXT;
-- ===== Create 12 new tables =====
-- CreateTable
CREATE TABLE "youth_union_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "joinDate" TIMESTAMP(3),
    "joinPlace" TEXT,
    "currentPosition" TEXT,
    "leftDate" TIMESTAMP(3),
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "youth_union_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youth_union_position_histories" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "position" TEXT NOT NULL,
    "organization" TEXT,
    "fromDate" TIMESTAMP(3),
    "toDate" TIMESTAMP(3),
    "decisionNumber" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "youth_union_position_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_declarations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "assetType" "AssetType" NOT NULL,
    "declaredDate" TIMESTAMP(3),
    "assetName" TEXT NOT NULL,
    "area" TEXT,
    "value" DECIMAL(18,2),
    "documentRef" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_declarations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foreign_trips" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "fromDate" TIMESTAMP(3),
    "toDate" TIMESTAMP(3),
    "country" TEXT NOT NULL,
    "purpose" TEXT,
    "sponsor" TEXT,
    "decisionNumber" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foreign_trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "honor_title_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "meritTitleId" VARCHAR(30),
    "titleName" TEXT NOT NULL,
    "level" TEXT,
    "awardYear" INTEGER,
    "decisionNumber" TEXT,
    "awardedBy" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "honor_title_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combat_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "fromDate" TIMESTAMP(3),
    "toDate" TIMESTAMP(3),
    "battlefield" TEXT,
    "unit" TEXT,
    "role" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combat_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel_evaluations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "periodType" "EvaluationPeriodType" NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodQuarter" INTEGER,
    "taskResultRankId" VARCHAR(20),
    "taskResultLabel" TEXT,
    "partyMemberRank" TEXT,
    "decisionNumber" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personnel_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allowance_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "allowanceTypeId" VARCHAR(30),
    "allowanceLabel" TEXT,
    "fromDate" TIMESTAMP(3),
    "toDate" TIMESTAMP(3),
    "coefficient" DECIMAL(6,2),
    "reason" TEXT,
    "decisionNumber" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allowance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concurrent_positions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "positionTitle" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3),
    "toDate" TIMESTAMP(3),
    "unit" TEXT,
    "detail" TEXT,
    "decisionNumber" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concurrent_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_title_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "titleName" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "decisionNumber" TEXT,
    "issuer" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_title_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ethnic_languages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "language" TEXT NOT NULL,
    "proficiency" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ethnic_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_positions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "positionTitle" TEXT NOT NULL,
    "organization" TEXT,
    "fromDate" TIMESTAMP(3),
    "toDate" TIMESTAMP(3),
    "decisionNumber" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_positions_pkey" PRIMARY KEY ("id")
);
-- ===== Indexes =====
-- CreateIndex
CREATE UNIQUE INDEX "youth_union_memberships_userId_key" ON "youth_union_memberships"("userId");

-- CreateIndex
CREATE INDEX "youth_union_memberships_userId_idx" ON "youth_union_memberships"("userId");

-- CreateIndex
CREATE INDEX "youth_union_memberships_personnelId_idx" ON "youth_union_memberships"("personnelId");

-- CreateIndex
CREATE INDEX "youth_union_memberships_deletedAt_idx" ON "youth_union_memberships"("deletedAt");

-- CreateIndex
CREATE INDEX "youth_union_position_histories_membershipId_idx" ON "youth_union_position_histories"("membershipId");

-- CreateIndex
CREATE INDEX "youth_union_position_histories_userId_idx" ON "youth_union_position_histories"("userId");

-- CreateIndex
CREATE INDEX "youth_union_position_histories_personnelId_idx" ON "youth_union_position_histories"("personnelId");

-- CreateIndex
CREATE INDEX "asset_declarations_userId_idx" ON "asset_declarations"("userId");

-- CreateIndex
CREATE INDEX "asset_declarations_personnelId_idx" ON "asset_declarations"("personnelId");

-- CreateIndex
CREATE INDEX "asset_declarations_assetType_idx" ON "asset_declarations"("assetType");

-- CreateIndex
CREATE INDEX "asset_declarations_deletedAt_idx" ON "asset_declarations"("deletedAt");

-- CreateIndex
CREATE INDEX "foreign_trips_userId_idx" ON "foreign_trips"("userId");

-- CreateIndex
CREATE INDEX "foreign_trips_personnelId_idx" ON "foreign_trips"("personnelId");

-- CreateIndex
CREATE INDEX "foreign_trips_deletedAt_idx" ON "foreign_trips"("deletedAt");

-- CreateIndex
CREATE INDEX "honor_title_records_userId_idx" ON "honor_title_records"("userId");

-- CreateIndex
CREATE INDEX "honor_title_records_personnelId_idx" ON "honor_title_records"("personnelId");

-- CreateIndex
CREATE INDEX "honor_title_records_meritTitleId_idx" ON "honor_title_records"("meritTitleId");

-- CreateIndex
CREATE INDEX "honor_title_records_deletedAt_idx" ON "honor_title_records"("deletedAt");

-- CreateIndex
CREATE INDEX "combat_histories_userId_idx" ON "combat_histories"("userId");

-- CreateIndex
CREATE INDEX "combat_histories_personnelId_idx" ON "combat_histories"("personnelId");

-- CreateIndex
CREATE INDEX "combat_histories_deletedAt_idx" ON "combat_histories"("deletedAt");

-- CreateIndex
CREATE INDEX "personnel_evaluations_userId_idx" ON "personnel_evaluations"("userId");

-- CreateIndex
CREATE INDEX "personnel_evaluations_personnelId_idx" ON "personnel_evaluations"("personnelId");

-- CreateIndex
CREATE INDEX "personnel_evaluations_periodYear_idx" ON "personnel_evaluations"("periodYear");

-- CreateIndex
CREATE INDEX "personnel_evaluations_deletedAt_idx" ON "personnel_evaluations"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "personnel_evaluations_userId_periodType_periodYear_periodQu_key" ON "personnel_evaluations"("userId", "periodType", "periodYear", "periodQuarter");

-- CreateIndex
CREATE INDEX "allowance_records_userId_idx" ON "allowance_records"("userId");

-- CreateIndex
CREATE INDEX "allowance_records_personnelId_idx" ON "allowance_records"("personnelId");

-- CreateIndex
CREATE INDEX "allowance_records_allowanceTypeId_idx" ON "allowance_records"("allowanceTypeId");

-- CreateIndex
CREATE INDEX "allowance_records_deletedAt_idx" ON "allowance_records"("deletedAt");

-- CreateIndex
CREATE INDEX "concurrent_positions_userId_idx" ON "concurrent_positions"("userId");

-- CreateIndex
CREATE INDEX "concurrent_positions_personnelId_idx" ON "concurrent_positions"("personnelId");

-- CreateIndex
CREATE INDEX "concurrent_positions_deletedAt_idx" ON "concurrent_positions"("deletedAt");

-- CreateIndex
CREATE INDEX "professional_title_records_userId_idx" ON "professional_title_records"("userId");

-- CreateIndex
CREATE INDEX "professional_title_records_personnelId_idx" ON "professional_title_records"("personnelId");

-- CreateIndex
CREATE INDEX "professional_title_records_deletedAt_idx" ON "professional_title_records"("deletedAt");

-- CreateIndex
CREATE INDEX "ethnic_languages_userId_idx" ON "ethnic_languages"("userId");

-- CreateIndex
CREATE INDEX "ethnic_languages_personnelId_idx" ON "ethnic_languages"("personnelId");

-- CreateIndex
CREATE INDEX "ethnic_languages_deletedAt_idx" ON "ethnic_languages"("deletedAt");

-- CreateIndex
CREATE INDEX "external_positions_userId_idx" ON "external_positions"("userId");

-- CreateIndex
CREATE INDEX "external_positions_personnelId_idx" ON "external_positions"("personnelId");

-- CreateIndex
CREATE INDEX "external_positions_deletedAt_idx" ON "external_positions"("deletedAt");
-- ===== Foreign keys (users catalog) =====
ALTER TABLE "users" ADD CONSTRAINT "users_academicTitleId_fkey" FOREIGN KEY ("academicTitleId") REFERENCES "academic_titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_academicDegreeId_fkey" FOREIGN KEY ("academicDegreeId") REFERENCES "academic_degrees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_familyBackgroundId_fkey" FOREIGN KEY ("familyBackgroundId") REFERENCES "family_backgrounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_personalBackgroundId_fkey" FOREIGN KEY ("personalBackgroundId") REFERENCES "family_backgrounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- ===== Foreign keys (new tables + personnel admin units) =====
ALTER TABLE "youth_union_memberships" ADD CONSTRAINT "youth_union_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "youth_union_memberships" ADD CONSTRAINT "youth_union_memberships_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "youth_union_position_histories" ADD CONSTRAINT "youth_union_position_histories_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "youth_union_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "youth_union_position_histories" ADD CONSTRAINT "youth_union_position_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "youth_union_position_histories" ADD CONSTRAINT "youth_union_position_histories_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_declarations" ADD CONSTRAINT "asset_declarations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_declarations" ADD CONSTRAINT "asset_declarations_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foreign_trips" ADD CONSTRAINT "foreign_trips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foreign_trips" ADD CONSTRAINT "foreign_trips_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "honor_title_records" ADD CONSTRAINT "honor_title_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "honor_title_records" ADD CONSTRAINT "honor_title_records_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "honor_title_records" ADD CONSTRAINT "honor_title_records_meritTitleId_fkey" FOREIGN KEY ("meritTitleId") REFERENCES "merit_titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_histories" ADD CONSTRAINT "combat_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_histories" ADD CONSTRAINT "combat_histories_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_evaluations" ADD CONSTRAINT "personnel_evaluations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_evaluations" ADD CONSTRAINT "personnel_evaluations_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_evaluations" ADD CONSTRAINT "personnel_evaluations_taskResultRankId_fkey" FOREIGN KEY ("taskResultRankId") REFERENCES "annual_evaluation_ranks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allowance_records" ADD CONSTRAINT "allowance_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allowance_records" ADD CONSTRAINT "allowance_records_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allowance_records" ADD CONSTRAINT "allowance_records_allowanceTypeId_fkey" FOREIGN KEY ("allowanceTypeId") REFERENCES "allowance_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concurrent_positions" ADD CONSTRAINT "concurrent_positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concurrent_positions" ADD CONSTRAINT "concurrent_positions_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_title_records" ADD CONSTRAINT "professional_title_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_title_records" ADD CONSTRAINT "professional_title_records_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ethnic_languages" ADD CONSTRAINT "ethnic_languages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ethnic_languages" ADD CONSTRAINT "ethnic_languages_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_positions" ADD CONSTRAINT "external_positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_positions" ADD CONSTRAINT "external_positions_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_permanentAddressAdminId_fkey" FOREIGN KEY ("permanentAddressAdminId") REFERENCES "administrative_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_currentResidenceAdminId_fkey" FOREIGN KEY ("currentResidenceAdminId") REFERENCES "administrative_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;

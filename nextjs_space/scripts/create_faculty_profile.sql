-- Create faculty_profiles table
CREATE TABLE IF NOT EXISTS "faculty_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT,
    
    -- Academic Information
    "academicRank" TEXT,
    "academicDegree" TEXT,
    "specialization" TEXT,
    "teachingSubjects" JSONB,
    
    -- Research
    "researchInterests" TEXT,
    "researchProjects" INTEGER NOT NULL DEFAULT 0,
    "publications" INTEGER NOT NULL DEFAULT 0,
    "citations" INTEGER NOT NULL DEFAULT 0,
    
    -- Experience
    "teachingExperience" INTEGER NOT NULL DEFAULT 0,
    "industryExperience" INTEGER NOT NULL DEFAULT 0,
    
    -- Profile
    "biography" TEXT,
    "achievements" JSONB,
    "certifications" JSONB,
    
    -- Social & Contact
    "linkedinUrl" TEXT,
    "googleScholarUrl" TEXT,
    "researchGateUrl" TEXT,
    "orcidId" TEXT,
    
    -- Status
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "faculty_profiles_userId_key" UNIQUE ("userId")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "faculty_profiles_userId_idx" ON "faculty_profiles"("userId");
CREATE INDEX IF NOT EXISTS "faculty_profiles_departmentId_idx" ON "faculty_profiles"("departmentId");
CREATE INDEX IF NOT EXISTS "faculty_profiles_academicRank_idx" ON "faculty_profiles"("academicRank");
CREATE INDEX IF NOT EXISTS "faculty_profiles_academicDegree_idx" ON "faculty_profiles"("academicDegree");

-- Add foreign key constraints
ALTER TABLE "faculty_profiles" 
  DROP CONSTRAINT IF EXISTS "faculty_profiles_userId_fkey",
  ADD CONSTRAINT "faculty_profiles_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "faculty_profiles" 
  DROP CONSTRAINT IF EXISTS "faculty_profiles_departmentId_fkey",
  ADD CONSTRAINT "faculty_profiles_departmentId_fkey" 
  FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Comment
COMMENT ON TABLE "faculty_profiles" IS 'Hồ sơ Giảng viên - Faculty Profile management for HVHC';

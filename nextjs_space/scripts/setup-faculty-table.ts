import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating faculty_profiles table...');
    
    // Create table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "faculty_profiles" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "departmentId" TEXT,
        
        "academicRank" TEXT,
        "academicDegree" TEXT,
        "specialization" TEXT,
        "teachingSubjects" JSONB,
        
        "researchInterests" TEXT,
        "researchProjects" INTEGER NOT NULL DEFAULT 0,
        "publications" INTEGER NOT NULL DEFAULT 0,
        "citations" INTEGER NOT NULL DEFAULT 0,
        
        "teachingExperience" INTEGER NOT NULL DEFAULT 0,
        "industryExperience" INTEGER NOT NULL DEFAULT 0,
        
        "biography" TEXT,
        "achievements" JSONB,
        "certifications" JSONB,
        
        "linkedinUrl" TEXT,
        "googleScholarUrl" TEXT,
        "researchGateUrl" TEXT,
        "orcidId" TEXT,
        
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isPublic" BOOLEAN NOT NULL DEFAULT false,
        
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "faculty_profiles_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "faculty_profiles_userId_key" UNIQUE ("userId")
      )
    `;
    console.log('✓ Table created');
    
    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "faculty_profiles_userId_idx" ON "faculty_profiles"("userId")
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "faculty_profiles_departmentId_idx" ON "faculty_profiles"("departmentId")
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "faculty_profiles_academicRank_idx" ON "faculty_profiles"("academicRank")
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "faculty_profiles_academicDegree_idx" ON "faculty_profiles"("academicDegree")
    `;
    console.log('✓ Indexes created');
    
    // Add foreign keys
    try {
      await prisma.$executeRaw`
        ALTER TABLE "faculty_profiles" 
        ADD CONSTRAINT "faculty_profiles_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `;
      console.log('✓ Foreign key to users created');
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        console.warn('FK users warning:', e.message.substring(0, 80));
      }
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "faculty_profiles" 
        ADD CONSTRAINT "faculty_profiles_departmentId_fkey" 
        FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE
      `;
      console.log('✓ Foreign key to departments created');
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        console.warn('FK departments warning:', e.message.substring(0, 80));
      }
    }
    
    console.log('✓ faculty_profiles table setup completed!');
    
    // Verify
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM faculty_profiles
    ` as any[];
    
    console.log('✓ Table verified, count:', result[0].count);
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('✓ Table already exists, skipping creation');
    } else {
      console.error('Error:', error.message);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();

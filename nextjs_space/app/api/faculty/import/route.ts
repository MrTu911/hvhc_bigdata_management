/**
 * API: Import Faculty from Excel
 * 
 * v8.3: Migrated to Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';

interface ImportRow {
  name: string;
  email: string;
  militaryId?: string;
  password?: string;
  department?: string;
  academicRank?: string;
  academicDegree?: string;
  specialization?: string;
  teachingExperience?: number;
  industryExperience?: number;
  researchProjects?: number;
  publications?: number;
  citations?: number;
}

interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
  details: Array<{
    row: number;
    name: string;
    email: string;
    status: 'success' | 'error' | 'skipped';
    message: string;
  }>;
}

// POST: Import faculty from Excel file
export async function POST(req: NextRequest) {
  // RBAC Check: IMPORT_FACULTY
  const authResult = await requireFunction(req, FACULTY.IMPORT);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read Excel file
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    const result: ImportResult = {
      success: true,
      total: data.length,
      imported: 0,
      skipped: 0,
      errors: [],
      details: []
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have header row

      try {
        // Validate required fields
        if (!row['Ho ten'] || !row['Email']) {
          result.details.push({
            row: rowNumber,
            name: row['Ho ten'] || 'N/A',
            email: row['Email'] || 'N/A',
            status: 'error',
            message: 'Thiếu họ tên hoặc email'
          });
          result.skipped++;
          result.errors.push(`Dòng ${rowNumber}: Thiếu họ tên hoặc email`);
          continue;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: row['Email'] }
        });

        if (existingUser) {
          result.details.push({
            row: rowNumber,
            name: row['Ho ten'],
            email: row['Email'],
            status: 'skipped',
            message: 'Email đã tồn tại trong hệ thống'
          });
          result.skipped++;
          continue;
        }

        // Find or create department
        let departmentId: string | undefined;
        if (row['Khoa/Phong']) {
          let department = await prisma.department.findFirst({
            where: { name: row['Khoa/Phong'] }
          });

          if (!department) {
            department = await prisma.department.create({
              data: {
                name: row['Khoa/Phong'],
                code: row['Khoa/Phong'].substring(0, 10).toUpperCase().replace(/\s/g, ''),
                level: 1
              }
            });
          }
          departmentId = department.id;
        }

        // Hash password
        const password = row['Mat khau'] || 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
          data: {
            name: row['Ho ten'],
            email: row['Email'],
            militaryId: row['Ma so'],
            password: hashedPassword,
            role: 'GIANG_VIEN'
          }
        });

        // Create faculty profile
        await prisma.facultyProfile.create({
          data: {
            userId: user.id,
            departmentId,
            academicRank: row['Hoc ham'],
            academicDegree: row['Hoc vi'],
            specialization: row['Chuyen nganh'],
            teachingExperience: parseInt(row['Kinh nghiem giang day'] || '0'),
            industryExperience: parseInt(row['Kinh nghiem thuc tien'] || '0'),
            researchProjects: parseInt(row['So de tai NC'] || '0'),
            publications: parseInt(row['So cong bo'] || '0'),
            citations: parseInt(row['So trich dan'] || '0'),
            isActive: true,
            isPublic: false
          }
        });

        result.details.push({
          row: rowNumber,
          name: row['Ho ten'],
          email: row['Email'],
          status: 'success',
          message: 'Đã import thành công'
        });
        result.imported++;
      } catch (error: any) {
        console.error(`Error importing row ${rowNumber}:`, error);
        result.details.push({
          row: rowNumber,
          name: row['Ho ten'] || 'N/A',
          email: row['Email'] || 'N/A',
          status: 'error',
          message: error.message || 'Lỗi không xác định'
        });
        result.skipped++;
        result.errors.push(`Dòng ${rowNumber}: ${error.message}`);
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error importing faculty:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

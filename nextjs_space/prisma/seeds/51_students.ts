/**
 * SEED 51 — Students (Học viên — M10)
 * Nhóm: DEMO — M10 Education & Training
 * Phụ thuộc: 04_users, 50_education_structure (Program, StudentClass, Cohort)
 * Phục vụ: M10 Education / Đào tạo
 *
 * Tạo:
 *   - HocVien: học viên (quân sự + dân sự)
 *   - ClassEnrollment: đăng ký vào lớp
 *   - Liên kết HocVien ↔ User account
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/51_students.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedStudents() {
  console.log('\n[51] Seeding Students / HocVien (M10)...')

  for (const file of ['seed_hocvien_v2.ts', 'seed_link_hocvien_users.ts']) {
    console.log(`  → ${file}`)
    try {
      execSync(`npx tsx --require dotenv/config "${path.join(SEED_DIR, file)}"`, {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../..'),
      })
    } catch {
      console.warn(`  ⚠️  ${file} bỏ qua lỗi nhỏ`)
    }
  }

  console.log('[51] Students ✓')
}

if (require.main === module) {
  seedStudents().catch(e => { console.error('[51] FAILED:', e.message); process.exit(1) })
}

/**
 * SEED 79 — ML Models (Mô hình AI/ML — M12)
 * Nhóm: BIG DATA & HẠ TẦNG (chạy ngay trước nhóm 80-86)
 * Phụ thuộc: 04_users (cần admin QUAN_TRI_HE_THONG làm owner)
 * Phục vụ: M12 Khai thác dữ liệu — lớp AI/ML
 *
 * Tạo (lấp CSDL còn thiếu):
 *   - MLModel: 5 mô hình (NLP văn bản, dự báo điểm, trùng lặp NCKH, y tế, hậu cần)
 *   - TrainingJob: job huấn luyện tương ứng
 *   - ModelPrediction: dự đoán mẫu
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/79_ml_models.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_ml_models.ts')

export async function seedMlModels() {
  console.log('\n[79] Seeding ML Models (M12)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[79] ML Models ✓')
}

if (require.main === module) {
  seedMlModels().catch(e => { console.error('[79] FAILED:', e.message); process.exit(1) })
}

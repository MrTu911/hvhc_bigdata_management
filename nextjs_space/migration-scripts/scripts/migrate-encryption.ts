/**
 * scripts/migrate-encryption.ts
 * Migrate dữ liệu encrypted cũ (IV cố định) → format mới (GCM + random IV)
 *
 * Chạy: npx ts-node scripts/migrate-encryption.ts [--dry-run] [--batch-size 100]
 *
 * QUAN TRỌNG:
 *   1. Backup DB trước khi chạy
 *   2. Set ENCRYPTION_KEY_V0 = key cũ (từ ENCRYPTION_KEY trong .env cũ)
 *   3. Set ENCRYPTION_KEY_V1 = key mới (generate bằng generateKey())
 *   4. Chạy --dry-run trước để kiểm tra
 */

import { PrismaClient } from '@prisma/client';
import { decrypt, encrypt, isEncrypted, needsReEncrypt, SENSITIVE_FIELDS } from '../lib/encryption';

const prisma = new PrismaClient();

// ─── Parse CLI args ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN    = args.includes('--dry-run');
const BATCH_SIZE = parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] ?? '50');

// ─── Decrypt dữ liệu cũ (CBC + fixed IV) ────────────────────────────────────

import crypto from 'crypto';

function decryptLegacy(ciphertext: string): string | null {
  // Format cũ: raw base64 (không có prefix "enc:")
  if (isEncrypted(ciphertext)) return null; // Đã là format mới

  const LEGACY_KEY = process.env.ENCRYPTION_KEY_LEGACY;
  const LEGACY_IV  = process.env.ENCRYPTION_IV_LEGACY; // IV cố định (lỗi cũ)

  if (!LEGACY_KEY || !LEGACY_IV) {
    throw new Error('[MigrateEncryption] Set ENCRYPTION_KEY_LEGACY and ENCRYPTION_IV_LEGACY in .env');
  }

  try {
    const key     = Buffer.from(LEGACY_KEY, 'hex');
    const iv      = Buffer.from(LEGACY_IV, 'hex');
    const data    = Buffer.from(ciphertext, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return null; // Có thể là plain text
  }
}

// ─── Stats ───────────────────────────────────────────────────────────────────

const stats = {
  totalRecords: 0,
  migratedFields: 0,
  skippedAlreadyNew: 0,
  skippedPlainText: 0,
  errors: 0,
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔐 Encryption Migration Script`);
  console.log(`   Mode     : ${DRY_RUN ? '🔍 DRY RUN (không thay đổi DB)' : '🚀 LIVE'}`);
  console.log(`   Batch    : ${BATCH_SIZE}`);
  console.log(`   Time     : ${new Date().toISOString()}\n`);

  await migrateSensitiveIdentity();

  console.log('\n─────────── KẾT QUẢ ───────────');
  console.log(`  Records xử lý : ${stats.totalRecords}`);
  console.log(`  Fields migrate: ${stats.migratedFields}`);
  console.log(`  Đã là v1      : ${stats.skippedAlreadyNew}`);
  console.log(`  Plain text    : ${stats.skippedPlainText}`);
  console.log(`  Lỗi           : ${stats.errors}`);
  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN – chưa ghi gì vào DB. Bỏ --dry-run để migrate thật.');
  }
}

async function migrateSensitiveIdentity() {
  console.log('📋 Đang xử lý bảng SensitiveIdentity...');

  let cursor: string | undefined;
  let batch = 0;

  while (true) {
    const records = await (prisma as any).sensitiveIdentity.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    });

    if (records.length === 0) break;

    batch++;
    console.log(`  Batch ${batch}: ${records.length} records`);

    for (const record of records) {
      stats.totalRecords++;
      const updates: Record<string, string> = {};

      for (const field of SENSITIVE_FIELDS) {
        const raw = record[field] as string | null | undefined;
        if (!raw) continue;

        // Đã là format mới → skip
        if (isEncrypted(raw) && !needsReEncrypt(raw)) {
          stats.skippedAlreadyNew++;
          continue;
        }

        let plaintext: string | null = null;

        if (isEncrypted(raw) && needsReEncrypt(raw)) {
          // v0 → decrypt bằng key cũ, encrypt lại bằng key mới
          try {
            plaintext = decrypt(raw); // dùng ENCRYPTION_KEY_V0
          } catch {
            console.warn(`    ⚠️  Không decrypt được ${field} id=${record.id}`);
            stats.errors++;
            continue;
          }
        } else {
          // Có thể là format legacy (CBC) hoặc plain text
          plaintext = decryptLegacy(raw);
          if (plaintext === null) {
            // Là plain text thuần → chỉ encrypt lên
            plaintext = raw;
            stats.skippedPlainText++;
          }
        }

        if (plaintext) {
          updates[field] = encrypt(plaintext);
          stats.migratedFields++;
        }
      }

      if (Object.keys(updates).length > 0 && !DRY_RUN) {
        try {
          await (prisma as any).sensitiveIdentity.update({
            where: { id: record.id },
            data: updates,
          });
        } catch (err) {
          console.error(`    ❌ Update lỗi id=${record.id}:`, err);
          stats.errors++;
        }
      }

      cursor = record.id;
    }
  }

  console.log(`  ✅ Xong SensitiveIdentity`);
}

main()
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
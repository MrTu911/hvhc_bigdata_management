/**
 * Backfill: PartyMember.status legacy 'ACTIVE' → vòng đời chuẩn (M03).
 *
 * Bối cảnh: seed cũ gán cứng status = 'ACTIVE' cho mọi đảng viên nên các tab lọc
 * trên /dashboard/party/members (CHINH_THUC/DU_BI/CAM_TINH/DOI_TUONG/QUAN_CHUNG/KHAI_TRU)
 * luôn trả rỗng. Backfill này phân bổ lại trạng thái + đồng bộ joinDate/officialDate
 * nhất quán với nghiệp vụ, để mọi bộ lọc đều có dữ liệu.
 *
 * Chiến lược (migration-refactor rules): Backfill an toàn, idempotent.
 *  - CHỈ động vào bản ghi status = 'ACTIVE' (legacy) + chưa xoá mềm.
 *  - KHÔNG đụng bản ghi đã có trạng thái lifecycle thật → chạy lại = no-op.
 *  - Bản ghi cấp ủy (currentPosition lãnh đạo) luôn về CHINH_THUC.
 *  - Mọi bản ghi được sửa đều mang statusChangeReason đặc trưng → truy vết/rollback.
 *  - Đồng bộ cache User.partyJoinDate cho khớp joinDate mới.
 *
 * Mặc định DRY-RUN (không ghi DB). Thêm cờ --apply để ghi thật.
 *
 * Usage:
 *   npx tsx --require dotenv/config scripts/backfill/backfill-party-member-status.ts
 *   npx tsx --require dotenv/config scripts/backfill/backfill-party-member-status.ts --apply
 */

import { PrismaClient } from '@prisma/client';
import {
  assignPartyStage,
  bucketFromId,
  reasonForStatus,
} from '../../prisma/seed/_helpers/party-status-distribution';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

function fmtDate(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : '—';
}

function printDistribution(title: string, counts: Record<string, number>) {
  console.log(`\n${title}`);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    console.log('  (trống)');
    return;
  }
  for (const [status, count] of entries) {
    console.log(`  ${status.padEnd(12)} : ${count}`);
  }
}

async function main() {
  console.log('\n=== Backfill PartyMember.status (legacy ACTIVE → vòng đời chuẩn) ===');
  console.log(`Chế độ: ${APPLY ? 'APPLY (ghi DB)' : 'DRY-RUN (không ghi DB)'}\n`);

  const now = new Date();

  const candidates = await prisma.partyMember.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      userId: true,
      currentPosition: true,
      joinDate: true,
      user: { select: { name: true, militaryId: true } },
    },
  });

  console.log(`Tìm thấy ${candidates.length} đảng viên đang ở trạng thái legacy 'ACTIVE'.`);
  if (candidates.length === 0) {
    console.log('Không có gì để backfill (idempotent).');
    return;
  }

  const after: Record<string, number> = {};
  let withJoinDate = 0;

  for (const m of candidates) {
    const bucket = bucketFromId(m.id);
    // classifyFromExistingDate = false: ngày hiện tại là synthetic (all-ACTIVE),
    // nên phân bổ theo bucket để tạo đủ độ đa dạng; vẫn giữ joinDate quá khứ cho CHINH_THUC.
    const stage = assignPartyStage(m.currentPosition, bucket, now, {
      existingJoinDate: m.joinDate,
    });

    after[stage.status] = (after[stage.status] ?? 0) + 1;
    if (stage.joinDate) withJoinDate += 1;

    if (APPLY) {
      await prisma.$transaction([
        prisma.partyMember.update({
          where: { id: m.id },
          data: {
            status: stage.status,
            joinDate: stage.joinDate,
            officialDate: stage.officialDate,
            statusChangeDate: now,
            statusChangeReason: reasonForStatus(stage.status),
          },
        }),
        prisma.user.update({
          where: { id: m.userId },
          data: { partyJoinDate: stage.joinDate },
        }),
      ]);
    }

    const who = `${m.user?.name ?? '—'} (${m.user?.militaryId ?? m.id})`;
    console.log(
      `  • ${who}: ACTIVE → ${stage.status.padEnd(11)} ` +
        `| kết nạp ${fmtDate(stage.joinDate)} | chính thức ${fmtDate(stage.officialDate)}`,
    );
  }

  printDistribution(`=== Phân bố trạng thái sau backfill (${candidates.length} bản ghi) ===`, after);
  console.log(`\n  Có ngày kết nạp : ${withJoinDate}`);
  console.log(`  Chưa kết nạp    : ${candidates.length - withJoinDate} (Cảm tình/Đối tượng/Quần chúng)`);

  console.log('\n=== Tổng kết ===');
  console.log(`  ${APPLY ? 'Đã ghi' : 'Sẽ ghi'}: ${candidates.length} bản ghi`);
  if (!APPLY) {
    console.log('\nChạy lại với --apply để ghi thật.');
  }
}

main()
  .catch((err) => {
    console.error('Backfill thất bại:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

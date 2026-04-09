/**
 * Backfill: StudentProfile → HocVien
 *
 * Mục tiêu: migrate dữ liệu từ model cũ StudentProfile sang backbone M10 HocVien.
 *
 * Chiến lược:
 *  1. Với mỗi StudentProfile, tìm HocVien theo userId hoặc maHocVien.
 *  2. Nếu không tìm thấy → tạo HocVien mới với dữ liệu từ StudentProfile.
 *  3. Nếu đã có HocVien → chỉ backfill các field đang null/empty (không ghi đè).
 *
 * Chạy:
 *   npx tsx --require dotenv/config prisma/seed/backfill_student_profile_to_hocvien.ts
 *
 * Rollback:
 *   Model StudentProfile giữ nguyên — script chỉ đọc từ StudentProfile, không xóa.
 *   Sau khi verify xong, sunset date 2026-10-01 mới drop.
 */

import { prisma } from '@/lib/db';

const STATUS_MAP: Record<string, string> = {
  DANG_HOC:    'ACTIVE',
  BAO_LUU:     'ON_LEAVE',
  THOI_HOC:    'WITHDRAWN',
  TOT_NGHIEP:  'GRADUATED',
};

async function backfillStudentProfiles() {
  const profiles = await prisma.studentProfile.findMany({
    where: { deletedAt: null },
  });

  console.log(`Found ${profiles.length} active StudentProfile records to process.`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const profile of profiles) {
    // Resolve HocVien: match by userId first, then by maHocVien
    let hocVien = profile.userId
      ? await prisma.hocVien.findFirst({ where: { userId: profile.userId } })
      : null;

    if (!hocVien && profile.maHocVien) {
      hocVien = await prisma.hocVien.findFirst({ where: { maHocVien: profile.maHocVien } });
    }

    const mappedStatus = STATUS_MAP[profile.trangThai] ?? 'ACTIVE';

    if (!hocVien) {
      // No matching HocVien — create a stub from StudentProfile data.
      // maHocVien is required; skip if missing.
      if (!profile.maHocVien) {
        console.warn(`  SKIP: StudentProfile ${profile.id} has no maHocVien — cannot create HocVien.`);
        skipped++;
        continue;
      }

      await prisma.hocVien.create({
        data: {
          maHocVien:      profile.maHocVien,
          hoTen:          profile.maHocVien, // fallback: no hoTen on StudentProfile
          userId:         profile.userId ?? undefined,
          lop:            profile.lop ?? undefined,
          khoaHoc:        profile.khoaHoc ?? undefined,
          nganh:          profile.nganh ?? undefined,
          heDaoTao:       profile.heDaoTao ?? undefined,
          khoaQuanLy:     profile.khoaQuanLy ?? undefined,
          trungDoi:       profile.trungDoi ?? undefined,
          daiDoi:         profile.daiDoi ?? undefined,
          diemTrungBinh:  profile.diemTrungBinh,
          xepLoaiHocLuc:  profile.xepLoaiHocLuc ?? undefined,
          tongTinChi:     profile.tongTinChi,
          tinChiTichLuy:  profile.tinChiTichLuy,
          ngayNhapHoc:    profile.ngayNhapHoc ?? undefined,
          ngayTotNghiep:  profile.ngayTotNghiep ?? undefined,
          lyDoNghiHoc:    profile.lyDoNghiHoc ?? undefined,
          currentStatus:  mappedStatus as any,
        },
      });

      console.log(`  CREATED HocVien for StudentProfile ${profile.id} (maHocVien: ${profile.maHocVien})`);
      created++;
    } else {
      // HocVien exists — patch only null/empty fields to avoid overwriting live data.
      const patch: Record<string, unknown> = {};

      if (!hocVien.lop          && profile.lop)          patch.lop          = profile.lop;
      if (!hocVien.khoaHoc      && profile.khoaHoc)      patch.khoaHoc      = profile.khoaHoc;
      if (!hocVien.nganh        && profile.nganh)        patch.nganh        = profile.nganh;
      if (!hocVien.heDaoTao     && profile.heDaoTao)     patch.heDaoTao     = profile.heDaoTao;
      if (!hocVien.khoaQuanLy   && profile.khoaQuanLy)   patch.khoaQuanLy   = profile.khoaQuanLy;
      if (!hocVien.trungDoi     && profile.trungDoi)     patch.trungDoi     = profile.trungDoi;
      if (!hocVien.daiDoi       && profile.daiDoi)       patch.daiDoi       = profile.daiDoi;
      if (!hocVien.xepLoaiHocLuc && profile.xepLoaiHocLuc) patch.xepLoaiHocLuc = profile.xepLoaiHocLuc;
      if (!hocVien.ngayNhapHoc  && profile.ngayNhapHoc)  patch.ngayNhapHoc  = profile.ngayNhapHoc;
      if (!hocVien.ngayTotNghiep && profile.ngayTotNghiep) patch.ngayTotNghiep = profile.ngayTotNghiep;
      if (!hocVien.lyDoNghiHoc  && profile.lyDoNghiHoc)  patch.lyDoNghiHoc  = profile.lyDoNghiHoc;
      // Only backfill tinChi/GPA if HocVien has default zeros
      if (hocVien.tinChiTichLuy === 0 && profile.tinChiTichLuy > 0)
        patch.tinChiTichLuy = profile.tinChiTichLuy;
      if (hocVien.tongTinChi === null && profile.tongTinChi > 0)
        patch.tongTinChi = profile.tongTinChi;
      if (hocVien.diemTrungBinh === 0 && profile.diemTrungBinh > 0)
        patch.diemTrungBinh = profile.diemTrungBinh;
      // Link userId if HocVien doesn't have one
      if (!hocVien.userId && profile.userId)
        patch.userId = profile.userId;

      if (Object.keys(patch).length > 0) {
        await prisma.hocVien.update({ where: { id: hocVien.id }, data: patch });
        console.log(`  PATCHED HocVien ${hocVien.id} with ${Object.keys(patch).join(', ')}`);
        updated++;
      } else {
        skipped++;
      }
    }
  }

  console.log(`\nBackfill complete: ${created} created, ${updated} updated, ${skipped} skipped.`);
  console.log('NOTE: StudentProfile records are unchanged. Verify HocVien data before sunset (2026-10-01).');
}

backfillStudentProfiles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

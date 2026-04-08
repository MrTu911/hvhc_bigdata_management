/**
 * ETL: Import dữ liệu học viên từ hệ thống LAN cũ
 *
 * Mapping: LAN export CSV → HocVien (M10)
 *
 * Chế độ vận hành:
 *   DRY_RUN=true  → chỉ validate + log, không ghi DB (mặc định an toàn)
 *   DRY_RUN=false → ghi thật vào DB (chỉ dùng sau khi dry-run sạch)
 *
 * Usage:
 *   DRY_RUN=true  npx tsx --require dotenv/config prisma/seed/etl_lan_import.ts
 *   DRY_RUN=false npx tsx --require dotenv/config prisma/seed/etl_lan_import.ts
 *
 * Input: LAN_DATA_FILE env var hoặc default sample bên dưới.
 * LAN CSV columns (dựa trên export LAN thực tế):
 *   Ma_HV, Ho_Ten, Ngay_Sinh, Gioi_Tinh, Lop, Khoa_Hoc, Nganh,
 *   He_Dao_Tao, Diem_TB, Trang_Thai, Email, Dien_Thoai
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN !== 'false'; // mặc định là DRY_RUN

// ─── Types ────────────────────────────────────────────────────────────────────

type LanRecord = {
  Ma_HV: string;
  Ho_Ten: string;
  Ngay_Sinh?: string;
  Gioi_Tinh?: string;
  Lop?: string;
  Khoa_Hoc?: string;
  Nganh?: string;
  He_Dao_Tao?: string;
  Diem_TB?: string;
  Trang_Thai?: string;
  Email?: string;
  Dien_Thoai?: string;
};

type EtlResult = {
  maHocVien: string;
  action: 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR';
  reason?: string;
};

// ─── LAN → M10 Mapping ────────────────────────────────────────────────────────

/** Map trạng thái LAN → EduStudentStatus */
function mapTrangThai(lan: string | undefined): string {
  const normalized = (lan || '').trim().toLowerCase();
  if (normalized.includes('tốt nghiệp') || normalized.includes('tot nghiep')) return 'GRADUATED';
  if (normalized.includes('thôi học') || normalized.includes('thoi hoc')) return 'DROPPED_OUT';
  if (normalized.includes('bảo lưu') || normalized.includes('bao luu')) return 'STUDY_DELAY';
  if (normalized.includes('tạm ngưng') || normalized.includes('tam ngung')) return 'TEMP_SUSPENDED';
  return 'ACTIVE'; // mặc định
}

/** Map hình thức đào tạo LAN → studyMode (MD_STUDY_MODE) */
function mapHeDaoTao(lan: string | undefined): string | null {
  const normalized = (lan || '').trim().toLowerCase();
  if (normalized.includes('chính quy') || normalized.includes('chinh quy')) return 'CHINH_QUY';
  if (normalized.includes('liên thông') || normalized.includes('lien thong')) return 'LIEN_THONG';
  if (normalized.includes('tại chức') || normalized.includes('tai chuc')) return 'TAI_CHUC';
  if (normalized.includes('sau đại học') || normalized.includes('sau dai hoc')) return 'NGHIEN_CUU_SINH';
  if (normalized.includes('bồi dưỡng') || normalized.includes('boi duong')) return 'BOI_DUONG';
  if (normalized.includes('văn bằng 2') || normalized.includes('van bang 2')) return 'VAN_BANG_2';
  return null;
}

function parseDate(str: string | undefined): Date | null {
  if (!str || str.trim() === '') return null;
  // Hỗ trợ dd/mm/yyyy và yyyy-mm-dd
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    return new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`);
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function parseDiem(str: string | undefined): number {
  const n = parseFloat(str || '0');
  return isNaN(n) ? 0 : Math.max(0, Math.min(10, n));
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateRecord(record: LanRecord): string | null {
  if (!record.Ma_HV || record.Ma_HV.trim() === '') return 'Thiếu Ma_HV';
  if (!record.Ho_Ten || record.Ho_Ten.trim() === '') return 'Thiếu Ho_Ten';
  if (record.Diem_TB !== undefined) {
    const d = parseFloat(record.Diem_TB);
    if (isNaN(d) || d < 0 || d > 10) return `Diem_TB không hợp lệ: ${record.Diem_TB}`;
  }
  return null;
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCsv(content: string): LanRecord[] {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const record: Record<string, string> = {};
    headers.forEach((h, i) => { record[h] = values[i] || ''; });
    return record as unknown as LanRecord;
  });
}

// ─── ETL Core ────────────────────────────────────────────────────────────────

async function processRecord(record: LanRecord): Promise<EtlResult> {
  const maHocVien = record.Ma_HV.trim();

  const validationError = validateRecord(record);
  if (validationError) {
    return { maHocVien, action: 'ERROR', reason: validationError };
  }

  const mapped = {
    maHocVien,
    hoTen:         record.Ho_Ten.trim(),
    ngaySinh:      parseDate(record.Ngay_Sinh),
    gioiTinh:      record.Gioi_Tinh?.trim() || null,
    lop:           record.Lop?.trim() || null,
    khoaHoc:       record.Khoa_Hoc?.trim() || null,
    nganh:         record.Nganh?.trim() || null,
    heDaoTao:      record.He_Dao_Tao?.trim() || null,
    studyMode:     mapHeDaoTao(record.He_Dao_Tao),
    diemTrungBinh: parseDiem(record.Diem_TB),
    currentStatus: mapTrangThai(record.Trang_Thai) as any,
    email:         record.Email?.trim() || null,
    dienThoai:     record.Dien_Thoai?.trim() || null,
  };

  if (DRY_RUN) {
    // Dry run: chỉ check conflict, không ghi
    const existing = await prisma.hocVien.findUnique({ where: { maHocVien } });
    return {
      maHocVien,
      action: existing ? 'UPDATE' : 'CREATE',
      reason: existing ? `Sẽ cập nhật: hoTen="${mapped.hoTen}"` : `Sẽ tạo mới: hoTen="${mapped.hoTen}"`,
    };
  }

  // Real run: upsert
  try {
    const existing = await prisma.hocVien.findUnique({ where: { maHocVien } });

    if (existing) {
      await prisma.hocVien.update({
        where: { maHocVien },
        data: {
          // Chỉ update các field từ LAN nếu chưa có giá trị tốt hơn
          hoTen:     mapped.hoTen,
          ngaySinh:  mapped.ngaySinh ?? existing.ngaySinh,
          gioiTinh:  mapped.gioiTinh ?? existing.gioiTinh,
          lop:       mapped.lop ?? existing.lop,
          khoaHoc:   mapped.khoaHoc ?? existing.khoaHoc,
          nganh:     mapped.nganh ?? existing.nganh,
          heDaoTao:  mapped.heDaoTao ?? existing.heDaoTao,
          studyMode: mapped.studyMode ?? existing.studyMode,
          email:     mapped.email ?? existing.email,
          dienThoai: mapped.dienThoai ?? existing.dienThoai,
          // Điểm: chỉ import nếu chưa có điểm thực trong hệ thống
          ...(existing.diemTrungBinh === 0 && mapped.diemTrungBinh > 0
            ? { diemTrungBinh: mapped.diemTrungBinh } : {}),
        },
      });
      return { maHocVien, action: 'UPDATE' };
    } else {
      await prisma.hocVien.create({ data: mapped });
      return { maHocVien, action: 'CREATE' };
    }
  } catch (err: any) {
    return { maHocVien, action: 'ERROR', reason: err.message };
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const mode = DRY_RUN ? '🔍 DRY RUN (không ghi DB)' : '🔥 LIVE RUN (ghi thật)';
  console.log(`\n📥 ETL: Import dữ liệu LAN → M10`);
  console.log(`   Chế độ: ${mode}\n`);

  // Load dữ liệu
  const dataFile = process.env.LAN_DATA_FILE;
  let records: LanRecord[];

  if (dataFile && fs.existsSync(dataFile)) {
    console.log(`   Đọc file: ${dataFile}`);
    const content = fs.readFileSync(dataFile, 'utf-8');
    records = parseCsv(content);
  } else {
    // Sample data để test DRY_RUN khi không có file thật
    console.log('   ⚠️  Không tìm thấy LAN_DATA_FILE. Dùng sample data để minh họa.\n');
    records = [
      { Ma_HV: 'HV20240999', Ho_Ten: 'Nguyễn Văn Test', Ngay_Sinh: '15/03/2000', Gioi_Tinh: 'Nam', Lop: 'K45A', Khoa_Hoc: 'K45', Nganh: 'Hậu cần', He_Dao_Tao: 'Chính quy', Diem_TB: '7.5', Trang_Thai: 'Đang học', Email: 'test@example.com', Dien_Thoai: '0912345678' },
      { Ma_HV: 'HV20240001', Ho_Ten: 'Trần Thị Hoa (LAN update)', Diem_TB: '8.2', Trang_Thai: 'Đang học' }, // existing record
      { Ma_HV: '',           Ho_Ten: 'Missing MaHV' }, // validation error
      { Ma_HV: 'HV20240998', Ho_Ten: 'Lê Văn Sample', Diem_TB: '99', He_Dao_Tao: 'Liên thông' }, // invalid score
    ];
  }

  console.log(`   Tổng records: ${records.length}\n`);

  const results: EtlResult[] = [];
  for (const record of records) {
    const result = await processRecord(record);
    results.push(result);
    const icon = result.action === 'ERROR' ? '❌' : result.action === 'SKIP' ? '⏭' : result.action === 'CREATE' ? '✅' : '🔄';
    console.log(`   ${icon} [${result.action}] ${result.maHocVien} ${result.reason ? `– ${result.reason}` : ''}`);
  }

  // Summary
  const counts = results.reduce((acc, r) => {
    acc[r.action] = (acc[r.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n📊 KẾT QUẢ:');
  console.log(`   CREATE : ${counts['CREATE'] || 0}`);
  console.log(`   UPDATE : ${counts['UPDATE'] || 0}`);
  console.log(`   SKIP   : ${counts['SKIP']   || 0}`);
  console.log(`   ERROR  : ${counts['ERROR']  || 0}`);

  if (DRY_RUN) {
    console.log('\n⚠️  ĐÂY LÀ DRY RUN – Không có gì được ghi vào DB.');
    console.log('   Để chạy thật: DRY_RUN=false npx tsx --require dotenv/config prisma/seed/etl_lan_import.ts\n');
  } else {
    console.log('\n✅ Import hoàn tất.\n');
  }

  if (counts['ERROR'] > 0) {
    console.log('⛔ Có lỗi validation. Kiểm tra và sửa dữ liệu LAN trước khi chạy LIVE.\n');
    process.exit(1);
  }
}

main()
  .catch(e => { console.error('❌ ETL Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());

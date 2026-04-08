/**
 * API: Personnel Import – Nhập dữ liệu cán bộ từ CSV/Excel
 * Path: /api/personnel/import
 * Accepts CSV (UTF-8 with BOM) matching the 2A-LLDV standard columns.
 * Excel users should "Save As → CSV UTF-8" before uploading.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';

const EXPECTED_HEADERS = [
  'hoVaTen', 'capBac', 'chucVu', 'donVi', 'soQuan', 'ngaySinh',
  'gioiTinh', 'danToc', 'tongGiao', 'queQuan', 'noiSinh', 'email',
];

function parseCSV(text: string): Record<string, string>[] {
  // Strip BOM if present
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    // Handle quoted CSV fields
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    fields.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = fields[i] ?? ''; });
    return row;
  }).filter(row => row.hoVaTen || row.soQuan); // skip empty rows
}

function mapRowToUser(row: Record<string, string>) {
  const dateOfBirth = row.ngaySinh ? new Date(row.ngaySinh) : null;
  return {
    name: row.hoVaTen?.trim() || '',
    rank: row.capBac?.trim() || null,
    position: row.chucVu?.trim() || null,
    militaryId: row.soQuan?.trim() || null,
    email: row.email?.trim() || null,
    gender: row.gioiTinh === 'Nam' || row.gioiTinh === 'M' ? 'MALE'
           : row.gioiTinh === 'Nữ' || row.gioiTinh === 'F' ? 'FEMALE' : null,
    dateOfBirth: dateOfBirth && !isNaN(dateOfBirth.getTime()) ? dateOfBirth : null,
    homeTown: row.queQuan?.trim() || null,
    birthPlace: row.noiSinh?.trim() || null,
    ethnicity: row.danToc?.trim() || null,
    religion: row.tongGiao?.trim() || null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.IMPORT);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const dryRun = formData.get('dryRun') === 'true';

    if (!file) return NextResponse.json({ error: 'Không có file được gửi lên' }, { status: 400 });

    const allowedTypes = ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Chỉ hỗ trợ định dạng CSV (*.csv). Từ Excel: File → Lưu dưới dạng → CSV UTF-8' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'File không có dữ liệu hoặc định dạng không đúng' }, { status: 400 });
    }

    const results = {
      total: rows.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as { row: number; soQuan: string; reason: string }[],
    };

    if (dryRun) {
      // Validate only – do not write
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row.hoVaTen) {
          results.errors.push({ row: i + 2, soQuan: row.soQuan || '—', reason: 'Thiếu họ và tên' });
          results.skipped++;
        }
      }
      return NextResponse.json({
        dryRun: true,
        ...results,
        preview: rows.slice(0, 5).map(mapRowToUser),
      });
    }

    // Actual import
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.hoVaTen) {
          results.errors.push({ row: i + 2, soQuan: row.soQuan || '—', reason: 'Thiếu họ và tên' });
          results.skipped++;
          continue;
        }

        const data = mapRowToUser(row);

        if (row.soQuan) {
          // Try upsert by militaryId
          const existing = await prisma.user.findFirst({
            where: { militaryId: row.soQuan.trim() },
            select: { id: true },
          });

          if (existing) {
            await prisma.user.update({
              where: { id: existing.id },
              data: {
                name: data.name,
                rank: data.rank,
                position: data.position,
                ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
              },
            });
            results.updated++;
          } else {
            await prisma.user.create({
              data: {
                ...data,
                email: data.email || `import_${Date.now()}_${i}@hvhc.edu.vn`,
                password: '$2b$10$placeholder', // Must change on first login
                status: 'ACTIVE',
              },
            });
            results.created++;
          }
        } else {
          results.errors.push({ row: i + 2, soQuan: '—', reason: 'Thiếu số quân, bỏ qua' });
          results.skipped++;
        }
      } catch (err: any) {
        results.errors.push({ row: i + 2, soQuan: row.soQuan || '—', reason: err.message || 'Lỗi không xác định' });
        results.skipped++;
      }
    }

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.IMPORT,
      action: 'IMPORT',
      resourceType: 'PERSONNEL',
      result: 'SUCCESS',
      metadata: { fileName: file.name, ...results },
    });

    return NextResponse.json({
      success: true,
      fileName: file.name,
      ...results,
    });
  } catch (error) {
    console.error('[Personnel Import POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET – Download CSV template
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.IMPORT);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const header = EXPECTED_HEADERS.join(',');
    const example = [
      'Nguyễn Văn An', 'Thiếu tá', 'Trưởng khoa', 'Khoa CNTT', 'SQ001',
      '1985-03-15', 'Nam', 'Kinh', 'Không', 'Hà Nội', 'Hà Nội', 'an.nv@hvhc.edu.vn',
    ].join(',');

    const csv = '\uFEFF' + header + '\n' + example + '\n';
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="mau_nhap_can_bo.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * seed_science_library.ts
 *
 * Tạo dữ liệu cho M25 Science Works & Library:
 *  1. ScientificWork — sách, giáo trình, bài báo, báo cáo khoa học
 *  2. ScientificWorkAuthor — tác giả của từng công trình
 *  3. LibraryItem — bản sao lưu trữ vật lý trong thư viện
 *
 * Prerequisites: science_catalogs (PUBLISHER), nckh_scientist_profiles (scientists),
 *                faculty_profiles đã có dữ liệu
 * Run: npx tsx --require dotenv/config prisma/seed/seed_science_library.ts
 */

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
  console.log('📚 seed_science_library.ts — Tạo dữ liệu M25 Science Works & Library')

  // Xóa dữ liệu cũ
  await db.libraryItem.deleteMany({})
  await db.scientificWorkAuthor.deleteMany({})
  await db.scientificWork.deleteMany({})
  console.log('  → Đã xóa works và library items cũ')

  // Lấy publishers từ science_catalogs
  const publishers = await db.scienceCatalog.findMany({
    where: { type: 'PUBLISHER', isActive: true },
    select: { id: true, code: true, name: true },
  })

  // Lấy scientists và faculty users để làm tác giả
  const scientists = await db.nckhScientistProfile.findMany({
    select: { id: true, userId: true, user: { select: { name: true } } },
    take: 20,
  })

  const facultyUsers = await db.user.findMany({
    where: { role: { in: ['GIANG_VIEN', 'NGHIEN_CUU_VIEN'] } },
    select: { id: true, name: true },
    take: 15,
  })

  if (publishers.length === 0) {
    throw new Error('Thiếu science_catalogs PUBLISHER — chạy seed_science_demo.ts trước')
  }

  // ── 1. Sách giáo khoa / Giáo trình quân sự ──────────────────────────────────
  const textbooks = [
    {
      code: 'SW-BOOK-001',
      type: 'TEXTBOOK',
      title: 'Giáo trình Hậu cần quân sự cơ bản',
      subtitle: 'Dùng cho đào tạo sĩ quan hậu cần cấp phân đội',
      isbn: '978-604-76-2041-1',
      year: 2023,
      edition: 3,
      sensitivity: 'INTERNAL',
    },
    {
      code: 'SW-BOOK-002',
      type: 'TEXTBOOK',
      title: 'Lý thuyết và thực hành Logistics quân sự',
      subtitle: null,
      isbn: '978-604-76-2098-5',
      year: 2022,
      edition: 2,
      sensitivity: 'NORMAL',
    },
    {
      code: 'SW-BOOK-003',
      type: 'TEXTBOOK',
      title: 'Quản lý chuỗi cung ứng trong điều kiện tác chiến',
      subtitle: 'Phân tích từ các cuộc chiến tranh hiện đại',
      isbn: '978-604-67-1234-8',
      year: 2024,
      edition: 1,
      sensitivity: 'INTERNAL',
    },
    {
      code: 'SW-BOOK-004',
      type: 'TEXTBOOK',
      title: 'Kế hoạch hóa và điều hành hậu cần chiến dịch',
      subtitle: null,
      isbn: '978-604-76-3001-4',
      year: 2021,
      edition: 4,
      sensitivity: 'RESTRICTED',
    },
    {
      code: 'SW-BOOK-005',
      type: 'TEXTBOOK',
      title: 'Tin học ứng dụng trong quản lý quân nhu',
      subtitle: 'Hệ thống thông tin quản lý kho vũ khí trang bị',
      isbn: '978-604-76-1876-0',
      year: 2023,
      edition: 2,
      sensitivity: 'NORMAL',
    },
  ]

  // ── 2. Chuyên khảo / Sách tham khảo ─────────────────────────────────────────
  const monographs = [
    {
      code: 'SW-MONO-001',
      type: 'MONOGRAPH',
      title: 'Ứng dụng trí tuệ nhân tạo trong dự báo nhu cầu vật chất kỹ thuật',
      subtitle: 'Nghiên cứu thực nghiệm tại Học viện Hậu cần',
      isbn: null,
      issn: null,
      doi: '10.15625/hvhc.2024.001',
      year: 2024,
      edition: 1,
      sensitivity: 'NORMAL',
    },
    {
      code: 'SW-MONO-002',
      type: 'MONOGRAPH',
      title: 'Phân tích dữ liệu lớn trong quản trị logistics quân sự',
      subtitle: null,
      isbn: '978-604-76-4521-6',
      year: 2023,
      edition: 1,
      sensitivity: 'NORMAL',
    },
    {
      code: 'SW-MONO-003',
      type: 'MONOGRAPH',
      title: 'Tác động của công nghệ blockchain đến minh bạch chuỗi cung ứng quốc phòng',
      subtitle: null,
      isbn: null,
      doi: '10.15625/hvhc.2023.blockchain',
      year: 2023,
      edition: 1,
      sensitivity: 'NORMAL',
    },
  ]

  // ── 3. Bài báo khoa học (Journal Articles) ───────────────────────────────────
  const articles = [
    {
      code: 'SW-ART-001',
      type: 'ARTICLE',
      title: 'Nghiên cứu mô hình tối ưu hóa vận chuyển quân sự sử dụng thuật toán di truyền',
      journalName: 'Tạp chí Khoa học Học viện Hậu cần',
      issn: '1859-3143',
      doi: '10.15625/hvhc.2024.01.001',
      year: 2024,
      edition: 1,
      sensitivity: 'NORMAL',
    },
    {
      code: 'SW-ART-002',
      type: 'ARTICLE',
      title: 'Áp dụng machine learning trong phát hiện lãng phí tồn kho quân nhu',
      journalName: 'Vietnam Journal of Military Science',
      issn: '2734-9861',
      doi: '10.31219/vjms.2024.0045',
      year: 2024,
      edition: 2,
      sensitivity: 'NORMAL',
    },
    {
      code: 'SW-ART-003',
      type: 'ARTICLE',
      title: 'Xây dựng chỉ số đánh giá năng lực bảo đảm hậu cần đơn vị cơ sở',
      journalName: 'Tạp chí Khoa học Học viện Hậu cần',
      issn: '1859-3143',
      doi: null,
      year: 2023,
      edition: 3,
      sensitivity: 'NORMAL',
    },
    {
      code: 'SW-ART-004',
      type: 'ARTICLE',
      title: 'Internet of Things trong giám sát kho vũ khí trang bị thời gian thực',
      journalName: 'Journal of Military Technology',
      issn: '2588-1299',
      doi: '10.31219/jmt.2023.iot.012',
      year: 2023,
      edition: 1,
      sensitivity: 'INTERNAL',
    },
    {
      code: 'SW-ART-005',
      type: 'ARTICLE',
      title: 'Mô hình dự báo tiêu hao vật chất kỹ thuật trong chiến dịch phòng thủ',
      journalName: 'Tạp chí Khoa học Học viện Hậu cần',
      issn: '1859-3143',
      doi: null,
      year: 2022,
      edition: 4,
      sensitivity: 'RESTRICTED',
    },
  ]

  // ── 4. Báo cáo nghiên cứu ────────────────────────────────────────────────────
  const reports = [
    {
      code: 'SW-RPT-001',
      type: 'REPORT',
      title: 'Báo cáo tổng kết đề tài: Hệ thống thông tin quản lý hậu cần chiến dịch',
      subtitle: 'Đề tài cấp Bộ Quốc phòng, nghiệm thu năm 2024',
      isbn: null,
      year: 2024,
      edition: 1,
      sensitivity: 'RESTRICTED',
    },
    {
      code: 'SW-RPT-002',
      type: 'REPORT',
      title: 'Đánh giá hiệu quả ứng dụng GIS trong lập kế hoạch hậu cần chiến lược',
      subtitle: null,
      isbn: null,
      year: 2023,
      edition: 1,
      sensitivity: 'INTERNAL',
    },
  ]

  const allWorks = [
    ...textbooks.map(w => ({ ...w, isbn: w.isbn ?? null, issn: null, doi: null, journalName: null })),
    ...monographs.map(w => ({ ...w, issn: (w as typeof monographs[0]).issn ?? null, doi: (w as typeof monographs[0]).doi ?? null, journalName: null })),
    ...articles.map(w => ({ ...w, isbn: null, issn: w.issn ?? null, doi: w.doi ?? null, journalName: w.journalName ?? null })),
    ...reports.map(w => ({ ...w, isbn: null, issn: null, doi: null, journalName: null })),
  ]

  // Tạo works
  const createdWorks: Array<{ id: string; code: string; type: string }> = []

  for (const w of allWorks) {
    const publisher = ['TEXTBOOK', 'MONOGRAPH', 'REPORT'].includes(w.type)
      ? pick(publishers)
      : null

    const work = await db.scientificWork.create({
      data: {
        code: w.code,
        type: w.type,
        title: w.title,
        subtitle: w.subtitle,
        isbn: w.isbn,
        issn: w.issn,
        doi: w.doi,
        publisherId: publisher?.id ?? null,
        journalName: w.journalName,
        year: w.year,
        edition: w.edition,
        sensitivity: w.sensitivity,
      },
    })
    createdWorks.push({ id: work.id, code: work.code, type: work.type })
  }

  console.log(`  → Đã tạo ${createdWorks.length} scientific works`)

  // ── 2. ScientificWorkAuthor ──────────────────────────────────────────────────
  let authorCount = 0
  const allAuthors = [
    ...scientists.map(s => ({ name: s.user.name, scientistId: s.id })),
    ...facultyUsers.map(u => ({ name: u.name, scientistId: null })),
  ]

  const roles = ['LEAD', 'CO_AUTHOR', 'CO_AUTHOR', 'EDITOR']

  for (let i = 0; i < createdWorks.length; i++) {
    const work = createdWorks[i]
    const numAuthors = work.type === 'ARTICLE' ? 2 + (i % 2) : 1 + (i % 3)

    for (let j = 0; j < numAuthors; j++) {
      const authorIdx = (i + j) % allAuthors.length
      const author = allAuthors[authorIdx]
      await db.scientificWorkAuthor.create({
        data: {
          workId: work.id,
          scientistId: author.scientistId,
          authorName: author.name,
          role: j === 0 ? 'LEAD' : roles[j % roles.length],
          orderNum: j + 1,
          affiliation: 'Học viện Hậu cần',
        },
      })
      authorCount++
    }
  }

  console.log(`  → Đã tạo ${authorCount} work authors`)

  // ── 3. LibraryItem (digital files trong MinIO) ───────────────────────────────
  const adminUser = await db.user.findFirst({
    where: { role: 'QUAN_TRI_HE_THONG' },
    select: { id: true },
  })
  if (!adminUser) throw new Error('Cần có admin user')

  let libraryCount = 0
  for (const work of createdWorks) {
    // Tạo 1 library item cho mỗi work (digital PDF)
    const workData = allWorks.find(w => w.code === work.code)
    const sensitivity = workData?.sensitivity ?? 'NORMAL'
    const mappedSensitivity = sensitivity === 'RESTRICTED' ? 'CONFIDENTIAL' : sensitivity === 'INTERNAL' ? 'CONFIDENTIAL' : 'NORMAL'

    await db.libraryItem.create({
      data: {
        workId: work.id,
        title: allWorks.find(w => w.code === work.code)?.title ?? work.code,
        filePath: `science/library/${work.code.toLowerCase()}-fulltext.pdf`,
        fileSize: BigInt(1024 * 1024 * (2 + libraryCount % 8)),  // 2-10 MB
        mimeType: 'application/pdf',
        checksumSha256: `demo-checksum-${work.code}-${Date.now()}`,
        sensitivity: mappedSensitivity,
        accessCount: Math.floor(Math.random() * 50),
        downloadCount: Math.floor(Math.random() * 20),
        isIndexed: false,
        createdById: adminUser.id,
      },
    })
    libraryCount++

    // Thêm file Word cho textbooks
    if (work.type === 'TEXTBOOK') {
      await db.libraryItem.create({
        data: {
          workId: work.id,
          title: `[Word] ${allWorks.find(w => w.code === work.code)?.title ?? work.code}`,
          filePath: `science/library/${work.code.toLowerCase()}-source.docx`,
          fileSize: BigInt(1024 * 512 * (1 + libraryCount % 5)),
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          checksumSha256: `demo-checksum-${work.code}-docx-${Date.now()}`,
          sensitivity: mappedSensitivity,
          accessCount: 0,
          downloadCount: 0,
          isIndexed: false,
          createdById: adminUser.id,
        },
      })
      libraryCount++
    }
  }

  console.log(`  → Đã tạo ${libraryCount} library items`)

  // Tóm tắt
  const worksByType = await db.scientificWork.groupBy({ by: ['type'], _count: { id: true } })
  const libCount = await db.libraryItem.count()

  console.log('\n  ✅ Scientific Works theo loại:')
  for (const t of worksByType) console.log(`     ${t.type}: ${t._count.id}`)
  console.log(`  Library Items: ${libCount} (digital files)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())

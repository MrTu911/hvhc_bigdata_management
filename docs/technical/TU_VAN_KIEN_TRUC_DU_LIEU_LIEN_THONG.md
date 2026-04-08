# TƯ VẤN KIẾN TRÚC DỮ LIỆU LIÊN THÔNG
## Hệ thống Quản lý BigData HVHC v8.0

---

## 1. PHÂN TÍCH HIỆN TRẠNG

### 1.1 Vấn đề phân mảnh dữ liệu

| Bảng | Liên kết với User | Vấn đề |
|------|-------------------|--------|
| `User` | - | Chứa cả thông tin tài khoản + cán bộ |
| `HocVien` | ❌ Chỉ có email | **Không thể đăng nhập, không liên thông** |
| `FacultyProfile` | ✅ userId | Chỉ dành cho giảng viên |
| `PartyMember` | ✅ userId | Hồ sơ đảng viên |
| `InsuranceInfo` | ✅ userId | Hồ sơ BHXH/BHYT |
| `CareerHistory` | ✅ userId | Lịch sử công tác |
| `FamilyRelation` | ✅ userId | Quan hệ gia đình |

### 1.2 Vấn đề phân loại

- **Thiếu phân loại rõ ràng**: Sĩ quan / QNCN / CNVCQP / Sinh viên dân sự
- **Thiếu cơ quan quản lý**: Ban Cán bộ / Ban Quân lực / Phòng Đào tạo
- **HocVien tách biệt hoàn toàn**: Không có userId → Không đăng nhập được

---

## 2. KIẾN TRÚC ĐỀ XUẤT

### 2.1 Nguyên tắc thiết kế

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER (Bảng gốc)                            │
│  • Mọi cán bộ đều là User (kể cả sinh viên dân sự)                  │
│  • User = Tài khoản đăng nhập + Thông tin cơ bản                   │
│  • Mỗi User có 1 personnelCategory + 1 managingOrgan               │
├─────────────────────────────────────────────────────────────────────┤
│                       LIÊN KẾT 1-1 (Hồ sơ)                         │
├───────────────┬───────────────┬───────────────┬─────────────────────┤
│ PartyMember   │ InsuranceInfo │ ScientificProfile│ StudentProfile  │
│ (Hồ sơ Đảng)  │ (BHXH/BHYT)   │ (Lý lịch KH)  │ (Hồ sơ SV dân sự)│
└───────────────┴───────────────┴───────────────┴─────────────────────┘
```

### 2.2 Mô hình phân loại cán bộ

```
                    ┌─────────────────┐
                    │      USER       │
                    │  (Mọi cán bộ)   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   QUÂN NHÂN     │  │  CÔNG NHÂN VIÊN │  │   SINH VIÊN     │
│   (militaryId)  │  │    QUỐC PHÒNG   │  │   DÂN SỰ        │
├─────────────────┤  │   (employeeId)  │  │  (studentId)    │
│ • Sĩ quan       │  └─────────────────┘  └─────────────────┘
│ • QNCN          │           │                   │
│ • HSQ-Chiến sĩ  │           │                   │
│ • Học viên QS   │           │                   │
└─────────────────┘           │                   │
         │                    │                   │
         ▼                    ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    CƠ QUAN QUẢN LÝ                          │
├─────────────────────────────────────────────────────────────┤
│ BAN CÁN BỘ          │ BAN QUÂN LỰC       │ PHÒNG ĐÀO TẠO   │
│ (Sĩ quan, HV quân sự)│ (QNCN, HSQ-CS)    │ (SV dân sự)     │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Schema cập nhật

```prisma
// ============ ENUM MỚI ============

// Loại cán bộ chi tiết
enum PersonnelCategory {
  SI_QUAN           // Sĩ quan
  QNCN              // Quân nhân chuyên nghiệp
  HSQ_CHIEN_SI      // Hạ sĩ quan - Chiến sĩ
  HOC_VIEN_QUAN_SU  // Học viên quân sự (diện Ban Cán bộ)
  CNVC_QUOC_PHONG   // Công nhân viên quốc phòng
  SINH_VIEN_DAN_SU  // Sinh viên dân sự
  GIANG_VIEN        // Giảng viên (có thể là SQ hoặc CNVCQP)
}

// Cơ quan quản lý
enum ManagingOrgan {
  BAN_CAN_BO        // Ban Cán bộ - Quản lý Sĩ quan, Học viên QS
  BAN_QUAN_LUC      // Ban Quân lực - Quản lý QNCN, HSQ-CS
  PHONG_DAO_TAO     // Phòng Đào tạo - Quản lý Sinh viên dân sự
  PHONG_CHINH_TRI   // Phòng Chính trị - Quản lý toàn bộ
}

// ============ CẬP NHẬT USER ============

model User {
  // ... các trường hiện có ...
  
  // === PHÂN LOẠI MỚI ===
  personnelCategory  PersonnelCategory?   // Loại cán bộ chi tiết
  managingOrgan      ManagingOrgan?       // Cơ quan quản lý
  
  // === ĐỊNH DANH ===
  militaryIdNumber   String?   @unique    // Mã định danh quân nhân (10 số)
  studentIdNumber    String?   @unique    // Mã sinh viên (nếu là SV dân sự)
  
  // === LIÊN KẾT HỒ SƠ ===
  partyMember        PartyMember?         // Hồ sơ đảng
  insuranceInfo      InsuranceInfo?       // Hồ sơ BHXH
  scientificProfile  ScientificProfile?   // Lý lịch khoa học
  studentProfile     StudentProfile?      // Hồ sơ SV (nếu là SV dân sự)
  facultyProfile     FacultyProfile?      // Hồ sơ giảng viên
  
  // === LIÊN KẾT ĐƠN VỊ ===
  unitId             String?
  unitRelation       Unit?    @relation(fields: [unitId], references: [id])
}

// ============ MODEL MỚI: StudentProfile ============

model StudentProfile {
  id                  String   @id @default(cuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id])
  
  // Thông tin học tập
  maHocVien           String   @unique
  lop                 String?
  khoaHoc             String?
  nganh               String?
  heDaoTao            String?  // Chính quy, Vừa làm vừa học...
  
  // Giảng viên hướng dẫn
  giangVienHuongDanId String?
  giangVienHuongDan   FacultyProfile? @relation(fields: [giangVienHuongDanId], references: [id])
  
  // Kết quả
  diemTrungBinh       Float    @default(0)
  trangThai           String   @default("Đang học")
  
  // Kết quả học tập
  ketQuaHocTap        KetQuaHocTap[]
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

---

## 3. LUỒNG XỬ LÝ DỮ LIỆU (PIPELINE)

### 3.1 Thêm mới cán bộ

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LUỒNG THÊM MỚI CÁN BỘ                          │
└─────────────────────────────────────────────────────────────────────┘

     ┌─────────────┐
     │ ADMIN/NGƯỜI │
     │ PHÂN CÔNG   │
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐      Chọn loại cán bộ:
     │ BƯỚC 1:     │      • Sĩ quan
     │ Chọn loại   │      • QNCN
     │ cán bộ      │      • HSQ-Chiến sĩ
     └──────┬──────┘      • Học viên QS
            │             • CNVCQP
            │             • Sinh viên dân sự
            ▼
     ┌─────────────┐      Tự động xác định:
     │ BƯỚC 2:     │      • managingOrgan
     │ Nhập thông  │      • Tạo tài khoản User
     │ tin cơ bản  │      • Gán unitId
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐      Tùy chọn tạo:
     │ BƯỚC 3:     │      • PartyMember (nếu là đảng viên)
     │ Tạo hồ sơ   │      • InsuranceInfo
     │ liên quan   │      • FacultyProfile (nếu là GV)
     └──────┬──────┘      • StudentProfile (nếu là SV)
            │
            ▼
     ┌─────────────────────────────────────┐
     │          DATABASE CHUNG             │
     │  (Lưu trữ tập trung, tra cứu toàn bộ)│
     └─────────────────────────────────────┘
```

### 3.2 Quy tắc mapping tự động

```typescript
// Tự động xác định cơ quan quản lý
function determineManagingOrgan(category: PersonnelCategory): ManagingOrgan {
  switch (category) {
    case 'SI_QUAN':
    case 'HOC_VIEN_QUAN_SU':
      return 'BAN_CAN_BO';        // Ban Cán bộ
    
    case 'QNCN':
    case 'HSQ_CHIEN_SI':
      return 'BAN_QUAN_LUC';      // Ban Quân lực
    
    case 'SINH_VIEN_DAN_SU':
      return 'PHONG_DAO_TAO';     // Phòng Đào tạo
    
    case 'CNVC_QUOC_PHONG':
    case 'GIANG_VIEN':
      return 'PHONG_CHINH_TRI';   // Tùy cấu hình
    
    default:
      return 'PHONG_CHINH_TRI';
  }
}

// Tự động xác định role đăng nhập
function determineUserRole(category: PersonnelCategory): UserRole {
  switch (category) {
    case 'SI_QUAN':
    case 'QNCN':
    case 'HSQ_CHIEN_SI':
    case 'CNVC_QUOC_PHONG':
      return 'CAN_BO';
    
    case 'HOC_VIEN_QUAN_SU':
    case 'SINH_VIEN_DAN_SU':
      return 'HOC_VIEN';
    
    case 'GIANG_VIEN':
      return 'GIANG_VIEN';
    
    default:
      return 'HOC_VIEN';
  }
}
```

---

## 4. HỆ THỐNG PHÂN QUYỀN (RBAC)

### 4.1 Ma trận phân quyền

```
┌────────────────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│     VAI TRÒ        │  XEM    │  SỬA    │  XÓA    │  EXPORT │  THÊM   │
├────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Chỉ huy Học viện   │ TẤT CẢ  │   ❌    │   ❌    │ TẤT CẢ  │   ❌    │
├────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Phòng Chính trị    │ TẤT CẢ  │ TẤT CẢ  │ TẤT CẢ  │ TẤT CẢ  │ TẤT CẢ  │
├────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Ban Cán bộ         │ SQ+HVQS │ SQ+HVQS │ SQ+HVQS │ SQ+HVQS │ SQ+HVQS │
├────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Ban Quân lực       │QNCN+HSQ │QNCN+HSQ │QNCN+HSQ │QNCN+HSQ │QNCN+HSQ │
├────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Phòng Đào tạo      │ SV DÂN  │ SV DÂN  │ SV DÂN  │ SV DÂN  │ SV DÂN  │
├────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Chỉ huy Đơn vị     │ ĐV MÌNH │   ❌    │   ❌    │ ĐV MÌNH │   ❌    │
├────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Cá nhân           │ BẢN THÂN│ BẢN THÂN│   ❌    │   ❌    │   ❌    │
└────────────────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

### 4.2 Logic phân quyền

```typescript
// Kiểm tra quyền truy cập hồ sơ cán bộ
function canAccessPersonnel(
  currentUser: User,
  targetUser: User,
  action: 'VIEW' | 'EDIT' | 'DELETE' | 'EXPORT'
): boolean {
  
  // 1. Chỉ huy Học viện: Xem tất cả
  if (currentUser.role === 'CHI_HUY_HOC_VIEN') {
    return action === 'VIEW' || action === 'EXPORT';
  }
  
  // 2. Phòng Chính trị: Full quyền
  if (currentUser.role === 'PHONG_CHINH_TRI' || 
      currentUser.role === 'QUAN_TRI_HE_THONG') {
    return true;
  }
  
  // 3. Cá nhân: Chỉ xem/sửa bản thân
  if (currentUser.id === targetUser.id) {
    return action === 'VIEW' || action === 'EDIT';
  }
  
  // 4. Kiểm tra theo cơ quan quản lý
  const isSameManagingOrgan = checkManagingOrgan(currentUser, targetUser);
  if (!isSameManagingOrgan) {
    return false;
  }
  
  // 5. Kiểm tra theo đơn vị (cùng đơn vị hoặc đơn vị con)
  const isSameUnit = checkUnitHierarchy(currentUser, targetUser);
  
  // 6. Chỉ huy đơn vị: Chỉ xem đơn vị mình
  if (currentUser.role === 'CHI_HUY_KHOA') {
    return isSameUnit && (action === 'VIEW' || action === 'EXPORT');
  }
  
  return false;
}

// Kiểm tra cơ quan quản lý
function checkManagingOrgan(currentUser: User, targetUser: User): boolean {
  // Ban Cán bộ chỉ quản lý Sĩ quan + Học viên QS
  if (currentUser.managingOrgan === 'BAN_CAN_BO') {
    return ['SI_QUAN', 'HOC_VIEN_QUAN_SU'].includes(targetUser.personnelCategory);
  }
  
  // Ban Quân lực chỉ quản lý QNCN + HSQ-CS
  if (currentUser.managingOrgan === 'BAN_QUAN_LUC') {
    return ['QNCN', 'HSQ_CHIEN_SI'].includes(targetUser.personnelCategory);
  }
  
  // Phòng Đào tạo chỉ quản lý SV dân sự
  if (currentUser.managingOrgan === 'PHONG_DAO_TAO') {
    return targetUser.personnelCategory === 'SINH_VIEN_DAN_SU';
  }
  
  // Phòng Chính trị quản lý tất cả
  if (currentUser.managingOrgan === 'PHONG_CHINH_TRI') {
    return true;
  }
  
  return false;
}
```

---

## 5. SƠ ĐỒ ERD LIÊN THÔNG

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UNIT (Đơn vị)                                  │
│  id, name, code, type, level, parentId, commanderId                         │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ 1:N
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER (Cán bộ)                                  │
│  id, name, email, password, role, status                                    │
│  personnelCategory, managingOrgan, unitId                                   │
│  militaryIdNumber, studentIdNumber, employeeId                              │
└───────┬───────────┬───────────┬───────────┬───────────┬─────────────────────┘
        │           │           │           │           │
        │ 1:1       │ 1:1       │ 1:1       │ 1:1       │ 1:N
        ▼           ▼           ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐
│PartyMember│ │InsuranceInfo│ │ScientificProfile│ │StudentProfile│ │CareerHistory│
│(Hồ sơ Đảng)│ │(BHXH/BHYT)│ │(Lý lịch KH)│ │(Hồ sơ SV)│ │(Lịch sử CT) │
└───────────┘ └───────────┘ └───────────┘ └─────┬─────┘ └───────────────┘
                                                │ 1:N
                                                ▼
                                          ┌───────────────┐
                                          │ KetQuaHocTap  │
                                          │ (Điểm số)     │
                                          └───────────────┘
```

---

## 6. MIGRATION SCRIPT

### 6.1 Cập nhật Prisma Schema

```prisma
// Thêm vào prisma/schema.prisma

enum PersonnelCategory {
  SI_QUAN
  QNCN
  HSQ_CHIEN_SI
  HOC_VIEN_QUAN_SU
  CNVC_QUOC_PHONG
  SINH_VIEN_DAN_SU
  GIANG_VIEN
}

enum ManagingOrgan {
  BAN_CAN_BO
  BAN_QUAN_LUC
  PHONG_DAO_TAO
  PHONG_CHINH_TRI
}

model User {
  // ... existing fields ...
  
  // Thêm mới
  managingOrgan      ManagingOrgan?
  studentIdNumber    String?         @unique
  
  // Liên kết mới
  studentProfile     StudentProfile?
}

model StudentProfile {
  id                  String          @id @default(cuid())
  userId              String          @unique
  user                User            @relation(fields: [userId], references: [id])
  
  maHocVien           String          @unique
  lop                 String?
  khoaHoc             String?
  nganh               String?
  heDaoTao            String?
  
  giangVienHuongDanId String?
  giangVienHuongDan   FacultyProfile? @relation("StudentAdvisor", fields: [giangVienHuongDanId], references: [id])
  
  diemTrungBinh       Float           @default(0)
  trangThai           String          @default("Đang học")
  
  ketQuaHocTap        KetQuaHocTap[]
  
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  
  @@map("student_profiles")
}
```

### 6.2 Script chuyển đổi dữ liệu HocVien → User + StudentProfile

```typescript
// scripts/migrate-hocvien.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function migrateHocVien() {
  const hocViens = await prisma.hocVien.findMany();
  
  for (const hv of hocViens) {
    // 1. Tạo User mới
    const email = hv.email || `${hv.maHocVien.toLowerCase()}@hvhc.edu.vn`;
    const password = await bcrypt.hash('Hv@2025', 10);
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: hv.hoTen,
        password,
        role: 'HOC_VIEN',
        personnelCategory: 'SINH_VIEN_DAN_SU',
        managingOrgan: 'PHONG_DAO_TAO',
        studentIdNumber: hv.maHocVien,
        dateOfBirth: hv.ngaySinh,
        gender: hv.gioiTinh,
        phone: hv.dienThoai,
        address: hv.diaChi,
      },
    });
    
    // 2. Tạo StudentProfile liên kết
    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        maHocVien: hv.maHocVien,
        lop: hv.lop,
        khoaHoc: hv.khoaHoc,
        nganh: hv.nganh,
        giangVienHuongDanId: hv.giangVienHuongDanId,
        diemTrungBinh: hv.diemTrungBinh,
        trangThai: hv.trangThai,
      },
    });
    
    console.log(`Migrated: ${hv.hoTen} (${hv.maHocVien})`);
  }
  
  console.log(`✅ Migrated ${hocViens.length} students`);
}

migrateHocVien()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 7. KẾ HOẠCH TRIỂN KHAI

| Giai đoạn | Công việc | Thời gian |
|-----------|-----------|----------|
| **1. Schema** | Cập nhật Prisma schema, thêm enum mới | 1 ngày |
| **2. Migration** | Chạy migration, backup dữ liệu | 1 ngày |
| **3. Data** | Chuyển đổi HocVien → User + StudentProfile | 1 ngày |
| **4. API** | Cập nhật API routes, thêm logic phân quyền | 2-3 ngày |
| **5. UI** | Cập nhật form thêm/sửa cán bộ | 2-3 ngày |
| **6. Testing** | Kiểm tra toàn bộ luồng | 1-2 ngày |

**Tổng: 8-11 ngày**

---

## 8. LỢI ÍCH SAU KHI TRIỂN KHAI

1. **Liên thông hoàn toàn**: Mọi cán bộ đều là User, đều có thể đăng nhập
2. **Phân loại rõ ràng**: Xác định chính xác loại cán bộ + cơ quan quản lý
3. **Phân quyền chi tiết**: RBAC theo cơ quan + đơn vị + cá nhân
4. **Tra cứu tập trung**: 1 nơi tra cứu toàn bộ cán bộ
5. **Báo cáo thống nhất**: Export dễ dàng theo từng nhóm

---

*Tài liệu tư vấn - HVHC BigData v8.0*
*Ngày tạo: 19/01/2026*

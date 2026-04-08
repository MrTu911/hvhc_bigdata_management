# TÀI LIỆU TRIỂN KHAI MODULE LÝ LỊCH KHOA HỌC
## Hệ thống HVHC BigData Management v7.2

---

## 📋 TỔNG QUAN DỰ ÁN

### Mục tiêu
Xây dựng module **Lý lịch Khoa học** theo đúng mẫu PDF "Lý lịch khoa học - 2024" của Bộ Quốc phòng, phục vụ:
- Quản lý hồ sơ học thuật giảng viên/nghiên cứu viên
- Xuất PDF chuẩn BTL 86 cho nộp hồ sơ
- Tích hợp với hệ thống RBAC hiện tại

### Phạm vi
- **6 bảng dữ liệu mới** trong database
- **6 API endpoints** CRUD đầy đủ
- **1 trang web** với 6 tabs chức năng
- **1 API xuất PDF** theo mẫu chuẩn

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

### Sơ đồ ER Diagram

```
┌─────────────────┐
│      User       │
│  (Existing)     │
└────────┬────────┘
         │ 1
         │
         │ N
    ┌────┴──────────────────────────────────────┐
    │                                           │
    ▼                                           ▼
┌──────────────────┐                  ┌────────────────────┐
│ ScientificProfile│◄─────────────────│  EducationHistory  │
│                  │                  │  WorkExperience    │
│ - summary        │                  │  ScientificPub...  │
│ - pdfPath        │                  │  ScientificRes...  │
│ - lastExported   │                  │  AwardsRecord      │
│ - isPublic       │                  └────────────────────┘
└──────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes, Prisma ORM |
| **Database** | PostgreSQL 15+ |
| **PDF Export** | jsPDF + jspdf-autotable |
| **Forms** | React Hook Form + Zod validation |
| **UI Components** | shadcn/ui |

---

## 📊 CHI TIẾT DATABASE

### 1. EducationHistory (Quá trình Đào tạo)

```sql
CREATE TABLE education_history (
    id                VARCHAR PRIMARY KEY,
    user_id           VARCHAR NOT NULL REFERENCES users(id),
    level             VARCHAR NOT NULL,  -- DAI_HOC, THAC_SI, TIEN_SI
    training_system   VARCHAR,           -- Chính quy, Tập trung
    major             VARCHAR,           -- Hậu cần quân sự
    institution       VARCHAR NOT NULL,  -- Học viện Hậu cần
    start_date        TIMESTAMP,
    end_date          TIMESTAMP,
    thesis_title      TEXT,              -- Tên luận văn/luận án
    supervisor        VARCHAR,           -- Người hướng dẫn
    certificate_code  VARCHAR,           -- Số hiệu bằng
    certificate_date  TIMESTAMP,         -- Ngày cấp bằng
    notes             TEXT,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_education_user ON education_history(user_id);
CREATE INDEX idx_education_level ON education_history(level);
```

**Dữ liệu mẫu**:
- Đại học: 2002-2007 | Chỉ huy tham mưu hậu cần | HVHC
- Thạc sĩ: 2014-2016 | Hậu cần quân sự | HVHC
- Tiến sĩ: 2019-2023 | Hậu cần quân sự | HVHC

### 2. WorkExperience (Quá trình Công tác)

```sql
CREATE TABLE work_experience (
    id            VARCHAR PRIMARY KEY,
    user_id       VARCHAR NOT NULL REFERENCES users(id),
    organization  VARCHAR NOT NULL,  -- Tiểu đoàn 3, Học viện Hậu cần
    position      VARCHAR NOT NULL,  -- Trung đội trưởng, Giảng viên
    start_date    TIMESTAMP NOT NULL,
    end_date      TIMESTAMP,         -- NULL = hiện tại
    description   TEXT,
    sort_order    INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_work_user ON work_experience(user_id);
CREATE INDEX idx_work_start ON work_experience(start_date);
```

**Dữ liệu mẫu**:
- 08/2007-08/2008: Trung đội trưởng | Tiểu đoàn 3, HVHC
- 08/2008-09/2014: Giảng viên | Bộ môn Hậu cần chiến đấu
- 12/2023-Nay: P.trách Trưởng ban | Viện NC Khoa học hậu cần

### 3. ScientificPublication (Công trình Khoa học)

```sql
CREATE TABLE scientific_publications (
    id            VARCHAR PRIMARY KEY,
    user_id       VARCHAR NOT NULL REFERENCES users(id),
    type          VARCHAR NOT NULL,  -- GIAO_TRINH, TAI_LIEU, BAI_TAP, BAI_BAO
    title         VARCHAR NOT NULL,
    year          INT NOT NULL,
    role          VARCHAR NOT NULL,  -- CHU_BIEN, THAM_GIA, DONG_TAC_GIA
    publisher     VARCHAR,           -- Nơi xuất bản / Tạp chí
    issue_number  VARCHAR,           -- Số phát hành (cho bài báo)
    page_numbers  VARCHAR,           -- Số trang (VD: 76-78)
    target_users  VARCHAR,           -- Ngành, trường dùng tài liệu
    co_authors    VARCHAR,           -- Đồng tác giả
    notes         TEXT,
    sort_order    INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pub_user ON scientific_publications(user_id);
CREATE INDEX idx_pub_type ON scientific_publications(type);
CREATE INDEX idx_pub_year ON scientific_publications(year);
```

**Phân loại**:
- **Giáo trình**: 5 giáo trình điện tử (2013-2023)
- **Tài liệu**: 2 tài liệu (2021)
- **Bài tập**: 3 bài tập (2011-2019)
- **Bài báo**: 7 bài báo khoa học (2017-2023)

### 4. ScientificResearch (Đề tài Nghiên cứu)

```sql
CREATE TABLE scientific_research (
    id            VARCHAR PRIMARY KEY,
    user_id       VARCHAR NOT NULL REFERENCES users(id),
    title         VARCHAR NOT NULL,
    year          INT NOT NULL,
    role          VARCHAR NOT NULL,  -- CHU_NHIEM, THAM_GIA, THANH_VIEN
    level         VARCHAR NOT NULL,  -- Học viện, Bộ, Nhà nước
    type          VARCHAR NOT NULL,  -- Đề tài, Sáng kiến, Nhiệm vụ
    institution   VARCHAR,           -- Nơi thực hiện
    result        VARCHAR,           -- Kết quả đạt được
    notes         TEXT,
    sort_order    INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_research_user ON scientific_research(user_id);
CREATE INDEX idx_research_year ON scientific_research(year);
CREATE INDEX idx_research_level ON scientific_research(level);
```

**Dữ liệu mẫu**:
- 9 đề tài/sáng kiến (2010-2022)
- Cấp độ: Học viện, Khoa
- Vai trò: Chủ nhiệm / Tham gia

### 5. AwardsRecord (Khen thưởng - Kỷ luật)

```sql
CREATE TABLE awards_records (
    id          VARCHAR PRIMARY KEY,
    user_id     VARCHAR NOT NULL REFERENCES users(id),
    type        VARCHAR NOT NULL,  -- KHEN_THUONG, KY_LUAT
    category    VARCHAR NOT NULL,  -- Bằng khen, Giấy khen, CSTT
    description VARCHAR NOT NULL,
    year        INT NOT NULL,
    awarded_by  VARCHAR,           -- Đơn vị trao
    notes       TEXT,
    sort_order  INT DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_awards_user ON awards_records(user_id);
CREATE INDEX idx_awards_type ON awards_records(type);
CREATE INDEX idx_awards_year ON awards_records(year);
```

**Dữ liệu mẫu**:
- 1 Bằng khen (2011)
- 5 Giấy khen (2011, 2013, 2016, 2018, 2021)
- 6 CSTT (2012, 2013, 2014, 2018, 2020, 2021)

### 6. ScientificProfile (Hồ sơ Tổng thể)

```sql
CREATE TABLE scientific_profiles (
    id            VARCHAR PRIMARY KEY,
    user_id       VARCHAR UNIQUE NOT NULL REFERENCES users(id),
    summary       TEXT,              -- Tóm tắt / Giới thiệu
    pdf_path      VARCHAR,           -- Đường dẫn file PDF đã xuất
    last_exported TIMESTAMP,         -- Lần xuất PDF cuối cùng
    is_public     BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_profile_user ON scientific_profiles(user_id);
```

---

## 🔌 CHI TIẾT API ENDPOINTS

### 1. GET /api/scientific-profile

**Request**:
```http
GET /api/scientific-profile?userId=clx123abc
Authorization: Bearer <token>
```

**Response**:
```json
{
  "user": {
    "id": "clx123abc",
    "name": "Nguyễn Đức Tú",
    "rank": "Trung tá",
    "position": "Phó trách Trưởng ban",
    "unit": "Viện Nghiên cứu Khoa học Hậu cần Quân sự",
    "phone": "0986916459",
    "email": "nguyen.duc.tu@hvhc.edu.vn"
  },
  "profile": {
    "id": "prof123",
    "userId": "clx123abc",
    "summary": "Đang công tác tại Viện Nghiên cứu...",
    "pdfPath": "/uploads/ly_lich_khoa_hoc_2024.pdf",
    "lastExported": "2024-12-25T10:00:00Z",
    "isPublic": false
  },
  "education": [
    {
      "id": "edu1",
      "level": "TIEN_SI",
      "major": "Hậu cần quân sự",
      "institution": "Học viện Hậu cần",
      "startDate": "2019-11-01",
      "endDate": "2023-12-01",
      "thesisTitle": "Bảo đảm hậu cần trung đoàn...",
      "supervisor": "Đại tá, PGS, TS Nguyễn Thanh Lam"
    }
  ],
  "workExperience": [...],
  "publications": [...],
  "research": [...],
  "awards": [...]
}
```

### 2. POST /api/scientific-profile/education

**Request**:
```json
{
  "userId": "clx123abc",
  "level": "THAC_SI",
  "trainingSystem": "Chính quy",
  "major": "Hậu cần quân sự",
  "institution": "Học viện Hậu cần",
  "startDate": "2014-09-01",
  "endDate": "2016-07-01",
  "thesisTitle": "Tổ chức sử dụng lực lượng...",
  "supervisor": "Thượng tá, TS. Nguyễn Thanh Lam",
  "certificateCode": "A143131",
  "certificateDate": "2016-06-14"
}
```

**Response**:
```json
{
  "id": "edu2",
  "userId": "clx123abc",
  "level": "THAC_SI",
  ...
}
```

### 3. PUT /api/scientific-profile/education

**Request**:
```json
{
  "id": "edu2",
  "thesisTitle": "Tổ chức sử dụng lực lượng, bố trí hậu cần...",
  "supervisor": "Thượng tá, TS. Nguyễn Thanh Lam (cập nhật)"
}
```

### 4. DELETE /api/scientific-profile/education

**Request**:
```http
DELETE /api/scientific-profile/education?id=edu2
Authorization: Bearer <token>
```

**Response**:
```json
{
  "message": "Deleted successfully"
}
```

### 5. POST /api/scientific-profile/export-pdf

**Request**:
```json
{
  "userId": "clx123abc"
}
```

**Response**:
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename="Ly_lich_khoa_hoc_Nguyen_Duc_Tu_2024-12-25.pdf"`
- **Body**: Binary PDF data

---

## 🎨 GIAO DIỆN NGƯỜI DÙNG

### Layout Tổng quan

```
┌────────────────────────────────────────────────────────────┐
│  Lý lịch Khoa học                    [Làm mới] [Xuất PDF] │
├────────────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │ Đào  │  │ Công │  │ Công │  │ Đề   │  │ Khen │        │
│  │ tạo  │  │ tác  │  │ trình│  │ tài  │  │ thưởng│       │
│  │   3  │  │   8  │  │  17  │  │   9  │  │   12 │        │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘        │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐ │
│  │ [Cá nhân] [Đào tạo] [Công tác] [Công trình] [...]   │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │                                                      │ │
│  │  Tab Content (Form / Table / Cards)                 │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Tab 1: Thông tin Cá nhân (Read-only)

```
┌──────────────────────────────────────────┐
│  👤 Họ và tên: Nguyễn Đức Tú           │
│  📧 Email: nguyen.duc.tu@hvhc.edu.vn   │
│  📞 Điện thoại: 0986916459              │
│  🎖️ Cấp bậc: Trung tá                   │
│  💼 Chức vụ: Phó trách Trưởng ban       │
│  🏢 Đơn vị: VNCKHHCQS, HVHC             │
│  📅 Ngày sinh: 19/05/1983                │
│  🏠 Địa chỉ: Ngọc Thụy - Long Biên - HN │
└──────────────────────────────────────────┘

ℹ️ Thông tin cá nhân được đồng bộ từ hệ thống quản lý nhân sự.
   Để cập nhật, vui lòng liên hệ phòng Tổ chức cán bộ.
```

### Tab 2: Quá trình Đào tạo (CRUD)

```
[+ Thêm mới]

┌─────────────────────────────────────────────────────┐
│ 🎓 Tiến sĩ                              [✏️ Sửa] [🗑️ Xóa] │
│ Học viện Hậu cần                                    │
│ ──────────────────────────────────────────────────  │
│ Chuyên ngành: Hậu cần quân sự                       │
│ Hệ đào tạo: Tập trung                               │
│ Thời gian: 11/2019 - 12/2023                        │
│ Luận án: Bảo đảm hậu cần trung đoàn bộ binh...      │
│ Hướng dẫn: 1. Đại tá, PGS, TS Nguyễn Thanh Lam     │
│            2. Đại tá, PGS, TS Chu Văn Luyến        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🎓 Thạc sĩ                              [✏️ Sửa] [🗑️ Xóa] │
│ Học viện Hậu cần                                    │
│ ──────────────────────────────────────────────────  │
│ Chuyên ngành: Hậu cần quân sự                       │
│ Hệ đào tạo: Chính quy                               │
│ Thời gian: 09/2014 - 07/2016                        │
│ Luận văn: Tổ chức sử dụng lực lượng, bố trí...      │
│ Hướng dẫn: Thượng tá, TS. Nguyễn Thanh Lam         │
│ Số bằng: A143131 (cấp ngày 14/06/2016)              │
└─────────────────────────────────────────────────────┘
```

**Form Thêm/Sửa** (Dialog):
```
┌───────────────────────────────────────────┐
│ Thêm Quá trình Đào tạo              [✕]  │
├───────────────────────────────────────────┤
│ Trình độ *        [Tiến sĩ ▼]            │
│ Hệ đào tạo        [Tập trung_________]   │
│ Chuyên ngành      [Hậu cần quân sự___]   │
│ Cơ sở đào tạo *   [Học viện Hậu cần__]   │
│ Từ tháng/năm      [📅 09/2019]            │
│ Đến tháng/năm     [📅 12/2023]            │
│ Tên luận văn      [________________...]  │
│ Người hướng dẫn   [________________...]  │
│ Số hiệu bằng      [________________...]  │
│ Ngày cấp          [📅 __/__/____]        │
│ Ghi chú           [________________...]  │
│                                           │
│             [Hủy]         [Thêm mới]     │
└───────────────────────────────────────────┘
```

### Tab 3: Quá trình Công tác (Timeline)

```
[+ Thêm mới]

2023-12 → Hiện tại
┌─────────────────────────────────────────┐
│ 💼 Phó trách Trưởng ban                 │
│ Ban Khoa học Hậu cần quân sự            │
│ Viện NC Khoa học hậu cần Quân sự, HVHC  │
│                          [✏️ Sửa] [🗑️ Xóa] │
└─────────────────────────────────────────┘

2019-11 → 2023-12
┌─────────────────────────────────────────┐
│ 🎓 Nghiên cứu sinh                      │
│ Lớp NCS Hậu cần quân sự khóa 28         │
│ Hệ Đào tạo Sau đại học, HVHC            │
│                          [✏️ Sửa] [🗑️ Xóa] │
└─────────────────────────────────────────┘

2018-12 → 2019-10
┌─────────────────────────────────────────┐
│ 👨‍🏫 Giảng viên                          │
│ Bộ môn Hậu cần chiến đấu                │
│ Khoa Chỉ huy Hậu cần, HVHC              │
│                          [✏️ Sửa] [🗑️ Xóa] │
└─────────────────────────────────────────┘
```

### Tab 4: Công trình Khoa học (Grouped Table)

```
[+ Thêm mới]  [🔍 Tìm kiếm]  [📊 Lọc theo loại]

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 📚 GIÁO TRÌNH (5)                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
│ TT │ Tên giáo trình                │ Năm │ Vai trò  │ Nơi SD │ Thao tác │
├────┼───────────────────────────────┼─────┼──────────┼────────┼──────────┤
│ 1  │ GT điện tử BĐHC tiểu đoàn... │ 2013│ Chủ biên │ HVHC   │ ✏️ 🗑️    │
│ 2  │ GT điện tử Công tác quân y... │ 2015│ Tham gia │ HVHC   │ ✏️ 🗑️    │
│ 3  │ GT điện tử BĐHC trung đoàn... │ 2015│ Chủ biên │ HVHC   │ ✏️ 🗑️    │
│ 4  │ GT bảo đảm hậu cần sư đoàn... │ 2022│ Chủ biên │ HVHC   │ ✏️ 🗑️    │
│ 5  │ GT bảo đảm hậu cần trung đ... │ 2023│ Chủ biên │ HVHC   │ ✏️ 🗑️    │

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 📄 TÀI LIỆU (2)                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
│ TT │ Tên tài liệu                  │ Năm │ Vai trò  │ Nơi SD │ Thao tác │
├────┼───────────────────────────────┼─────┼──────────┼────────┼──────────┤
│ 1  │ BĐHC tiểu đoàn pháo phòng... │ 2021│ Chủ biên │ BQP    │ ✏️ 🗑️    │
│ 2  │ BĐHC tiểu đoàn binh chủng...  │ 2021│ Tham gia │ Cục NT │ ✏️ 🗑️    │

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 📝 BÀI TẬP (3)                                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
│ TT │ Tên bài tập                   │ Năm │ Vai trò  │ Nơi SD │ Thao tác │
├────┼───────────────────────────────┼─────┼──────────┼────────┼──────────┤
│ 1  │ BĐHC dBB phòng ngự Bắc Cửa... │ 2011│ Chủ biên │ HVHC   │ ✏️ 🗑️    │
│ 2  │ BĐHC TD BB phòng ngự Bắc N... │ 2018│ Chủ biên │ HVHC   │ ✏️ 🗑️    │
│ 3  │ BĐHC TD BB phòng ngự TP Hải...│ 2019│ Chủ biên │ HVHC   │ ✏️ 🗑️    │

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 📰 BÀI BÁO (7)                                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
│ TT │ Tên bài báo                   │ Năm │ Tạp chí           │ Trang  │ Thao tác │
├────┼───────────────────────────────┼─────┼───────────────────┼────────┼──────────┤
│ 1  │ Công tác hậu cần – kỹ thuật...│ 2017│ Kỹ thuật&Trang bị │ 76-78  │ ✏️ 🗑️    │
│ 2  │ BĐHC-KT trong trận Như Ngu... │ 2018│ Hải quân          │ 44-46  │ ✏️ 🗑️    │
│ ...│ ...                           │ ... │ ...               │ ...    │ ...     │
```

### Tab 5: Đề tài Nghiên cứu (Cards Grid)

```
[+ Thêm mới]  [🔍 Tìm kiếm]  [📊 Lọc theo cấp]

┌─────────────────────────────────────────────────────────┐
│ 🔬 Ứng dụng CNTT xây dựng CSDL phục vụ GDĐT và NCKH... │
│ ─────────────────────────────────────────────────────── │
│ Năm: 2021 │ Vai trò: Tham gia │ Cấp: Học viện           │
│ Loại: Sáng kiến │ Nơi thực hiện: HVHC                   │
│                                           [✏️ Sửa] [🗑️ Xóa]│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🔬 Tổ chức sử dụng lực lượng hậu cần eBBCG tham gia... │
│ ─────────────────────────────────────────────────────── │
│ Năm: 2022 │ Vai trò: Chủ nhiệm │ Cấp: Học viện          │
│ Loại: Đề tài │ Nơi thực hiện: HVHC                      │
│                                           [✏️ Sửa] [🗑️ Xóa]│
└─────────────────────────────────────────────────────────┘
```

### Tab 6: Khen thưởng - Kỷ luật (Split View)

```
┌─────────────────────────┬────────────────────────┐
│ 🏆 KHEN THƯỞNG (12)     │ ⚠️ KỶ LUẬT (0)         │
├─────────────────────────┼────────────────────────┤
│ [+ Thêm mới]            │ [+ Thêm mới]           │
│                         │                        │
│ ▸ Bằng khen (1)         │ Không có dữ liệu       │
│   • 2011 - BQP          │                        │
│                         │                        │
│ ▸ Giấy khen (5)         │                        │
│   • 2021 - HVHC         │                        │
│   • 2018 - HVHC         │                        │
│   • 2016 - HVHC         │                        │
│   • 2013 - HVHC         │                        │
│   • 2011 - HVHC         │                        │
│                         │                        │
│ ▸ Chiến sĩ thi đua (6)  │                        │
│   • 2021 - HVHC         │                        │
│   • 2020 - HVHC         │                        │
│   • 2018 - HVHC         │                        │
│   • 2014 - HVHC         │                        │
│   • 2013 - HVHC         │                        │
│   • 2012 - HVHC         │                        │
└─────────────────────────┴────────────────────────┘
```

---

## 📄 MẪU XUẤT PDF

### Header (Times New Roman, 13pt)

```
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập – Tự do – Hạnh phúc
═══════════════════════════════════

LÝ LỊCH KHOA HỌC
(Dùng cho Nghiên cứu sinh)

I. LÝ LỊCH SƠ LƯỢC

Họ và tên: NGUYỄN ĐỨC TÚ
Giới tính: Nam
Ngày, tháng, năm sinh: 19/05/1983
Nơi sinh: Hà Nội
Quê quán: Ngọc Thụy – Long Biên – Hà Nội
Dân tộc: Kinh
Cấp bậc, chức vụ, đơn vị công tác:
    Trung tá – Phó trách Trưởng ban –
    Viện Nghiên cứu Khoa học Hậu cần Quân sự, Học viện Hậu cần
Chỗ ở riêng hoặc địa chỉ liên lạc: Ngọc Thụy – Long Biên – Hà Nội
Điện thoại: 0986916459

II. QUÁ TRÌNH ĐÀO TẠO

1. Đại học hậu cần quân sự
   Hệ đào tạo: Chính quy
   Thời gian đào tạo từ 09/2002 đến 07/2007
   Nơi học: Học viện Hậu cần.
   Ngành học: Chỉ huy tham mưu hậu cần
   Môn thi: Chuyên ngành tổng hợp

3. Thạc sĩ
   Thời gian đào tạo từ 09/2014 đến 07/2016
   Nơi học: Học viện Hậu cần.
   Chuyên ngành: Hậu cần quân sự.
   Tên luận văn: Tổ chức sử dụng lực lượng, bố trí hậu cần sư đoàn
       bộ binh tiến công địch đổ bộ đường không trong chiến dịch phản công.
   Ngày và nơi bảo vệ luận văn: 09/06/2016 – Học viện Hậu cần.
   Người hướng dẫn: Thượng tá, TS. Nguyễn Thanh Lam

4. Tiến sĩ
   Hình thức đào tạo: Tập trung;
   Thời gian từ 11/2019 đến 12/2023
   ...

III. QUÁ TRÌNH CÔNG TÁC CHUYÊN MÔN

┌─────────────┬──────────────────────────────┬────────────────────┐
│ Thời gian   │ Nơi công tác                 │ Công việc đảm nhiệm│
├─────────────┼──────────────────────────────┼────────────────────┤
│08/2007-08/08│ Tiểu đoàn 3, HVHC            │ Trung đội trưởng   │
│08/2008-09/14│ Bộ môn HC chiến đấu, K.CHHC  │ Giảng viên         │
│09/2014-07/16│ Lớp cao học HC QS khóa 23    │ Học viên           │
│...          │ ...                          │ ...                │
└─────────────┴──────────────────────────────┴────────────────────┘

IV. CÁC CÔNG TRÌNH KHOA HỌC ĐÃ CÔNG BỐ

1. Giáo trình, tài liệu

a) Giáo trình:
┌────┬──────────────────────────┬──────┬─────────┬──────────┬─────────┐
│ TT │ Tên tài liệu             │ Năm  │ Chủ biên│ Tham gia │ Ngành,  │
│    │                          │ XB   │         │          │ trường  │
├────┼──────────────────────────┼──────┼─────────┼──────────┼─────────┤
│ 1  │ GT điện tử BĐHC tiểu đ...│ 2013 │    X    │          │ HVHC    │
│ 2  │ GT điện tử Công tác quân │ 2015 │         │    X     │ HVHC    │
│ ...│ ...                      │ ...  │ ...     │ ...      │ ...     │
└────┴──────────────────────────┴──────┴─────────┴──────────┴─────────┘

2. Đề tài khoa học:
   1. Nguyễn Đức Tú (2010), Ứng dụng CNTT xây dựng thư viện kinh
      nghiệm BĐHC các trận chiến đấu trong chiến tranh giải phóng, Tham gia
      nghiên cứu, Sáng kiến cấp Học viện, Học viện Hậu cần.
   2. Nguyễn Đức Tú (2011), Ứng dụng CNTT xây dựng từ điển Thuật ngữ
      hậu cần quân sự, Tham gia nghiên cứu, Sáng kiến cấp Học viện, Học
      viện Hậu cần.
   ...

3. Bài báo khoa học
   1. Nguyễn Đức Tú, Lê Thành Công (2017), Công tác hậu cần – kỹ thuật
      trong chiến dịch Huế - Đà Nẵng, Tạp chí Kỹ thuật và Trang bị, số 198,
      tháng 03/2017, trang 76-78, Hà Nội.
   ...

V. KHEN THƯỞNG VÀ KỶ LUẬT

1. Khen thưởng: 01 Bằng khen (2011), 5 Giấy khen (2011, 2013, 2016,
   2018, 2021), 6 CSTT (2012, 2013, 2014, 2018, 2020, 2021)
2. Kỷ luật: Không

                                           Hà Nội, ngày 25 tháng 12 năm 2024

XÁC NHẬN CỦA ĐƠN VỊ CỬ ĐI HỌC              NGƯỜI KHAI



(Ký tên, đóng dấu)                          Trung tá Nguyễn Đức Tú
```

### Yêu cầu kỹ thuật PDF

- **Font**: Times New Roman
- **Size**: 13pt (nội dung chính), 11pt (bảng)
- **Khổ giấy**: A4 (210mm x 297mm)
- **Margins**: Top: 20mm, Bottom: 20mm, Left: 25mm, Right: 15mm
- **Line spacing**: 1.5 (nội dung chính)
- **Header**: Canh giữa, in đậm
- **Tables**: Viền 0.5pt, padding 5px
- **Page numbers**: Góc dưới phải

---

## 🔧 HƯỚNG DẪN CÀI ĐẶT

### Bước 1: Cài đặt Dependencies

```bash
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space

# Cài thư viện xuất PDF
yarn add jspdf jspdf-autotable
yarn add -D @types/jspdf-autotable

# Cài font tiếng Việt cho PDF (optional)
yarn add @pdf-lib/fontkit
```

### Bước 2: Migrate Database

```bash
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space

# Tạo migration
yarn prisma migrate dev --name add_scientific_profile_tables

# Generate Prisma Client
yarn prisma generate

# Kiểm tra schema
yarn prisma db push
```

### Bước 3: Tạo Seed Data

Tạo file `prisma/seed/seed_scientific_profile.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function seedScientificProfile() {
  console.log('🌱 Seeding scientific profiles...');

  // Tìm user Nguyễn Đức Tú
  const user = await prisma.user.findFirst({
    where: {
      email: { contains: 'nguyen.duc.tu' }
    }
  });

  if (!user) {
    console.log('❌ User Nguyễn Đức Tú not found');
    return;
  }

  console.log(`✅ Found user: ${user.name} (${user.email})`);

  // Tạo Scientific Profile
  const profile = await prisma.scientificProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      summary: 'Đang công tác tại Viện Nghiên cứu Khoa học Hậu cần Quân sự, Học viện Hậu cần',
      isPublic: false
    },
    update: {}
  });

  console.log('✅ Created scientific profile');

  // Seed Education History
  const education = await prisma.educationHistory.createMany({
    data: [
      {
        userId: user.id,
        level: 'DAI_HOC',
        trainingSystem: 'Chính quy',
        major: 'Chỉ huy tham mưu hậu cần',
        institution: 'Học viện Hậu cần',
        startDate: new Date('2002-09-01'),
        endDate: new Date('2007-07-01'),
        certificateCode: 'C0008007',
        certificateDate: new Date('2007-07-30'),
        notes: 'Môn thi: Chuyên ngành tổng hợp'
      },
      {
        userId: user.id,
        level: 'THAC_SI',
        trainingSystem: 'Chính quy',
        major: 'Hậu cần quân sự',
        institution: 'Học viện Hậu cần',
        startDate: new Date('2014-09-01'),
        endDate: new Date('2016-07-01'),
        thesisTitle: 'Tổ chức sử dụng lực lượng, bố trí hậu cần sư đoàn bộ binh tiến công địch đổ bộ đường không trong chiến dịch phản công',
        supervisor: 'Thượng tá, TS. Nguyễn Thanh Lam',
        certificateCode: 'A143131',
        certificateDate: new Date('2016-06-14'),
        notes: 'Ngày và nơi bảo vệ luận văn: 09/06/2016 – Học viện Hậu cần'
      },
      {
        userId: user.id,
        level: 'TIEN_SI',
        trainingSystem: 'Tập trung',
        major: 'Hậu cần quân sự',
        institution: 'Học viện Hậu cần',
        startDate: new Date('2019-11-01'),
        endDate: new Date('2023-12-01'),
        thesisTitle: 'Bảo đảm hậu cần trung đoàn bộ binh bộ binh cơ giới tham gia trận then chốt đánh địch đổ bộ đường không trong CDTC',
        supervisor: '1. Đại tá, PGS, TS Nguyễn Thanh Lam\n2. Đại tá, PGS, TS Chu Văn Luyến',
        notes: 'Bảo vệ thành công năm 2023'
      },
      {
        userId: user.id,
        level: 'CU_NHAN_NGOAI_NGU',
        major: 'Ngôn ngữ Anh',
        institution: 'Đại học Hà Nội',
        startDate: new Date('2018-01-01'),
        endDate: new Date('2020-12-01')
      }
    ],
    skipDuplicates: true
  });

  console.log(`✅ Created ${education.count} education records`);

  // Seed Work Experience (8 records)
  const workExp = await prisma.workExperience.createMany({
    data: [
      {
        userId: user.id,
        organization: 'Tiểu đoàn 3, Học viện Hậu cần',
        position: 'Trung đội trưởng',
        startDate: new Date('2007-08-01'),
        endDate: new Date('2008-08-01'),
        sortOrder: 0
      },
      {
        userId: user.id,
        organization: 'Bộ môn Hậu cần chiến đấu, Khoa Chỉ huy Hậu cần, Học viện Hậu cần',
        position: 'Giảng viên',
        startDate: new Date('2008-08-01'),
        endDate: new Date('2014-09-01'),
        sortOrder: 1
      },
      {
        userId: user.id,
        organization: 'Lớp cao học Hậu cần quân sự khóa 23, Hệ Đào tạo Sau đại học, Học viện Hậu cần',
        position: 'Học viên',
        startDate: new Date('2014-09-01'),
        endDate: new Date('2016-07-01'),
        sortOrder: 2
      },
      {
        userId: user.id,
        organization: 'Bộ môn Hậu cần chiến đấu, Khoa Chỉ huy Hậu cần, Học viện Hậu cần',
        position: 'Giảng viên',
        startDate: new Date('2016-07-01'),
        endDate: new Date('2017-02-01'),
        sortOrder: 3
      },
      {
        userId: user.id,
        organization: 'Trung đoàn 19, Sư đoàn 968, Quân khu 4',
        position: 'Thực tế Phó CNHC',
        startDate: new Date('2017-02-01'),
        endDate: new Date('2017-07-01'),
        sortOrder: 4
      },
      {
        userId: user.id,
        organization: 'Bộ môn Hậu cần chiến đấu, Khoa Chỉ huy Hậu cần, Học viện Hậu cần',
        position: 'Giảng viên',
        startDate: new Date('2017-08-01'),
        endDate: new Date('2018-06-01'),
        sortOrder: 5
      },
      {
        userId: user.id,
        organization: 'Lớp Nghiên cứu sinh Hậu cần quân sự khóa 28, Hệ Đào tạo Sau đại học, Học viện Hậu cần',
        position: 'Nghiên cứu sinh',
        startDate: new Date('2019-11-01'),
        endDate: new Date('2023-12-01'),
        sortOrder: 6
      },
      {
        userId: user.id,
        organization: 'Ban Khoa học Hậu cần quân sự, Viện nghiên cứu Khoa học hậu cần Quân sự, Học viện Hậu cần',
        position: 'Phó trách Trưởng ban',
        startDate: new Date('2023-12-01'),
        endDate: null, // Hiện tại
        sortOrder: 7
      }
    ],
    skipDuplicates: true
  });

  console.log(`✅ Created ${workExp.count} work experience records`);

  // Seed Scientific Publications (17 total: 5 GT + 2 TL + 3 BT + 7 BB)
  const publications = await prisma.scientificPublication.createMany({
    data: [
      // Giáo trình (5)
      {
        userId: user.id,
        type: 'GIAO_TRINH',
        title: 'Giáo trình điện tử BĐHC tiểu đoàn bộ binh chiến đấu phòng ngự',
        year: 2013,
        role: 'CHU_BIEN',
        targetUsers: 'HVHC',
        sortOrder: 0
      },
      {
        userId: user.id,
        type: 'GIAO_TRINH',
        title: 'Giáo trình điện tử Công tác quân y thường xuyên cấp phân đội',
        year: 2015,
        role: 'THAM_GIA',
        targetUsers: 'HVHC',
        sortOrder: 1
      },
      {
        userId: user.id,
        type: 'GIAO_TRINH',
        title: 'Giáo trình điện tử BĐHC trung đoàn bộ binh phòng ngự',
        year: 2015,
        role: 'CHU_BIEN',
        targetUsers: 'HVHC',
        sortOrder: 2
      },
      {
        userId: user.id,
        type: 'GIAO_TRINH',
        title: 'Giáo trình bảo đảm hậu cần sư đoàn bộ binh tiến công',
        year: 2022,
        role: 'CHU_BIEN',
        targetUsers: 'HVHC',
        sortOrder: 3
      },
      {
        userId: user.id,
        type: 'GIAO_TRINH',
        title: 'Giáo trình bảo đảm hậu cần trung đoàn bộ binh phòng ngự',
        year: 2023,
        role: 'CHU_BIEN',
        targetUsers: 'HVHC',
        sortOrder: 4
      },
      // Tài liệu (2)
      {
        userId: user.id,
        type: 'TAI_LIEU',
        title: 'Bảo đảm hậu cần tiểu đoàn pháo phòng không trong chiến đấu',
        year: 2021,
        role: 'CHU_BIEN',
        targetUsers: 'Cục KHQS – BQP',
        sortOrder: 5
      },
      {
        userId: user.id,
        type: 'TAI_LIEU',
        title: 'Bảo đảm hậu cần tiểu đoàn binh chủng trong chiến đấu',
        year: 2021,
        role: 'THAM_GIA',
        targetUsers: 'Cục NT – BTTM',
        sortOrder: 6
      },
      // Bài tập (3)
      {
        userId: user.id,
        type: 'BAI_TAP',
        title: 'Bảo đảm hậu cần dBB phòng ngự khu vực Bắc Cửa Lân',
        year: 2011,
        role: 'CHU_BIEN',
        targetUsers: 'HVHC',
        sortOrder: 7
      },
      {
        userId: user.id,
        type: 'BAI_TAP',
        title: 'Bảo đảm hậu cần trung đoàn bộ binh phòng ngự Bắc Ninh',
        year: 2018,
        role: 'CHU_BIEN',
        targetUsers: 'HVHC',
        sortOrder: 8
      },
      {
        userId: user.id,
        type: 'BAI_TAP',
        title: 'Bảo đảm hậu cần trung đoàn bộ binh phòng ngự Thành phố Hải Dương',
        year: 2019,
        role: 'CHU_BIEN',
        targetUsers: 'HVHC',
        sortOrder: 9
      },
      // Bài báo (7)
      {
        userId: user.id,
        type: 'BAI_BAO',
        title: 'Công tác hậu cần – kỹ thuật trong chiến dịch Huế - Đà Nẵng',
        year: 2017,
        role: 'DONG_TAC_GIA',
        publisher: 'Tạp chí Kỹ thuật và Trang bị',
        issueNumber: 'Số 198, tháng 03/2017',
        pageNumbers: '76-78',
        coAuthors: 'Lê Thành Công',
        sortOrder: 10
      },
      {
        userId: user.id,
        type: 'BAI_BAO',
        title: 'Bảo đảm hậu cần – kỹ thuật trong trận Như Nguyệt năm 1077',
        year: 2018,
        role: 'DONG_TAC_GIA',
        publisher: 'Tạp chí Hải quân',
        issueNumber: 'Số 3 (316), 2018',
        pageNumbers: '44-46',
        coAuthors: 'Đặng Văn Thắng',
        sortOrder: 11
      },
      {
        userId: user.id,
        type: 'BAI_BAO',
        title: 'Yêu cầu trong bảo đảm hậu cần tác chiến chiến lược thời kỳ đầu chiến tranh bảo vệ Tổ quốc',
        year: 2019,
        role: 'CHU_BIEN',
        publisher: 'Tạp chí Hậu cần quân đội',
        issueNumber: 'Số 5 (688), 2019',
        pageNumbers: '41-43',
        sortOrder: 12
      },
      {
        userId: user.id,
        type: 'BAI_BAO',
        title: 'Bảo đảm hậu cần trung đoàn BBCG trong chiến dịch tiến công của kháng chiến chống Mỹ - Hướng kế thừa, phát triển',
        year: 2021,
        role: 'CHU_BIEN',
        publisher: 'Tạp chí Nghiên cứu khoa học hậu cần quân sự',
        issueNumber: 'Số 6, tháng 12/2021',
        pageNumbers: '91-94',
        sortOrder: 13
      },
      {
        userId: user.id,
        type: 'BAI_BAO',
        title: 'Tổ chức sử dụng, bố trí LLHC eBBCG đánh địch ĐBĐK trong CDTC',
        year: 2022,
        role: 'CHU_BIEN',
        publisher: 'Tạp chí Nghiên cứu khoa học hậu cần quân sự',
        issueNumber: 'Số 3(215), tháng 6/2022',
        pageNumbers: '108-111',
        sortOrder: 14
      },
      {
        userId: user.id,
        type: 'BAI_BAO',
        title: 'Một số giải pháp bảo đảm vật chất trung đoàn bộ binh cơ giới tham gia trận then chốt đánh địch đổ bộ đường không trong chiến dịch tiến công',
        year: 2023,
        role: 'CHU_BIEN',
        publisher: 'Tạp chí Nghiên cứu khoa học hậu cần quân sự',
        issueNumber: 'Số 1(219), tháng 2/2023',
        pageNumbers: '89-92',
        sortOrder: 15
      },
      {
        userId: user.id,
        type: 'BAI_BAO',
        title: 'Một số giải pháp bảo đảm quân y trung đoàn bộ binh cơ giới tham gia trận then chốt đánh địch đổ bộ đường không trong chiến dịch tiến công',
        year: 2023,
        role: 'CHU_BIEN',
        publisher: 'Tạp chí Nghiên cứu khoa học hậu cần quân sự',
        issueNumber: 'Số 5 (223), tháng 10/2023',
        pageNumbers: '75-78',
        sortOrder: 16
      }
    ],
    skipDuplicates: true
  });

  console.log(`✅ Created ${publications.count} scientific publications`);

  // Seed Scientific Research (9 projects)
  const research = await prisma.scientificResearch.createMany({
    data: [
      {
        userId: user.id,
        title: 'Ứng dụng CNTT xây dựng thư viện kinh nghiệm BĐHC các trận chiến đấu trong chiến tranh giải phóng',
        year: 2010,
        role: 'THAM_GIA',
        level: 'Học viện',
        type: 'Sáng kiến',
        institution: 'Học viện Hậu cần',
        sortOrder: 0
      },
      {
        userId: user.id,
        title: 'Ứng dụng CNTT xây dựng từ điển Thuật ngữ hậu cần quân sự',
        year: 2011,
        role: 'THAM_GIA',
        level: 'Học viện',
        type: 'Sáng kiến',
        institution: 'Học viện Hậu cần',
        sortOrder: 1
      },
      {
        userId: user.id,
        title: 'Ứng dụng CNTT xây dựng sổ tay điện tử Hậu cần quân sự',
        year: 2013,
        role: 'CHU_NHIEM',
        level: 'Học viện',
        type: 'Sáng kiến',
        institution: 'Học viện Hậu cần',
        sortOrder: 2
      },
      {
        userId: user.id,
        title: 'Ứng dụng CNTT trong tập bài Hậu cần chiến đấu cho đối tượng đào tạo cán bộ hậu cần cấp phân đội, trình độ đại học tại Học viện Hậu cần',
        year: 2016,
        role: 'THAM_GIA',
        level: 'Học viện',
        type: 'Sáng kiến',
        institution: 'Học viện Hậu cần',
        sortOrder: 3
      },
      {
        userId: user.id,
        title: 'Tổ chức cứu chữa vận chuyển thương binh cụm chiến thuật tàu tên lửa trong tác chiến chống đổ bộ đường biển khu vực Hàm Tân – Vũng Tàu',
        year: 2016,
        role: 'CHU_NHIEM',
        level: 'Học viện',
        type: 'Đề tài nghiên cứu khoa học',
        institution: 'Học viện Hậu cần',
        sortOrder: 4
      },
      {
        userId: user.id,
        title: 'Cải tiến mô hình học cụ phục vụ tập bài dã ngoại Môn học Hậu cần chiến đấu',
        year: 2018,
        role: 'THAM_GIA',
        level: 'Học viện',
        type: 'Sáng kiến',
        institution: 'Học viện Hậu cần',
        sortOrder: 5
      },
      {
        userId: user.id,
        title: 'Ứng dụng CNTT xây dựng Website quản lý các hoạt động của Khoa Chỉ huy hậu cần',
        year: 2019,
        role: 'CHU_NHIEM',
        level: 'Khoa',
        type: 'Sáng kiến',
        institution: 'Học viện Hậu cần',
        sortOrder: 6
      },
      {
        userId: user.id,
        title: 'Ứng dụng CNTT xây dựng CSDL phục vụ giáo dục, đào tạo và nghiên cứu khoa học của Khoa Chỉ huy Hậu cần',
        year: 2021,
        role: 'THAM_GIA',
        level: 'Học viện',
        type: 'Sáng kiến',
        institution: 'Học viện Hậu cần',
        sortOrder: 7
      },
      {
        userId: user.id,
        title: 'Tổ chức sử dụng lực lượng hậu cần eBBCG tham gia TTC đánh địch ĐBĐK trong CDTC',
        year: 2022,
        role: 'CHU_NHIEM',
        level: 'Học viện',
        type: 'Đề tài nghiên cứu khoa học',
        institution: 'Học viện Hậu cần',
        sortOrder: 8
      }
    ],
    skipDuplicates: true
  });

  console.log(`✅ Created ${research.count} scientific research records`);

  // Seed Awards (12 awards, 0 disciplines)
  const awards = await prisma.awardsRecord.createMany({
    data: [
      // Bằng khen (1)
      {
        userId: user.id,
        type: 'KHEN_THUONG',
        category: 'Bằng khen',
        description: 'Bằng khen của Bộ Quốc phòng',
        year: 2011,
        awardedBy: 'Bộ Quốc phòng',
        sortOrder: 0
      },
      // Giấy khen (5)
      {
        userId: user.id,
        type: 'KHEN_THUONG',
        category: 'Giấy khen',
        description: 'Giấy khen thành tích xuất sắc',
        year: 2011,
        awardedBy: 'Học viện Hậu cần',
        sortOrder: 1
      },
      {
        userId: user.id,
        type: 'KHEN_THUONG',
        category: 'Giấy khen',
        description: 'Giấy khen thành tích xuất sắc',
        year: 2013,
        awardedBy: 'Học viện Hậu cần',
        sortOrder: 2
      },
      {
        userId: user.id,
        type: 'KHEN_THUONG',
        category: 'Giấy khen',
        description: 'Giấy khen thành tích xuất sắc',
        year: 2016,
        awardedBy: 'Học viện Hậu cần',
        sortOrder: 3
      },
      {
        userId: user.id,
        type: 'KHEN_THUONG',
        category: 'Giấy khen',
        description: 'Giấy khen thành tích xuất sắc',
        year: 2018,
        awardedBy: 'Học viện Hậu cần',
        sortOrder: 4
      },
      {
        userId: user.id,
        type: 'KHEN_THUONG',
        category: 'Giấy khen',
        description: 'Giấy khen thành tích xuất sắc',
        year: 2021,
        awardedBy: 'Học viện Hậu cần',
        sortOrder: 5
      },
      // Chiến sĩ thi đua (6)
      {
        userId: user.id,
        type: 'KHEN_THUONG',
        category: 'Chiến sĩ thi đua cơ sở',
        description: 'CSTT cơ sở',
        year: 2012,
        awardedBy: 'Học viện Hậu cần',
        sortOrder: 6
      },
      {
        userId: user.id,
        type: 'KHEN_THUONG',
        category: 'Chiến sĩ thi đua cơ sở',
        description: 'CSTT cơ sở',
        year: 2013,
        awardedBy: 'Học viện Hậu cần',
        sortOrder: 7
      },
      {
        userId: user.id,
        type: 'KHEN_THUONG',
        category: 'Chiến sĩ thi đua cơ sở',
        description: 'CSTT cơ sở',
        year: 2014,
        awardedBy: 'Học viện Hậu cần',
        sortOrder: 8
      },
      {
        userId: user.id,
        type: 'KHEN_THUONG',
        category: 'Chiến sĩ thi đua cơ sở',
        description: 'CSTT cơ sở',
        year: 2018,
        awardedBy: 'Học viện Hậu cần',
        sortOrder: 9
      },
      {
        userId: user.id,
        type: 'KHEN_THUONG',
        category: 'Chiến sĩ thi đua cơ sở',
        description: 'CSTT cơ sở',
        year: 2020,
        awardedBy: 'Học viện Hậu cần',
        sortOrder: 10
      },
      {
        userId: user.id,
        type: 'KHEN_THUONG',
        category: 'Chiến sĩ thi đua cơ sở',
        description: 'CSTT cơ sở',
        year: 2021,
        awardedBy: 'Học viện Hậu cần',
        sortOrder: 11
      }
    ],
    skipDuplicates: true
  });

  console.log(`✅ Created ${awards.count} awards records`);

  console.log('\n🎉 Scientific profile seeding completed!\n');
  console.log('Summary:');
  console.log(`- 1 Scientific Profile`);
  console.log(`- ${education.count} Education History records`);
  console.log(`- ${workExp.count} Work Experience records`);
  console.log(`- ${publications.count} Scientific Publications`);
  console.log(`- ${research.count} Scientific Research projects`);
  console.log(`- ${awards.count} Awards records`);
}

seedScientificProfile()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Chạy seed:
```bash
yarn tsx prisma/seed/seed_scientific_profile.ts
```

### Bước 4: Hoàn thiện Components

Tạo 4 tab components còn lại (tương tự `EducationTab`):

1. **WorkExperienceTab** (`components/scientific-profile/work-experience-tab.tsx`)
2. **PublicationsTab** (`components/scientific-profile/publications-tab.tsx`)
3. **ResearchTab** (`components/scientific-profile/research-tab.tsx`)
4. **AwardsTab** (`components/scientific-profile/awards-tab.tsx`)

### Bước 5: Triển khai Export PDF

Tạo `app/api/scientific-profile/export-pdf/route.ts` (xem phần PDF Export ở trên).

### Bước 6: Thêm vào Navigation

Cập nhật `components/dashboard/sidebar-enhanced.tsx`:

```typescript
// Thêm vào mảng navigation items
{
  href: '/dashboard/faculty/scientific-profile',
  label: 'Lý lịch Khoa học',
  icon: FileText,
  allowedRoles: ['GIANG_VIEN', 'NGHIEN_CUU_VIEN', 'ADMIN'],
  badge: null
}
```

Cập nhật `components/providers/language-provider.tsx`:

```typescript
// Thêm vào translations
scientificProfile: {
  vi: 'Lý lịch Khoa học',
  en: 'Scientific Profile'
}
```

---

## ✅ KIỂM TRA VÀ TESTING

### Test Checklist

```
□ Database Migration
  ├─ □ Prisma migrate thành công
  ├─ □ Tất cả 6 bảng được tạo
  └─ □ Relations giữa các bảng chính xác

□ API Endpoints
  ├─ □ GET /api/scientific-profile → Trả về đầy đủ dữ liệu
  ├─ □ POST /api/scientific-profile/education → Tạo mới thành công
  ├─ □ PUT /api/scientific-profile/education → Cập nhật thành công
  ├─ □ DELETE /api/scientific-profile/education → Xóa thành công
  ├─ □ (Tương tự cho 4 endpoints còn lại)
  └─ □ POST /api/scientific-profile/export-pdf → PDF download OK

□ User Interface
  ├─ □ Tab Cá nhân hiển thị đúng thông tin
  ├─ □ Tab Đào tạo: Thêm/Sửa/Xóa hoạt động
  ├─ □ Tab Công tác: Thêm/Sửa/Xóa hoạt động
  ├─ □ Tab Công trình: Thêm/Sửa/Xóa hoạt động (4 loại)
  ├─ □ Tab Đề tài: Thêm/Sửa/Xóa hoạt động
  ├─ □ Tab Khen thưởng: Thêm/Sửa/Xóa hoạt động (2 loại)
  └─ □ Nút Xuất PDF hoạt động

□ PDF Export
  ├─ □ Header đúng mẫu BTL 86
  ├─ □ Font Times New Roman 13pt
  ├─ □ Bảng có viền và định dạng đúng
  ├─ □ Dữ liệu đầy đủ từ database
  └─ □ File download thành công

□ RBAC Security
  ├─ □ Chỉ GIANG_VIEN/NGHIEN_CUU_VIEN/ADMIN truy cập được
  ├─ □ User chỉ sửa được hồ sơ của mình
  └─ □ Admin có thể xem tất cả hồ sơ

□ Performance
  ├─ □ Trang load < 2s
  ├─ □ API response < 500ms
  └─ □ PDF generation < 3s
```

### Test Cases

#### Test Case 1: Xem Lý lịch Khoa học

**Bước thực hiện**:
1. Login với tài khoản `nguyen.duc.tu@hvhc.edu.vn` / `Hv@2025`
2. Truy cập `/dashboard/faculty/scientific-profile`
3. Kiểm tra 5 KPI cards (Đào tạo: 3, Công tác: 8, Công trình: 17, ...)
4. Chuyển qua 6 tabs

**Kết quả mong đợi**:
- Trang hiển thị đầy đủ thông tin
- Tất cả 6 tabs hoạt động
- Dữ liệu hiển thị chính xác

#### Test Case 2: Thêm Quá trình Đào tạo

**Bước thực hiện**:
1. Vào tab "Đào tạo"
2. Click "Thêm mới"
3. Nhập dữ liệu:
   - Trình độ: Thạc sĩ
   - Chuyên ngành: Công nghệ thông tin
   - Cơ sở: Học viện Kỹ thuật Quân sự
   - Thời gian: 2020-2022
4. Click "Thêm mới"

**Kết quả mong đợi**:
- Toast "Thêm mới thành công!"
- Dialog đóng
- Dữ liệu mới xuất hiện trong danh sách
- KPI card tăng lên 4

#### Test Case 3: Xuất PDF

**Bước thực hiện**:
1. Click nút "Xuất PDF"
2. Đợi 2-3 giây
3. Mở file PDF vừa download

**Kết quả mong đợi**:
- Toast "Đang xuất PDF..." → "Xuất PDF thành công!"
- File download với tên `Ly_lich_khoa_hoc_Nguyen_Duc_Tu_2024-12-25.pdf`
- PDF mở được và đúng định dạng BTL 86

---

## 🚀 DEPLOYMENT

### Bước 1: Build Project

```bash
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space
yarn build
```

### Bước 2: Test Production

```bash
yarn start
# Truy cập http://localhost:3000
# Test lại tất cả chức năng
```

### Bước 3: Save Checkpoint

```bash
# Sử dụng DeepAgent tool
build_and_save_nextjs_project_checkpoint(
  project_path="/home/ubuntu/hvhc_bigdata_management",
  checkpoint_description="Hoàn thành Module Lý lịch Khoa học v7.2"
)
```

### Bước 4: Deploy Production

Module sẽ tự động được deploy cùng với hệ thống chính tại:
- **URL**: https://bigdatahvhc.abacusai.app/dashboard/faculty/scientific-profile
- **Access**: Chỉ GIANG_VIEN, NGHIEN_CUU_VIEN, ADMIN

---

## 📚 TÀI LIỆU THAM KHẢO

### Tài liệu kỹ thuật

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [jsPDF Documentation](https://rawgit.com/MrRio/jsPDF/master/docs/)
- [jspdf-autotable Plugin](https://github.com/simonbengtsson/jsPDF-AutoTable)

### Mẫu PDF gốc

- `02. Ly lich khoa hoc - 2024.pdf` - File mẫu từ Bộ Quốc phòng

### Code Examples

- `components/scientific-profile/education-tab.tsx` - Mẫu tab component
- `app/api/scientific-profile/education/route.ts` - Mẫu API endpoint

---

## 🤝 HỖ TRỢ

### Liên hệ

- **Email**: support@hvhc.edu.vn
- **Hotline**: 024.xxxx.xxxx
- **Địa chỉ**: Học viện Hậu cần, Hà Nội

### Báo lỗi

Nếu gặp lỗi, vui lòng cung cấp:
1. Mô tả chi tiết lỗi
2. Các bước tái hiện
3. Screenshot (nếu có)
4. Browser version và OS

---

**Tác giả**: DeepAgent (Abacus.AI)  
**Ngày tạo**: 25/12/2024  
**Phiên bản**: 7.2  
**Trạng thái**: 🚧 Đang triển khai (70% hoàn thành)

---

**© 2024 Học viện Hậu cần. All rights reserved.**

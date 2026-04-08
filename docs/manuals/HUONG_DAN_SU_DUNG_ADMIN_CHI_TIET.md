# HƯỚNG DẪN SỬ DỤNG PHẦN MỀM HVHC BIGDATA
## DÀNH CHO QUẢN TRỊ VIÊN HỆ THỐNG

**Phiên bản:** 8.0  
**Cập nhật:** 20/02/2026  
**Tài khoản mẫu:** admin@hvhc.edu.vn / Hv@2025

---

## MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Quy trình nhập liệu theo thứ tự bắt buộc](#2-quy-trình-nhập-liệu-theo-thứ-tự-bắt-buộc)
3. [Sơ đồ phụ thuộc dữ liệu](#3-sơ-đồ-phụ-thuộc-dữ-liệu)
4. [Hướng dẫn chi tiết từng chức năng](#4-hướng-dẫn-chi-tiết-từng-chức-năng)
5. [Tài khoản demo](#5-tài-khoản-demo)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Kiến trúc phân lớp dữ liệu

Hệ thống HVHC BigData được thiết kế theo nguyên tắc **phụ thuộc dữ liệu tầng** (Data Layer Dependencies):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TẦNG 4: BÁO CÁO & AI                           │
│   (Thống kê, Phân tích, Dự đoán, Báo cáo tự động)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                     TẦNG 3: NGHIỆP VỤ CHUYÊN SÂU                       │
│   (Kết quả học tập, NCKH, Thi đua khen thưởng, Bảo hiểm)               │
├─────────────────────────────────────────────────────────────────────────┤
│                      TẦNG 2: DỮ LIỆU NGHIỆP VỤ                         │
│   (Giảng viên, Học viên, Môn học, Đảng viên)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                      TẦNG 1: DỮ LIỆU NỀN TẢNG                          │
│   (Đơn vị, Khoa/Phòng, Tài khoản, RBAC, Personnel)                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Nguyên tắc quan trọng

> ⚠️ **PHẢI nhập liệu theo thứ tự từ TẦNG 1 → TẦNG 4**  
> Dữ liệu tầng cao phụ thuộc vào dữ liệu tầng thấp

---

## 2. QUY TRÌNH NHẬP LIỆU THEO THỨ TỰ BẮT BUỘC

### BƯỚC 1: Thiết lập cấu trúc tổ chức (Bắt buộc đầu tiên)

| STT | Công việc | Đường dẫn | Ghi chú |
|-----|-----------|-----------|----------|
| 1.1 | Tạo cây đơn vị (Unit) | `/dashboard/admin/units` | Học viện → Khoa → Bộ môn → Tổ |
| 1.2 | Tạo Khoa/Phòng (Department) | `/dashboard/admin/departments` | Liên kết với Unit |
| 1.3 | Thiết lập chức danh RBAC (Position) | `/dashboard/admin/rbac` (Tab Positions) | 23 chức danh chuẩn |
| 1.4 | Thiết lập chức năng RBAC (Function) | `/dashboard/admin/rbac` (Tab Functions) | 71 function code |
| 1.5 | Gán quyền Position-Function | `/dashboard/admin/rbac` (Tab Assignments) | Ma trận phân quyền |

### BƯỚC 2: Quản lý nhân sự cơ sở (Sau Bước 1)

| STT | Công việc | Đường dẫn | Phụ thuộc |
|-----|-----------|-----------|------------|
| 2.1 | Tạo hồ sơ Personnel | `/dashboard/personnel/create` | Unit, Department |
| 2.2 | Tạo tài khoản User | `/dashboard/admin/users` | Không bắt buộc phụ thuộc |
| 2.3 | Liên kết User ↔ Personnel | `/dashboard/admin/link-personnel` | User + Personnel |
| 2.4 | Gán chức danh cho User | `/dashboard/admin/rbac` (Tab User Assignments) | User + Position + Unit |

### BƯỚC 3: Thiết lập đào tạo (Sau Bước 2)

| STT | Công việc | Đường dẫn | Phụ thuộc |
|-----|-----------|-----------|------------|
| 3.1 | Tạo hồ sơ Giảng viên (FacultyProfile) | `/dashboard/faculty/list` → Thêm | Personnel + Department |
| 3.2 | Tạo hệ số môn học | `/dashboard/admin/he-so-mon-hoc` | Department |
| 3.3 | Gán môn giảng dạy cho GV | `/dashboard/faculty/subjects` | FacultyProfile + HệSốMôn |
| 3.4 | Tạo hồ sơ Học viên (HocVien) | `/dashboard/student/list` → Thêm | Department, FacultyProfile (Advisor) |

### BƯỚC 4: Nhập dữ liệu nghiệp vụ (Sau Bước 3)

| STT | Công việc | Đường dẫn | Phụ thuộc |
|-----|-----------|-----------|------------|
| 4.1 | Nhập kết quả học tập | `/dashboard/student/[id]` → Tab Điểm | HocVien + HệSốMôn |
| 4.2 | Tạo dự án NCKH | `/dashboard/faculty/research` | FacultyProfile |
| 4.3 | Tạo hồ sơ Đảng viên | `/dashboard/party/create` | Personnel |
| 4.4 | Tạo hồ sơ Thi đua/Khen thưởng | `/dashboard/policy/rewards` | Personnel |
| 4.5 | Tạo hồ sơ Kỷ luật | `/dashboard/policy/discipline` | Personnel |
| 4.6 | Tạo hồ sơ Bảo hiểm | `/dashboard/insurance` | Personnel |

### BƯỚC 5: Phân tích & Báo cáo (Sau Bước 4)

| STT | Công việc | Đường dẫn | Phụ thuộc |
|-----|-----------|-----------|------------|
| 5.1 | Xem Dashboard tổng quan | `/dashboard` | Tất cả dữ liệu |
| 5.2 | Xem Command Dashboard | `/dashboard/command` | Tất cả dữ liệu |
| 5.3 | Phân tích AI | `/dashboard/ai-advisor` | Dữ liệu đủ lớn |
| 5.4 | Xuất báo cáo | `/dashboard/reports` | Dữ liệu nghiệp vụ |

---

## 3. SƠ ĐỒ PHỤ THUỘC DỮ LIỆU

```
                              ┌──────────────┐
                              │   REPORTS    │
                              │   AI/KPIs    │
                              └──────┬───────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  Kết quả HT   │           │    NCKH       │           │  Thi đua/KT   │
│  (Grades)     │           │  (Research)   │           │  (Awards)     │
└───────┬───────┘           └───────┬───────┘           └───────┬───────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   HỌC VIÊN    │◄──────────│  GIẢNG VIÊN   │───────────►│   ĐẢNG VIÊN   │
│   (HocVien)   │  Advisor  │(FacultyProfile)│           │  (PartyMember)│
└───────┬───────┘           └───────┬───────┘           └───────┬───────┘
        │                           │                           │
        │                           ▼                           │
        │                   ┌───────────────┐                   │
        └──────────────────►│  HỆ SỐ MÔN   │◄──────────────────┘
                            │  (HeSoMonHoc) │
                            └───────┬───────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │  PERSONNEL    │◄───────────────────┐
                            │  (Nhân sự)    │                    │
                            └───────┬───────┘                    │
                                    │                            │
        ┌───────────────────────────┼────────────────────────────┤
        │                           │                            │
        ▼                           ▼                            ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│     USER      │◄──Link───►│     UNIT      │◄──────────│  DEPARTMENT   │
│  (Tài khoản)  │           │   (Đơn vị)    │           │  (Khoa/Phòng) │
└───────┬───────┘           └───────────────┘           └───────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────────┐
│                              RBAC                                     │
│   Position (Chức danh) ──► PositionFunction ◄── Function (Chức năng)  │
│           ▲                                                           │
│           │                                                           │
│   UserPosition (Gán chức danh cho User)                               │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 4. HƯỚNG DẪN CHI TIẾT TỪNG CHỨC NĂNG

### 4.1 NHÓM 1: TỔNG QUAN (DASHBOARDS)

#### 4.1.1 Dashboard Chính (`/dashboard`)

**Mục đích:** Hiển thị tổng quan toàn bộ hệ thống

**Các bước:**
1. Đăng nhập vào hệ thống
2. Tự động chuyển đến Dashboard chính
3. Xem các KPI tiles: Tổng người dùng, Đơn vị, Khóa học...
4. Các biểu đồ tự động cập nhật mỗi 60 giây

**Dữ liệu cần có trước:** Tất cả dữ liệu từ các module

---

#### 4.1.2 Command Dashboard (`/dashboard/command`)

**Mục đích:** Dashboard dành cho Ban Giám đốc và Chỉ huy

**Quyền truy cập:** CHI_HUY_HOC_VIEN, ADMIN

**Các tab:**
- **Executive Summary:** Tổng quan điều hành
- **Personnel Stats:** Thống kê nhân sự
- **Training Stats:** Thống kê đào tạo
- **Performance:** Hiệu suất hoạt động

**Dữ liệu cần có:** Personnel, Student, Grades, Courses

---

### 4.2 NHÓM 2: CSDL NHÂN SỰ

#### 4.2.1 Tổng quan Nhân sự (`/dashboard/personnel`)

**Mục đích:** Hiển thị thống kê nhân sự toàn Học viện

**Các bước:**
1. Truy cập menu "CSDL Nhân sự" → "Tổng quan"
2. Xem các KPI: Tổng quân số, Tỷ lệ hoạt động...
3. Biểu đồ phân bố theo đơn vị, quân hàm

---

#### 4.2.2 Danh sách Nhân sự (`/dashboard/personnel/list`)

**Mục đích:** Xem và tìm kiếm danh sách cán bộ

**Các bước:**
1. Truy cập "CSDL Nhân sự" → "Danh sách"
2. Sử dụng bộ lọc: Đơn vị, Quân hàm, Chức vụ
3. Tìm kiếm theo tên, mã quân nhân
4. Click vào dòng để xem chi tiết
5. Nút "Export" để xuất Excel/CSV

**Các thao tác:**
- 👁️ Xem chi tiết
- ✏️ Sửa thông tin
- 🗑️ Xóa (chỉ Admin)

---

#### 4.2.3 Tạo mới Nhân sự (`/dashboard/personnel/create`)

**Mục đích:** Thêm hồ sơ cán bộ mới

**⚠️ Dữ liệu cần có TRƯỚC:**
- ✅ Đơn vị (Unit) đã được tạo
- ✅ Khoa/Phòng (Department) đã được tạo

**Các bước:**
1. Truy cập "CSDL Nhân sự" → "Thêm mới"
2. Điền thông tin cơ bản:
   - Họ và tên (*)
   - Ngày sinh
   - Giới tính
   - Quê quán
3. Chọn Đơn vị từ dropdown (*)
4. Điền thông tin quân sự:
   - Mã quân nhân
   - Quân hàm
   - Chức vụ
   - Ngày nhập ngũ
5. Điền thông tin học vấn:
   - Trình độ
   - Học hàm/Học vị
6. Nhấn "Lưu"

**Sau khi tạo xong:**
- Có thể tạo tài khoản User và liên kết
- Có thể tạo FacultyProfile nếu là giảng viên
- Có thể tạo hồ sơ Đảng viên

---

#### 4.2.4 Thống kê Nhân sự (`/dashboard/personnel/stats`)

**Mục đích:** Phân tích dữ liệu nhân sự

**Các biểu đồ:**
- Phân bố theo quân hàm (Pie Chart)
- Phân bố theo đơn vị (Bar Chart)
- Xu hướng biến động nhân sự (Line Chart)

---

### 4.3 NHÓM 3: CSDL ĐẢNG VIÊN

#### 4.3.1 Tổng quan Đảng (`/dashboard/party`)

**Mục đích:** Thống kê công tác Đảng

**Dữ liệu hiển thị:**
- Tổng số Đảng viên
- Phân loại: Chính thức, Dự bị
- Đảng viên theo chi bộ

---

#### 4.3.2 Tạo Đảng viên (`/dashboard/party/create`)

**⚠️ Dữ liệu cần có TRƯỚC:**
- ✅ Hồ sơ Personnel của cán bộ
- ✅ Đơn vị (Unit) - Chi bộ

**Các bước:**
1. Truy cập "CSDL Đảng" → "Thêm mới"
2. Tìm và chọn cán bộ từ Personnel
3. Điền thông tin Đảng:
   - Ngày vào Đảng
   - Ngày chính thức
   - Chức vụ Đảng
   - Chi bộ
4. Upload giấy tờ liên quan
5. Nhấn "Lưu"

---

### 4.4 NHÓM 4: THI ĐUA - KHEN THƯỞNG - CHÍNH SÁCH

#### 4.4.1 Tổng quan Chính sách (`/dashboard/policy`)

**Mục đích:** Dashboard thi đua khen thưởng

**Hiển thị:**
- Tổng số quyết định khen thưởng/kỷ luật
- Phân loại theo loại hình
- Thống kê theo năm

---

#### 4.4.2 Khen thưởng (`/dashboard/policy/rewards`)

**⚠️ Dữ liệu cần có TRƯỚC:**
- ✅ Hồ sơ Personnel

**Các bước tạo khen thưởng:**
1. Click "Thêm khen thưởng"
2. Chọn cán bộ được khen
3. Chọn loại khen thưởng:
   - Bằng khen, Giấy khen, Huân chương...
4. Điền thông tin:
   - Số quyết định
   - Ngày quyết định
   - Lý do
   - Cấp khen (Bộ, Học viện, Khoa...)
5. Upload file quyết định
6. Nhấn "Lưu" → Trạng thái: PROPOSED

**Workflow phê duyệt:**
```
PROPOSED → UNDER_REVIEW → APPROVED/REJECTED
```

---

#### 4.4.3 Kỷ luật (`/dashboard/policy/discipline`)

**Tương tự Khen thưởng** với các hình thức kỷ luật:
- Khiển trách
- Cảnh cáo
- Cách chức
- ...

---

#### 4.4.4 Bảo hiểm (`/dashboard/insurance`)

**⚠️ Dữ liệu cần có TRƯỚC:**
- ✅ Hồ sơ Personnel

**Thông tin quản lý:**
- Mã BHXH, BHYT, BHTN
- Ngày bắt đầu/kết thúc
- Đơn vị đóng
- Quá trình đóng BHXH

---

### 4.5 NHÓM 5: CSDL ĐÀO TẠO

#### 4.5.1 Danh sách Giảng viên (`/dashboard/faculty/list`)

**⚠️ Dữ liệu cần có TRƯỚC:**
- ✅ Hồ sơ Personnel
- ✅ Khoa/Phòng (Department)

**Các bước tạo Giảng viên:**
1. Click "Thêm giảng viên"
2. Chọn Personnel từ danh sách
3. Chọn Khoa/Phòng (*)
4. Điền thông tin học thuật:
   - Học hàm (GS, PGS, ...)
   - Học vị (TS, ThS, CN)
   - Chuyên ngành
   - Email học thuật
5. Nhấn "Lưu"

**Sau khi tạo:**
- Có thể gán môn giảng dạy
- Có thể tạo dự án NCKH
- Có thể gán làm Advisor cho Học viên

---

#### 4.5.2 Hồ sơ Giảng viên (`/dashboard/faculty/profile`)

**Mục đích:** Giảng viên tự xem/cập nhật hồ sơ của mình

**Các tab:**
- Thông tin cá nhân
- Môn giảng dạy
- Dự án NCKH
- Công bố khoa học
- AI Analytics (Radar Chart EIS)

---

#### 4.5.3 Hệ số môn học (`/dashboard/admin/he-so-mon-hoc`) ⭐ QUAN TRỌNG

**⚠️ PHẢI tạo TRƯỚC khi nhập điểm**

**Mục đích:** Định nghĩa công thức tính điểm cho từng môn

**Các bước:**
1. Truy cập "Giảng dạy & NCKH" → "Hệ số môn học"
2. Click "Thêm hệ số"
3. Điền thông tin:
   - Mã môn (*)
   - Tên môn (*)
   - Khoa phụ trách
   - Số tín chỉ
4. Điền hệ số điểm thành phần:
   - Hệ số Chuyên cần (VD: 0.1)
   - Hệ số Giữa kỳ (VD: 0.2)
   - Hệ số Bài tập (VD: 0.2)
   - Hệ số Thi cuối kỳ (VD: 0.5)
5. ⚠️ **Tổng hệ số PHẢI = 1.0** (hệ thống validation tự động)
6. Nhấn "Lưu"

**Công thức tính điểm:**
```
Điểm tổng kết = CC×0.1 + GK×0.2 + BT×0.2 + Thi×0.5
```

---

#### 4.5.4 Danh sách Học viên (`/dashboard/student/list`)

**⚠️ Dữ liệu cần có TRƯỚC:**
- ✅ Khoa/Phòng (Department)
- ✅ Giảng viên (FacultyProfile) - để gán Advisor

**Các bước tạo Học viên:**
1. Click "Thêm học viên"
2. Điền thông tin cá nhân:
   - Họ tên (*)
   - Mã học viên (*) - Duy nhất
   - Ngày sinh, Giới tính
   - Quê quán
3. Chọn Khoa (*)
4. Chọn Lớp
5. Chọn Giảng viên hướng dẫn (Advisor)
6. Điền thông tin khác:
   - Năm nhập học
   - Hệ đào tạo
   - Trạng thái
7. Nhấn "Lưu"

**Sau khi tạo:**
- Có thể nhập kết quả học tập
- Hệ thống tự tính GPA
- Có thể xem AI insights về học viên

---

#### 4.5.5 Chi tiết Học viên (`/dashboard/student/[id]`)

**Các tab:**
- **Thông tin:** Hồ sơ cá nhân
- **Kết quả học tập:** Bảng điểm các môn
- **AI Insights:** Dự đoán rủi ro, xu hướng GPA

**Nhập điểm:**
1. Vào tab "Kết quả học tập"
2. Click "Thêm kết quả"
3. Chọn môn học (từ HệSốMôn)
4. Điền điểm thành phần:
   - Điểm chuyên cần
   - Điểm giữa kỳ
   - Điểm bài tập
   - Điểm thi
5. Hệ thống TỰ ĐỘNG tính điểm tổng kết và xếp loại
6. Workflow: DRAFT → SUBMITTED → APPROVED

---

### 4.6 NHÓM 6: GIẢNG DẠY & NCKH

#### 4.6.1 Môn giảng dạy (`/dashboard/faculty/subjects`)

**⚠️ Dữ liệu cần có TRƯỚC:**
- ✅ FacultyProfile của giảng viên
- ✅ HệSốMônHọc

**Các bước gán môn:**
1. Chọn giảng viên
2. Click "Gán môn"
3. Chọn môn từ danh sách HệSốMôn
4. Điền thông tin:
   - Năm học
   - Học kỳ
   - Số tiết/tuần
5. Nhấn "Lưu"

---

#### 4.6.2 Phân tích Giảng dạy (`/dashboard/faculty/teaching-analytics`)

**Mục đích:** Đánh giá hiệu quả giảng dạy

**Biểu đồ:**
- Điểm TB theo môn
- Xu hướng theo học kỳ
- Tỷ lệ đạt/rớt

**Export:** CSV, PDF

---

#### 4.6.3 Dự án NCKH (`/dashboard/faculty/research`)

**⚠️ Dữ liệu cần có TRƯỚC:**
- ✅ FacultyProfile của giảng viên

**Các bước tạo dự án:**
1. Click "Tạo dự án"
2. Điền thông tin:
   - Tên dự án (*)
   - Loại: Cấp Nhà nước, Cấp Bộ, Cấp Học viện...
   - Kinh phí
   - Năm bắt đầu/kết thúc
3. Chọn thành viên tham gia
4. Upload đề cương
5. Nhấn "Lưu" → Trạng thái: DRAFT

**Workflow:**
```
DRAFT → SUBMITTED → APPROVED → COMPLETED/REJECTED
```

---

### 4.7 NHÓM 7: PHÂN TÍCH & AI

#### 4.7.1 AI Advisor (`/dashboard/ai-advisor`)

**Mục đích:** Tư vấn AI tự động

**Tính năng:**
- Chat với AI về dữ liệu hệ thống
- Phân tích xu hướng
- Dự đoán rủi ro
- Đề xuất hành động

**Yêu cầu:** Dữ liệu đủ lớn để AI phân tích

---

#### 4.7.2 Báo cáo (`/dashboard/reports`)

**Loại báo cáo:**
- Báo cáo tháng tự động
- Báo cáo nhân sự
- Báo cáo đào tạo
- Báo cáo NCKH

**Export:** PDF, Excel

---

### 4.8 NHÓM 8: QUẢN LÝ DỮ LIỆU

#### 4.8.1 Data Lake (`/dashboard/datalake`)

**Mục đích:** Quản lý kho dữ liệu tập trung

**Chức năng:**
- Xem tổng quan các dataset
- Metadata management
- Data quality metrics

---

#### 4.8.2 Upload dữ liệu (`/dashboard/data/upload`)

**Hỗ trợ định dạng:**
- Excel (.xlsx, .xls)
- CSV
- JSON

**Các bước:**
1. Chọn loại dữ liệu (Personnel, Student, ...)
2. Kéo thả hoặc chọn file
3. Preview dữ liệu
4. Map cột với trường trong DB
5. Validate dữ liệu
6. Import

---

#### 4.8.3 Query dữ liệu (`/dashboard/data/query`)

**Mục đích:** Truy vấn dữ liệu linh hoạt

**Tính năng:**
- Query builder trực quan
- SQL editor cho người dùng nâng cao
- Export kết quả

---

### 4.9 NHÓM 9: ML & MÔ HÌNH

#### 4.9.1 Quản lý Model (`/dashboard/ml/models`)

**Mục đích:** Xem và quản lý các model ML

**Models có sẵn:**
- Dự đoán kết quả học tập
- Dự đoán rủi ro học viên
- Phân loại văn bản

---

#### 4.9.2 Experiments (`/dashboard/ml/experiments`)

**Mục đích:** Theo dõi thí nghiệm ML

**Thông tin:**
- Metrics (Accuracy, F1, AUC)
- Hyperparameters
- Training logs

---

### 4.10 NHÓM 10: QUẢN TRỊ HỆ THỐNG ⭐ ADMIN ONLY

#### 4.10.1 Admin Dashboard (`/dashboard/admin`)

**Quyền:** ADMIN, QUAN_TRI_HE_THONG

**Hiển thị:**
- Thống kê hệ thống
- Users online
- Service health
- Recent activities

---

#### 4.10.2 Quản lý Tài khoản (`/dashboard/admin/users`)

**Chức năng:**
- Xem danh sách Users
- Tạo User mới
- Khóa/Mở khóa tài khoản
- Reset mật khẩu
- Xóa User

**Các bước tạo User:**
1. Click "Thêm người dùng"
2. Điền thông tin:
   - Họ tên (*)
   - Email (*) - Duy nhất
   - Mật khẩu (tối thiểu 8 ký tự)
   - Role: USER, ADMIN, ...
3. Nhấn "Tạo"

---

#### 4.10.3 Quản lý RBAC (`/dashboard/admin/rbac`) ⭐ QUAN TRỌNG

**Tab 1: Positions (Chức danh)**
- Tạo/Sửa/Xóa chức danh
- VD: TRUONG_KHOA, PHO_TRUONG_KHOA, GIANG_VIEN...

**Tab 2: Functions (Chức năng)**
- Tạo/Sửa/Xóa function codes
- VD: VIEW_PERSONNEL, EDIT_STUDENT, DELETE_GRADE...

**Tab 3: Assignments (Ma trận quyền)**
1. Chọn Chức danh từ dropdown
2. Hệ thống hiển thị ma trận các Function theo Module
3. Check/Uncheck để gán/bỏ quyền
4. Tự động lưu

**Tab 4: User Assignments (Gán cho User)**
1. Click "Gán chức danh"
2. Chọn User
3. Chọn Position
4. Chọn Unit (phạm vi áp dụng)
5. Điền ngày bắt đầu
6. Nhấn "Gán"

---

#### 4.10.4 Liên kết Personnel (`/dashboard/admin/link-personnel`)

**Mục đích:** Liên kết User account với hồ sơ Personnel

**Tại sao cần:**
- User = Tài khoản đăng nhập
- Personnel = Hồ sơ nhân sự chi tiết
- Liên kết để User có đầy đủ thông tin

**Các bước:**
1. Lọc Users chưa liên kết
2. Click "Liên kết" trên dòng User
3. Tìm và chọn Personnel phù hợp
4. Xác nhận liên kết

---

#### 4.10.5 Quản lý Đơn vị (`/dashboard/admin/units`) ⭐ LÀM ĐẦU TIÊN

**Cấu trúc cây:**
```
Học viện Hậu cần (Level 0)
├── Khoa CNTT (Level 1)
│   ├── Bộ môn Công nghệ phần mềm (Level 2)
│   ├── Bộ môn Mạng máy tính (Level 2)
│   └── Bộ môn HTTT (Level 2)
├── Khoa Kinh tế (Level 1)
│   └── ...
└── Phòng Đào tạo (Level 1)
```

**Các bước tạo:**
1. Click "Thêm đơn vị"
2. Điền thông tin:
   - Mã đơn vị (*) - VD: CNTT, KT, PDT
   - Tên đơn vị (*)
   - Loại: Khoa, Phòng, Bộ môn, Tổ
   - Đơn vị cha (chọn từ cây)
   - Level (tự động tính)
3. Nhấn "Lưu"

---

#### 4.10.6 Quản lý Khoa/Phòng (`/dashboard/admin/departments`)

**Khác với Unit:**
- Department = Đơn vị học thuật (có thể liên kết với FacultyProfile, HocVien)
- Unit = Đơn vị tổ chức (dùng cho RBAC, Personnel)

**Các bước:**
1. Click "Thêm khoa/phòng"
2. Điền thông tin:
   - Mã (*)
   - Tên (*)
   - Tên đầy đủ
   - Mô tả
   - Level
   - Khoa cha (nếu có)
3. Nhấn "Lưu"

---

#### 4.10.7 Audit Logs (`/dashboard/admin/audit-logs`)

**Mục đích:** Xem lịch sử mọi thao tác trong hệ thống

**Thông tin log:**
- Thời gian
- User thực hiện
- Hành động (VIEW, CREATE, UPDATE, DELETE)
- Resource type
- Dữ liệu cũ/mới
- IP address

**Filters:**
- Theo User
- Theo loại hành động
- Theo khoảng thời gian
- Theo resource type

---

### 4.11 NHÓM 11: HẠ TẦNG & DỊCH VỤ

#### 4.11.1 Dịch vụ (`/dashboard/services`)

**Hiển thị:**
- Danh sách BigData services
- Trạng thái: HEALTHY, WARNING, ERROR
- Metrics: CPU, RAM, Disk

---

#### 4.11.2 API Gateway (`/dashboard/admin/api-gateway`)

**Chức năng:**
- Quản lý API Keys
- Xem logs API calls
- Rate limiting stats
- Endpoint monitoring

---

#### 4.11.3 Infrastructure (`/dashboard/admin/infrastructure`)

**Hiển thị:**
- Servers status
- Database connections
- Cache status (Redis)
- Storage usage

---

### 4.12 NHÓM 12: GIÁM SÁT & BẢO MẬT

#### 4.12.1 System Monitoring (`/dashboard/monitoring`)

**Metrics:**
- Request/second
- Response time
- Error rate
- Active users

---

#### 4.12.2 Realtime Monitor (`/dashboard/realtime`)

**Live data:**
- Active connections
- Real-time events
- Live queries

---

#### 4.12.3 System Health (`/dashboard/system/health`)

**Health checks:**
- Database connection
- Redis connection
- S3 storage
- External APIs

---

#### 4.12.4 Alerts (`/dashboard/alerts`)

**Loại cảnh báo:**
- System errors
- Security events
- Performance issues
- Data anomalies

---

#### 4.12.5 Security Audit (`/dashboard/security/audit`)

**Báo cáo:**
- Failed login attempts
- Permission violations
- Suspicious activities
- Data access patterns

---

#### 4.12.6 Login Audit (`/dashboard/security/login-audit`)

**Thông tin:**
- Login history
- IP tracking
- Device fingerprints
- Geo-location

---

### 4.13 NHÓM 13: CÀI ĐẶT

#### 4.13.1 Thông tin cá nhân (`/dashboard/profile`)

**Chức năng:**
- Xem thông tin tài khoản
- Đổi mật khẩu
- Cập nhật avatar
- Thiết lập ngôn ngữ

---

#### 4.13.2 Hoàn thiện hồ sơ (`/dashboard/profile/complete`)

**Dành cho User mới:**
- 4 tab: Cơ bản, Quân sự, Địa chỉ, Học vấn
- Progress indicator
- Dropdown lấy dữ liệu từ DB

---

#### 4.13.3 Cấu hình AI (`/admin/ai-settings`)

**Cài đặt:**
- Provider: Abacus AI / OpenAI
- API Key
- Model selection
- Temperature, Max tokens

---

## 5. TÀI KHOẢN DEMO

| Vai trò | Email | Mật khẩu | Mô tả |
|---------|-------|----------|-------|
| System Admin | admin@hvhc.edu.vn | Hv@2025 | Toàn quyền hệ thống |
| Chỉ huy HV | chihuy@hvhc.edu.vn | Hv@2025 | Command Dashboard |
| Trưởng Khoa | truongkhoa@hvhc.edu.vn | Hv@2025 | Quản lý cấp Khoa |
| Giảng viên | giangvien@hvhc.edu.vn | Hv@2025 | Giảng dạy & NCKH |
| Học viên | hocvien@hvhc.edu.vn | Hv@2025 | Xem kết quả học tập |
| Test | john@doe.com | johndoe123 | Tài khoản test |

---

## PHỤ LỤC: CHECKLIST TRIỂN KHAI

### Giai đoạn 1: Cấu trúc nền tảng
- [ ] Tạo cây đơn vị (Unit)
- [ ] Tạo danh sách Khoa/Phòng (Department)
- [ ] Thiết lập RBAC (Position → Function)
- [ ] Tạo tài khoản Admin

### Giai đoạn 2: Nhân sự
- [ ] Import/Tạo hồ sơ Personnel
- [ ] Tạo tài khoản User cho cán bộ
- [ ] Liên kết User ↔ Personnel
- [ ] Gán Position cho User

### Giai đoạn 3: Đào tạo
- [ ] Tạo hệ số môn học
- [ ] Tạo FacultyProfile cho giảng viên
- [ ] Gán môn giảng dạy
- [ ] Tạo hồ sơ Học viên
- [ ] Gán Advisor cho Học viên

### Giai đoạn 4: Nghiệp vụ
- [ ] Nhập kết quả học tập
- [ ] Tạo dự án NCKH
- [ ] Tạo hồ sơ Đảng viên
- [ ] Tạo hồ sơ Thi đua/Khen thưởng

### Giai đoạn 5: Vận hành
- [ ] Kiểm tra Dashboard hoạt động
- [ ] Kiểm tra AI Advisor
- [ ] Xuất báo cáo thử
- [ ] Thiết lập alerts

---

**Tài liệu này được tạo tự động bởi HVHC BigData System v8.0**  
**Ngày cập nhật:** 20/02/2026

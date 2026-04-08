
# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG BIG DATA
## DÀNH CHO CHỈ HUY BAN/CHỦ NHIỆM BỘ MÔN

**Phiên bản:** 1.0  
**Ngày ban hành:** 10/10/2025  
**Đơn vị:** Học viện Hậu cần - Bộ Quốc phòng

---

## MỤC LỤC

1. [Giới thiệu](#1-giới-thiệu)
2. [Đăng nhập Hệ thống](#2-đăng-nhập-hệ-thống)
3. [Quản lý Giảng dạy](#3-quản-lý-giảng-dạy)
4. [Quản lý Nghiên cứu Bộ môn](#4-quản-lý-nghiên-cứu-bộ-môn)
5. [Quản lý Giảng viên](#5-quản-lý-giảng-viên)
6. [Xây dựng Tài liệu Giảng dạy](#6-xây-dựng-tài-liệu-giảng-dạy)
7. [Báo cáo và Đánh giá](#7-báo-cáo-và-đánh-giá)

---

## 1. GIỚI THIỆU

### 1.1. Vai trò của Chủ nhiệm Bộ môn

Chủ nhiệm Bộ môn là người chịu trách nhiệm trực tiếp về:
- Chất lượng giảng dạy các môn học thuộc Bộ môn
- Phát triển chương trình và tài liệu giảng dạy
- Phân công giảng dạy và hướng dẫn
- Nghiên cứu khoa học của Bộ môn
- Phát triển đội ngũ giảng viên

### 1.2. Quyền hạn trong Hệ thống

**Bạn có quyền:**
- ✅ Quản lý các môn học của Bộ môn
- ✅ Phân công giảng dạy
- ✅ Xem kết quả giảng dạy
- ✅ Quản lý dự án nghiên cứu của Bộ môn
- ✅ Đánh giá giảng viên trong Bộ môn
- ✅ Tạo và quản lý tài liệu giảng dạy
- ✅ Tạo báo cáo Bộ môn

**Không có quyền:**
- ❌ Sửa điểm sinh viên (chỉ giảng viên mới được)
- ❌ Phê duyệt ngân sách (thuộc quyền Khoa/Phòng)
- ❌ Quản lý sinh viên toàn Khoa

---

## 2. ĐĂNG NHẬP HỆ THỐNG

### 2.1. Truy cập

**URL:** `https://bigdata.hvhc.edu.vn`

**Thông tin đăng nhập:**
- Email: {your_email}@hvhc.edu.vn
- Mật khẩu: (được cấp bởi Admin)

### 2.2. Giao diện Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  BỘ MÔN QUẢN LÝ HẬUCẦN        [Thông báo] 🔔   │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐                                            │
│ │ MENU     │  TỔNG QUAN BỘ MÔN                          │
│ │          │                                            │
│ │ 📊 Tổng  │  ┌──────────┬──────────┬──────────┐       │
│ │  quan    │  │Môn học   │Giảng viên│Dự án NC │       │
│ │          │  │    8     │     6    │    3    │       │
│ │ 📚 Môn   │  └──────────┴──────────┴──────────┘       │
│ │  học     │                                            │
│ │          │  [Lịch giảng dạy tuần này]                 │
│ │ 👥 Giảng │                                            │
│ │  viên    │  [Kết quả đánh giá gần đây]                │
│ │          │                                            │
│ │ 🔬 Nghiên│                                            │
│ │  cứu     │                                            │
│ │          │                                            │
│ │ 📄 Tài   │                                            │
│ │  liệu    │                                            │
│ └──────────┘                                            │
└─────────────────────────────────────────────────────────┘
```

---

## 3. QUẢN LÝ GIẢNG DẠY

### 3.1. Danh sách Môn học

**Truy cập:** Menu → **Môn học**

```
┌───────────────────────────────────────────────────────┐
│ CÁC MÔN HỌC - BỘ MÔN QUẢN LÝ HẬU CẦN                  │
├───────────────────────────────────────────────────────┤
│ 1. QUẢN LÝ DỰ ÁN (QL301)                              │
│    • Số tín chỉ: 3                                    │
│    • Lớp đang dạy: 3 lớp (150 sinh viên)             │
│    • Giảng viên: Đại tá Nguyễn A, Thượng tá Trần B   │
│    • Điểm TB: 8.4/10                                  │
│    • Tỷ lệ đạt: 96%                                   │
│    [Xem chi tiết] [Phân công] [Tài liệu]              │
│                                                       │
│ 2. LOGISTICS VÀ CHUỖI CUNG ỨNG (QL302)               │
│    • Số tín chỉ: 4                                    │
│    • Lớp đang dạy: 2 lớp (100 sinh viên)             │
│    • Giảng viên: Thượng tá Trần B, Trung tá Lê C     │
│    • Điểm TB: 8.2/10                                  │
│    • Tỷ lệ đạt: 94%                                   │
│    [Xem chi tiết] [Phân công] [Tài liệu]              │
│                                                       │
│ 3. QUẢN TRỊ CHIẾN LƯỢC (QL303)                        │
│    • Số tín chỉ: 3                                    │
│    • Lớp đang dạy: 2 lớp (90 sinh viên)              │
│    • Giảng viên: Thượng tá Lê C, Trung tá Phạm D     │
│    • Điểm TB: 8.5/10                                  │
│    • Tỷ lệ đạt: 97%                                   │
│    [Xem chi tiết] [Phân công] [Tài liệu]              │
│                                                       │
│ [Thêm môn học] [Xuất danh sách] [Thống kê]           │
└───────────────────────────────────────────────────────┘
```

### 3.2. Chi tiết Môn học

Click vào **"Xem chi tiết"**:

```
┌───────────────────────────────────────────────────────┐
│ MÔN HỌC: QUẢN LÝ DỰ ÁN (QL301)                       │
├───────────────────────────────────────────────────────┤
│ THÔNG TIN CHUNG                                       │
│ • Mã môn: QL301                                       │
│ • Số tín chỉ: 3 (45 tiết)                             │
│ • Loại: Bắt buộc                                      │
│ • Khối kiến thức: Chuyên ngành                        │
│ • Điều kiện: Đã học QL201 (Nguyên lý Quản lý)        │
│                                                       │
│ MÔ TẢ MÔN HỌC:                                        │
│ Cung cấp kiến thức và kỹ năng về quản lý dự án,      │
│ bao gồm lập kế hoạch, tổ chức thực hiện, giám sát    │
│ và đánh giá dự án...                                  │
│                                                       │
│ MỤC TIÊU MÔN HỌC:                                     │
│ • Hiểu các khái niệm và quy trình quản lý dự án      │
│ • Áp dụng các công cụ quản lý dự án vào thực tế      │
│ • Phát triển kỹ năng lãnh đạo và làm việc nhóm       │
│                                                       │
│ NỘI DUNG CHI TIẾT: (Xem file đính kèm)               │
│                                                       │
│ ├─ TAB: LỚP HỌC ĐANG DẠY                              │
│ │  1. Lớp K23-QL01 (50 SV) - GV: Đại tá Nguyễn A    │
│ │     Lịch: T2, T4 (13:30-15:30)                     │
│ │     Tiến độ: 70%                                    │
│ │                                                     │
│ │  2. Lớp K23-QL02 (48 SV) - GV: Thượng tá Trần B   │
│ │     Lịch: T3, T5 (07:30-09:30)                     │
│ │     Tiến độ: 68%                                    │
│ │                                                     │
│ │  3. Lớp K22-QL05 (52 SV) - GV: Đại tá Nguyễn A    │
│ │     Lịch: T4, T6 (09:30-11:30)                     │
│ │     Tiến độ: 95% (sắp kết thúc)                    │
│ │                                                     │
│ ├─ TAB: TÀI LIỆU GIẢNG DẠY                            │
│ │  • Giáo trình chính (v2.0, cập nhật 2024)          │
│ │  • Bài giảng PowerPoint (15 chương)                │
│ │  • Bài tập thực hành (10 bài)                      │
│ │  • Tài liệu tham khảo (20 tài liệu)                │
│ │  • Video bài giảng (15 video)                      │
│ │  [Quản lý tài liệu] [Upload] [Chia sẻ]            │
│ │                                                     │
│ ├─ TAB: ĐÁNH GIÁ                                      │
│ │  Phương pháp đánh giá:                             │
│ │  • Điểm chuyên cần: 10%                            │
│ │  • Bài tập: 20%                                    │
│ │  • Giữa kỳ: 30%                                    │
│ │  • Cuối kỳ: 40%                                    │
│ │                                                     │
│ │  Kết quả:                                          │
│ │  • Điểm trung bình: 8.4/10                         │
│ │  • Tỷ lệ đạt: 96%                                  │
│ │  • Xuất sắc/Giỏi: 78%                              │
│ │                                                     │
│ └─ TAB: PHẢN HỒI SINH VIÊN                            │
│    Đánh giá từ sinh viên (135 phản hồi):             │
│    • Nội dung môn học:        9.1/10 ⭐⭐⭐⭐⭐        │
│    • Phương pháp giảng dạy:   8.8/10 ⭐⭐⭐⭐⭐        │
│    • Tài liệu học tập:        8.9/10 ⭐⭐⭐⭐⭐        │
│    • Mức độ hữu ích:          9.0/10 ⭐⭐⭐⭐⭐        │
│                                                       │
│    Nhận xét tích cực:                                 │
│    "Môn học rất thực tế và bổ ích"                   │
│    "Giảng viên nhiệt tình, dễ hiểu"                  │
│                                                       │
│    [Xem tất cả phản hồi]                              │
└───────────────────────────────────────────────────────┘
```

### 3.3. Phân công Giảng dạy

**Lập kế hoạch phân công cho học kỳ mới:**

1. Vào **Môn học** → Click **"Phân công"**
2. Chọn học kỳ

```
┌───────────────────────────────────────────────────────┐
│ PHÂN CÔNG GIẢNG DẠY HỌC KỲ I/2025-2026                │
├───────────────────────────────────────────────────────┤
│ MÔN: QUẢN LÝ DỰ ÁN (QL301)                            │
│                                                       │
│ Số lớp dự kiến: 4 lớp                                 │
│ Tổng số tiết: 180 tiết (4 lớp x 45 tiết)             │
│                                                       │
│ PHÂN CÔNG:                                            │
│                                                       │
│ 1. LỚP K24-QL01 (Dự kiến 50 SV)                      │
│    Giảng viên: [Đại tá Nguyễn Văn A         ▼]       │
│    Lịch dự kiến: [T2, T4 13:30-15:30        ▼]       │
│    Phòng: [A301                              ▼]       │
│                                                       │
│ 2. LỚP K24-QL02 (Dự kiến 50 SV)                      │
│    Giảng viên: [Thượng tá Trần Thị B        ▼]       │
│    Lịch dự kiến: [T3, T5 07:30-09:30        ▼]       │
│    Phòng: [A302                              ▼]       │
│                                                       │
│ 3. LỚP K24-QL03 (Dự kiến 48 SV)                      │
│    Giảng viên: [Đại tá Nguyễn Văn A         ▼]       │
│    Lịch dự kiến: [T4, T6 09:30-11:30        ▼]       │
│    Phòng: [A303                              ▼]       │
│                                                       │
│ 4. LỚP K24-QL04 (Dự kiến 45 SV)                      │
│    Giảng viên: [Trung tá Lê Văn C           ▼]       │
│    Lịch dự kiến: [T2, T5 13:30-15:30        ▼]       │
│    Phòng: [A304                              ▼]       │
│                                                       │
│ TỔNG HỢP:                                             │
│ • Đại tá Nguyễn A:   2 lớp (90 tiết)  🟢 OK          │
│ • Thượng tá Trần B:  1 lớp (45 tiết)  🟢 OK          │
│ • Trung tá Lê C:     1 lớp (45 tiết)  🟢 OK          │
│                                                       │
│ [Lưu nháp] [Gửi phê duyệt] [Hủy]                     │
└───────────────────────────────────────────────────────┘
```

3. Sau khi hoàn thành, click **"Gửi phê duyệt"** để gửi lên Trưởng Khoa

### 3.4. Lịch Giảng dạy

**Xem lịch giảng của Bộ môn:**

**Truy cập:** Menu → **Lịch Giảng dạy**

```
┌───────────────────────────────────────────────────────┐
│ LỊCH GIẢNG DẠY TUẦN 15-21/10/2025                     │
├───────────────────────────────────────────────────────┤
│         │ Sáng          │ Chiều        │ Tối          │
│─────────┼───────────────┼──────────────┼──────────────│
│ Thứ 2   │ QL301-K23-01  │ QL302-K23-01 │              │
│ 07:30   │ GV: Nguyễn A  │ GV: Trần B   │              │
│         │ Phòng: A301   │ Phòng: A401  │              │
│─────────┼───────────────┼──────────────┼──────────────│
│ Thứ 3   │ QL302-K23-02  │              │              │
│ 07:30   │ GV: Lê C      │              │              │
│         │ Phòng: A302   │              │              │
│─────────┼───────────────┼──────────────┼──────────────│
│ Thứ 4   │ QL303-K22-01  │ QL301-K23-01 │              │
│ 09:30   │ GV: Phạm D    │ GV: Nguyễn A │              │
│         │ Phòng: A303   │ Phòng: A301  │              │
│─────────┼───────────────┼──────────────┼──────────────│
│ ...                                                   │
│                                                       │
│ [Xem tuần khác] [In lịch] [Xuất file]                │
└───────────────────────────────────────────────────────┘
```

**Chức năng:**
- Xem lịch theo tuần, tháng
- Kiểm tra xung đột lịch
- In lịch giảng
- Gửi thông báo cho giảng viên

---

## 4. QUẢN LÝ NGHIÊN CỨU BỘ MÔN

### 4.1. Dự án Nghiên cứu

**Truy cập:** Menu → **Nghiên cứu**

```
┌───────────────────────────────────────────────────────┐
│ DỰ ÁN NGHIÊN CỨU - BỘ MÔN QUẢN LÝ HẬU CẦN            │
├───────────────────────────────────────────────────────┤
│ 1. ỨNG DỤNG AI TRONG TỐI ƯU HÓA CHUỖI CUNG ỨNG       │
│    • Chủ nhiệm: Thượng tá Trần Thị B                 │
│    • Thành viên: 3 người                              │
│    • Kinh phí: 300 triệu VNĐ                          │
│    • Tiến độ: [██████░░░░] 60%                       │
│    • Deadline: 30/06/2026                             │
│    [Xem] [Cập nhật] [Báo cáo]                         │
│                                                       │
│ 2. MÔ HÌNH DỰ BÁO NHU CẦU VẬT TƯ                     │
│    • Chủ nhiệm: Trung tá Lê Văn C                    │
│    • Thành viên: 2 người                              │
│    • Kinh phí: 200 triệu VNĐ                          │
│    • Tiến độ: [████░░░░░░] 40%                       │
│    • Deadline: 31/12/2026                             │
│    [Xem] [Cập nhật] [Báo cáo]                         │
│                                                       │
│ 3. NGHIÊN CỨU ỨNG DỤNG BLOCKCHAIN                     │
│    • Chủ nhiệm: Trung tá Phạm Văn D                  │
│    • Thành viên: 4 người                              │
│    • Kinh phí: 250 triệu VNĐ                          │
│    • Tiến độ: [███░░░░░░░] 30%                       │
│    • Deadline: 30/09/2026                             │
│    [Xem] [Cập nhật] [Báo cáo]                         │
│                                                       │
│ [Tạo dự án mới] [Thống kê] [Báo cáo tổng hợp]        │
└───────────────────────────────────────────────────────┘
```

### 4.2. Đề xuất Dự án Mới

**Hỗ trợ giảng viên đề xuất dự án:**

1. Click **"Tạo dự án mới"**
2. Điền thông tin:

```
┌───────────────────────────────────────────────────────┐
│ ĐỀ XUẤT DỰ ÁN NGHIÊN CỨU MỚI                          │
├───────────────────────────────────────────────────────┤
│ Tên đề tài: *                                         │
│ [Ứng dụng IoT trong Quản lý Kho bãi                ] │
│                                                       │
│ Lĩnh vực: *                                           │
│ ☑ Quản lý Hậu cần  ☐ Logistics  ☐ Kỹ thuật           │
│                                                       │
│ Chủ nhiệm đề tài: *                                   │
│ [Trung tá Hoàng Văn E                         ▼]      │
│                                                       │
│ Thành viên:                                           │
│ 1. [Trung tá Lê Văn C                         ▼]      │
│ 2. [Thượng úy Nguyễn Văn F                    ▼]      │
│ [+ Thêm thành viên]                                   │
│                                                       │
│ Mục tiêu nghiên cứu: *                                │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Xây dựng hệ thống quản lý kho bãi sử dụng công │   │
│ │ nghệ IoT, giúp theo dõi thời gian thực, tự động│   │
│ │ cảnh báo và tối ưu hóa không gian lưu trữ...   │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ Nội dung nghiên cứu: *                                │
│ [File đính kèm: De_xuat_chi_tiet.docx     📎]        │
│                                                       │
│ Thời gian thực hiện: *                                │
│ Từ: [01/01/2026]  Đến: [31/12/2027]  (24 tháng)      │
│                                                       │
│ Kinh phí dự kiến: *                                   │
│ [350] triệu VNĐ                                       │
│                                                       │
│ Dự toán chi tiết:                                     │
│ [File đính kèm: Du_toan.xlsx           📎]           │
│                                                       │
│ Sản phẩm dự kiến:                                     │
│ ☑ Phần mềm/Hệ thống                                   │
│ ☑ Báo cáo nghiên cứu                                  │
│ ☑ Bài báo khoa học (2-3 bài)                          │
│ ☐ Sáng chế/Giải pháp hữu ích                          │
│                                                       │
│ [Lưu nháp] [Gửi phê duyệt] [Hủy]                     │
└───────────────────────────────────────────────────────┘
```

3. Click **"Gửi phê duyệt"** để gửi lên Trưởng Khoa

### 4.3. Hội thảo và Seminar

**Tổ chức hội thảo Bộ môn:**

```
┌───────────────────────────────────────────────────────┐
│ HỘI THẢO BỘ MÔN                                       │
├───────────────────────────────────────────────────────┤
│ Sắp diễn ra:                                          │
│                                                       │
│ 25/10/2025 - SEMINAR "XU HƯỚNG LOGISTICS 4.0"        │
│ • Thời gian: 14:00 - 17:00                            │
│ • Địa điểm: Phòng hội thảo A                          │
│ • Báo cáo viên: PGS.TS Nguyễn Văn A                  │
│ • Chủ đề: Ứng dụng AI và Big Data trong Logistics    │
│ • Đăng ký: 15/35 người                                │
│ [Chi tiết] [Đăng ký] [Tài liệu]                       │
│                                                       │
│ Đã tổ chức:                                           │
│                                                       │
│ 05/10/2025 - Seminar "Blockchain trong Quản lý"      │
│ • Số người tham dự: 28                                │
│ • Đánh giá: 4.5/5 ⭐⭐⭐⭐⭐                            │
│ [Xem báo cáo] [Tài liệu]                              │
│                                                       │
│ [Tạo hội thảo mới] [Lịch sử]                          │
└───────────────────────────────────────────────────────┘
```

---

## 5. QUẢN LÝ GIẢNG VIÊN

### 5.1. Danh sách Giảng viên

**Truy cập:** Menu → **Giảng viên**

```
┌───────────────────────────────────────────────────────┐
│ GIẢNG VIÊN BỘ MÔN QUẢN LÝ HẬU CẦN                     │
├───────────────────────────────────────────────────────┤
│ 1. ĐẠI TÁ NGUYỄN VĂN A                               │
│    • Chức vụ: Chủ nhiệm Bộ môn                        │
│    • Trình độ: PGS.TS                                 │
│    • Giảng dạy: 2 lớp (6 tiết/tuần)                   │
│    • Nghiên cứu: 1 dự án                              │
│    • Điểm đánh giá: 9.2/10 ⭐⭐⭐⭐⭐                   │
│    [Hồ sơ] [Phân công] [Đánh giá]                     │
│                                                       │
│ 2. THƯỢNG TÁ TRẦN THỊ B                               │
│    • Chức vụ: Phó chủ nhiệm Bộ môn                    │
│    • Trình độ: TS                                     │
│    • Giảng dạy: 2 lớp (6 tiết/tuần)                   │
│    • Nghiên cứu: 1 dự án (chủ nhiệm)                  │
│    • Điểm đánh giá: 8.9/10 ⭐⭐⭐⭐⭐                   │
│    [Hồ sơ] [Phân công] [Đánh giá]                     │
│                                                       │
│ 3. TRUNG TÁ LÊ VĂN C                                  │
│    • Chức vụ: Giảng viên                              │
│    • Trình độ: ThS                                    │
│    • Giảng dạy: 2 lớp (6 tiết/tuần)                   │
│    • Nghiên cứu: 2 dự án (thành viên)                 │
│    • Điểm đánh giá: 8.5/10 ⭐⭐⭐⭐                     │
│    [Hồ sơ] [Phân công] [Đánh giá]                     │
│                                                       │
│ [Thêm giảng viên] [Xuất danh sách] [Thống kê]        │
└───────────────────────────────────────────────────────┘
```

### 5.2. Định mức Giảng dạy

**Theo dõi định mức:**

```
┌───────────────────────────────────────────────────────┐
│ ĐỊNH MỨC GIẢNG DẠY HỌC KỲ I/2025-2026                │
├───────────────────────────────────────────────────────┤
│ Định mức chuẩn: 180 tiết/năm (90 tiết/học kỳ)        │
│                                                       │
│ Giảng viên          │ Đã phân │ Còn lại │ Trạng thái │
│─────────────────────┼─────────┼─────────┼────────────│
│ Đại tá Nguyễn A     │ 90 tiết │ 0 tiết  │ 🟢 Đủ     │
│ Thượng tá Trần B    │ 90 tiết │ 0 tiết  │ 🟢 Đủ     │
│ Trung tá Lê C       │ 90 tiết │ 0 tiết  │ 🟢 Đủ     │
│ Trung tá Phạm D     │ 75 tiết │ 15 tiết │ 🟡 Chưa đủ │
│ Trung tá Hoàng E    │ 60 tiết │ 30 tiết │ 🟡 Chưa đủ │
│ Thượng úy Nguyễn F  │ 45 tiết │ 45 tiết │ 🔴 Thiếu  │
│                                                       │
│ TỔNG HỢP:                                             │
│ • Tổng số tiết: 450 tiết                              │
│ • Trung bình: 75 tiết/người                           │
│ • Cần bổ sung: 90 tiết (2 lớp)                        │
│                                                       │
│ ĐỀ XUẤT:                                              │
│ • Tuyển thêm 1 giảng viên mới                         │
│ • Hoặc mời giảng 2 lớp (90 tiết)                      │
│                                                       │
│ [Cập nhật] [Gửi báo cáo]                              │
└───────────────────────────────────────────────────────┘
```

### 5.3. Đánh giá Giảng viên

**Đánh giá định kỳ:**

1. Chọn giảng viên → Click **"Đánh giá"**
2. Chọn kỳ đánh giá
3. Điền phiếu:

```
┌───────────────────────────────────────────────────────┐
│ ĐÁNH GIÁ GIẢNG VIÊN: THƯỢNG TÁ TRẦN THỊ B           │
├───────────────────────────────────────────────────────┤
│ Kỳ: Học kỳ I/2024-2025                                │
│                                                       │
│ 1. NĂNG LỰC CHUYÊN MÔN (40 điểm)                      │
│    • Kiến thức chuyên môn      [█████████░] 38/40    │
│    • Cập nhật kiến thức mới    [████████░░] 36/40    │
│                                                       │
│ 2. PHƯƠNG PHÁP GIẢNG DẠY (30 điểm)                    │
│    • Phương pháp sư phạm       [████████░░] 27/30    │
│    • Sử dụng công nghệ         [█████████░] 28/30    │
│                                                       │
│ 3. HIỆU QUẢ GIẢNG DẠY (20 điểm)                       │
│    • Kết quả học tập SV        [████████░░] 18/20    │
│    • Đánh giá của SV           [████████░░] 17/20    │
│                                                       │
│ 4. THÁI ĐỘ, TRÁCH NHIỆM (10 điểm)                    │
│    • Ý thức, kỷ luật           [█████████░] 9/10     │
│    • Hợp tác, hỗ trợ           [█████████░] 9/10     │
│                                                       │
│ TỔNG ĐIỂM: 182/200 (91%)                              │
│ XẾP LOẠI: XUẤT SẮC                                    │
│                                                       │
│ NHẬN XÉT:                                             │
│ ┌─────────────────────────────────────────────────┐   │
│ │ - Năng lực chuyên môn vững, cập nhật kiến thức │   │
│ │ - Phương pháp giảng dạy hiệu quả, thu hút SV   │   │
│ │ - Nhiệt tình, có trách nhiệm                    │   │
│ │ - Đóng góp tích cực cho Bộ môn                  │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ ĐỀ XUẤT KHEN THƯỞNG:                                  │
│ ☑ Bằng khen Khoa/Học viện                             │
│ ☐ Bằng khen cấp Bộ                                    │
│                                                       │
│ [Lưu] [Hoàn thành đánh giá]                           │
└───────────────────────────────────────────────────────┘
```

---

## 6. XÂY DỰNG TÀI LIỆU GIẢNG DẠY

### 6.1. Quản lý Tài liệu

**Truy cập:** Menu → **Tài liệu**

```
┌───────────────────────────────────────────────────────┐
│ THƯ VIỆN TÀI LIỆU BỘ MÔN                              │
├───────────────────────────────────────────────────────┤
│ MÔN: QUẢN LÝ DỰ ÁN (QL301)                            │
│                                                       │
│ 📚 GIÁO TRÌNH                                         │
│ • Giáo trình Quản lý Dự án (v2.0, 2024)              │
│   Tác giả: PGS.TS Nguyễn Văn A                       │
│   [Xem] [Tải xuống] [Chỉnh sửa]                      │
│                                                       │
│ 📊 BÀI GIẢNG                                          │
│ • Chương 1: Tổng quan về Quản lý Dự án (50 slides)   │
│ • Chương 2: Khởi động Dự án (45 slides)              │
│ • Chương 3: Lập Kế hoạch Dự án (60 slides)           │
│ • ...                                                 │
│ [Xem tất cả] [Upload mới]                            │
│                                                       │
│ 📝 BÀI TẬP                                            │
│ • Bài tập 1: Xác định phạm vi dự án                  │
│ • Bài tập 2: Lập WBS                                  │
│ • Bài tập 3: Lập tiến độ với MS Project              │
│ • ...                                                 │
│ [Xem tất cả] [Thêm bài tập]                          │
│                                                       │
│ 🎥 VIDEO BÀI GIẢNG                                    │
│ • Video 1: Giới thiệu môn học (15 phút)              │
│ • Video 2: Quy trình quản lý dự án (20 phút)         │
│ • ...                                                 │
│ [Xem tất cả] [Upload video]                          │
│                                                       │
│ 📖 TÀI LIỆU THAM KHẢO                                 │
│ • 15 bài báo khoa học                                 │
│ • 5 sách tham khảo                                    │
│ • 10 case study                                       │
│ [Xem tất cả] [Thêm tài liệu]                          │
└───────────────────────────────────────────────────────┘
```

### 6.2. Upload Tài liệu Mới

1. Click **"Upload mới"**
2. Điền thông tin:

```
┌───────────────────────────────────────────────────────┐
│ UPLOAD TÀI LIỆU MỚI                                   │
├───────────────────────────────────────────────────────┤
│ Môn học: *                                            │
│ [Quản lý Dự án (QL301)                        ▼]      │
│                                                       │
│ Loại tài liệu: *                                      │
│ ● Giáo trình  ○ Bài giảng  ○ Bài tập  ○ Video        │
│ ○ Tài liệu tham khảo                                  │
│                                                       │
│ Tiêu đề: *                                            │
│ [Bài giảng Chương 4: Quản lý Rủi ro              ]   │
│                                                       │
│ Mô tả:                                                │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Nội dung: Khái niệm rủi ro, quy trình quản lý  │   │
│ │ rủi ro, các công cụ đánh giá và ứng phó rủi ro │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ File: *                                               │
│ [Chọn file...] 📎 Chuong4_QuanLyRuiRo.pptx           │
│                                                       │
│ Quyền truy cập:                                       │
│ ● Giảng viên Bộ môn                                   │
│ ○ Toàn Khoa                                           │
│ ○ Sinh viên (đã đăng ký môn)                          │
│ ○ Công khai                                           │
│                                                       │
│ Phiên bản:                                            │
│ [1.0] (Để trống nếu lần đầu upload)                  │
│                                                       │
│ [Hủy] [Upload]                                        │
└───────────────────────────────────────────────────────┘
```

3. Click **"Upload"**

### 6.3. Xây dựng Ngân hàng Đề thi

**Quản lý đề thi:**

```
┌───────────────────────────────────────────────────────┐
│ NGÂN HÀNG ĐỀ THI - MÔN QUẢN LÝ DỰ ÁN                 │
├───────────────────────────────────────────────────────┤
│ ĐỀ GIỮA KỲ:                                           │
│ • Đề 2024-1: 50 câu trắc nghiệm + 2 bài tự luận      │
│   [Xem] [Sửa] [Sao chép] [Xóa]                       │
│ • Đề 2024-2: 40 câu trắc nghiệm + 3 bài tự luận      │
│   [Xem] [Sửa] [Sao chép] [Xóa]                       │
│                                                       │
│ ĐỀ CUỐI KỲ:                                           │
│ • Đề 2024-1: 60 câu trắc nghiệm + 2 bài tự luận      │
│   [Xem] [Sửa] [Sao chép] [Xóa]                       │
│ • Đề 2024-2: 50 câu trắc nghiệm + 3 bài tự luận      │
│   [Xem] [Sửa] [Sao chép] [Xóa]                       │
│ • Đề 2023-1: 60 câu trắc nghiệm + 2 bài tự luận      │
│   [Xem] [Lưu trữ]                                     │
│                                                       │
│ [Tạo đề mới] [Nhập từ file] [Xuất ngẫu nhiên]        │
└───────────────────────────────────────────────────────┘
```

---

## 7. BÁO CÁO VÀ ĐÁNH GIÁ

### 7.1. Báo cáo Hoạt động Bộ môn

**Tạo báo cáo tháng:**

**Truy cập:** Menu → **Báo cáo**

```
┌───────────────────────────────────────────────────────┐
│ BÁO CÁO THÁNG 10/2025 - BỘ MÔN QUẢN LÝ HẬU CẦN       │
├───────────────────────────────────────────────────────┤
│ (Tự động tổng hợp, có thể chỉnh sửa)                  │
│                                                       │
│ I. TÌNH HÌNH CHUNG                                    │
│ • Số giảng viên: 6 người                              │
│ • Số môn học: 8 môn                                   │
│ • Số lớp đang dạy: 12 lớp (620 sinh viên)            │
│ • Dự án nghiên cứu: 3 dự án                           │
│                                                       │
│ II. GIẢNG DẠY                                         │
│ • Tỷ lệ điểm danh: 95.8%                              │
│ • Điểm trung bình: 8.3/10                             │
│ • Tỷ lệ đạt: 96.2%                                    │
│ • Đánh giá của SV: 8.9/10                             │
│                                                       │
│ III. NGHIÊN CỨU                                       │
│ • Tiến độ các dự án: Trung bình 55%                   │
│ • Công bố tháng này: 1 bài (hội nghị trong nước)     │
│ • Seminar: 1 buổi (28 người tham dự)                  │
│                                                       │
│ IV. XÂY DỰNG TÀI LIỆU                                 │
│ • Cập nhật 5 bài giảng                                │
│ • Upload 3 video bài giảng mới                        │
│ • Biên soạn 2 case study mới                          │
│                                                       │
│ V. HOẠT ĐỘNG NỔI BẬT                                  │
│ 1. Tổ chức thành công Seminar "Xu hướng Logistics    │
│    4.0" với sự tham gia của 28 cán bộ, giảng viên    │
│                                                       │
│ 2. Thượng tá Trần B được mời báo cáo tại Hội nghị    │
│    Quản lý Hậu cần toàn quân                          │
│                                                       │
│ VI. KHÓ KHĂN                                          │
│ 1. Thiếu giảng viên, một số môn phải mời giảng       │
│ 2. Thiết bị phòng thực hành cũ, cần nâng cấp         │
│                                                       │
│ VII. KẾ HOẠCH THÁNG TỚI                               │
│ 1. Tổ chức thi giữa kỳ cho 6 lớp                     │
│ 2. Họp Bộ môn đánh giá giảng viên                     │
│ 3. Chuẩn bị kế hoạch giảng dạy học kỳ II             │
│                                                       │
│ [Chỉnh sửa] [Xem trước] [Gửi Trưởng Khoa]            │
└───────────────────────────────────────────────────────┘
```

### 7.2. Đánh giá Chất lượng Môn học

**Phân tích chất lượng:**

```
┌───────────────────────────────────────────────────────┐
│ ĐÁNH GIÁ CHẤT LƯỢNG MÔN HỌC                           │
├───────────────────────────────────────────────────────┤
│ Môn: [Quản lý Dự án (QL301)               ▼]         │
│ Kỳ: [Học kỳ I/2024-2025                   ▼]         │
│                                                       │
│ KẾT QUẢ HỌC TẬP:                                      │
│ • Số sinh viên: 150                                   │
│ • Điểm trung bình: 8.4/10                             │
│ • Phân bố điểm:                                       │
│   Xuất sắc (9-10):   [█████████░] 38% (57 SV)       │
│   Giỏi (8-8.9):      [███████░░░] 40% (60 SV)       │
│   Khá (7-7.9):       [████░░░░░░] 18% (27 SV)       │
│   TB (5.5-6.9):      [█░░░░░░░░░] 4% (6 SV)         │
│   Yếu, Kém (<5.5):   [░░░░░░░░░░] 0%                │
│                                                       │
│ • Tỷ lệ đạt: 96%  🟢 Tốt                              │
│ • So với kỳ trước: +2.3% ↑                            │
│                                                       │
│ ĐÁNH GIÁ CỦA SINH VIÊN:                               │
│ • Nội dung môn học:        9.1/10 ⭐⭐⭐⭐⭐          │
│ • Phương pháp giảng dạy:   8.8/10 ⭐⭐⭐⭐⭐          │
│ • Tài liệu học tập:        8.9/10 ⭐⭐⭐⭐⭐          │
│ • Mức độ hữu ích:          9.0/10 ⭐⭐⭐⭐⭐          │
│ • Tổng thể:                8.9/10 ⭐⭐⭐⭐⭐          │
│                                                       │
│ NHẬN XÉT TÍCH CỰC:                                    │
│ • "Môn học rất thực tế, áp dụng được ngay"           │
│ • "Giảng viên nhiệt tình, giảng dễ hiểu"             │
│ • "Bài tập phong phú, giúp hiểu sâu"                 │
│                                                       │
│ NHẬN XÉT CẦN CẢI THIỆN:                               │
│ • "Nên có thêm case study thực tế"                    │
│ • "Thời gian thực hành còn ít"                        │
│                                                       │
│ ĐỀ XUẤT CẢI THIỆN:                                    │
│ 1. Bổ sung 2-3 case study thực tế từ QĐND            │
│ 2. Tăng thời gian thực hành lên 30%                   │
│ 3. Mời chuyên gia thực tế chia sẻ kinh nghiệm         │
│                                                       │
│ [Xuất báo cáo] [So sánh với môn khác]                 │
└───────────────────────────────────────────────────────┘
```

### 7.3. Thống kê Hoạt động

**Dashboard thống kê:**

```
┌───────────────────────────────────────────────────────┐
│ THỐNG KÊ HOẠT ĐỘNG BỘ MÔN                             │
├───────────────────────────────────────────────────────┤
│ Thời gian: [Năm học 2024-2025                 ▼]     │
│                                                       │
│ GIẢNG DẠY:                                            │
│ • Tổng số tiết giảng: 1,080 tiết                      │
│ • Số lớp: 24 lớp                                      │
│ • Số sinh viên: 1,240 sinh viên                       │
│ • Điểm TB: 8.3/10                                     │
│ • Tỷ lệ đạt: 95.8%                                    │
│                                                       │
│ NGHIÊN CỨU:                                           │
│ • Dự án hoàn thành: 2 dự án                           │
│ • Dự án đang thực hiện: 3 dự án                       │
│ • Bài báo quốc tế: 3 bài                              │
│ • Bài báo trong nước: 5 bài                           │
│ • Hội thảo: 8 bài tham luận                           │
│                                                       │
│ TÀI LIỆU:                                             │
│ • Giáo trình: 8 cuốn                                  │
│ • Bài giảng: 120 bài                                  │
│ • Video: 45 video                                     │
│ • Bài tập: 80 bài                                     │
│                                                       │
│ BIỂU ĐỒ XU HƯỚNG KẾT QUẢ HỌC TẬP:                    │
│                                                       │
│ 9.0 │                                         ●       │
│ 8.5 │                           ●       ●   ╱         │
│ 8.0 │               ●       ●                         │
│ 7.5 │       ●   ●                                     │
│ 7.0 │   ●                                             │
│     └────────────────────────────────────────────    │
│      HK1  HK2  HK1  HK2  HK1  HK2  HK1               │
│      2022  2022  2023  2023  2024  2024  2024        │
│                                                       │
│ [Xuất báo cáo chi tiết] [So sánh với Bộ môn khác]    │
└───────────────────────────────────────────────────────┘
```

---

## PHỤ LỤC

### A. Mẹo Sử dụng

**1. Phân công Giảng dạy:**
- Lập kế hoạch sớm (trước 2 tháng) để giảng viên có thời gian chuẩn bị
- Cân đối khối lượng công việc giữa các giảng viên
- Ưu tiên phân công theo chuyên môn

**2. Quản lý Tài liệu:**
- Đặt tên file rõ ràng, dễ tìm kiếm
- Cập nhật phiên bản thường xuyên
- Sao lưu tài liệu quan trọng

**3. Báo cáo:**
- Cập nhật dữ liệu định kỳ để báo cáo tự động chính xác
- Lưu template báo cáo để tái sử dụng

### B. Câu hỏi Thường gặp

**Q: Làm sao để theo dõi tiến độ giảng dạy của các lớp?**
A: Vào Môn học → Chọn môn → Tab "Lớp học đang dạy" → Xem tiến độ từng lớp.

**Q: Tôi muốn chia sẻ tài liệu cho sinh viên, làm thế nào?**
A: Upload tài liệu → Chọn quyền truy cập "Sinh viên (đã đăng ký môn)" → Upload.

**Q: Làm sao để xem đánh giá của sinh viên về giảng viên?**
A: Vào Giảng viên → Chọn GV → Tab "Đánh giá" → Phần "Phản hồi của SV".

**Q: Tôi có thể xuất danh sách giảng viên ra Excel không?**
A: Có, vào Giảng viên → Click "Xuất danh sách" → Chọn Excel.

### C. Liên hệ Hỗ trợ

**Hotline:** 024-xxxx-xxxx  
**Email:** support@hvhc.edu.vn  
**Giờ làm việc:** 7:30 - 17:00 (Thứ 2 - Thứ 6)

---

**Học viện Hậu cần - Bộ Quốc phòng**  
*Giảng dạy tận tâm - Nghiên cứu sâu sắc - Phục vụ hiệu quả*

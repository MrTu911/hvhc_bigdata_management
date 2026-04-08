# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG BIG DATA
## DÀNH CHO GIẢNG VIÊN/NGHIÊN CỨU VIÊN

**Phiên bản:** 1.0  
**Ngày ban hành:** 10/10/2025  
**Đơn vị:** Học viện Hậu cần - Bộ Quốc phòng

---

## MỤC LỤC

1. [Giới thiệu](#1-giới-thiệu)
2. [Đăng nhập Hệ thống](#2-đăng-nhập-hệ-thống)
3. [Quản lý Lớp học](#3-quản-lý-lớp-học)
4. [Quản lý Điểm và Đánh giá](#4-quản-lý-điểm-và-đánh-giá)
5. [Tài liệu Giảng dạy](#5-tài-liệu-giảng-dạy)
6. [Nghiên cứu Khoa học](#6-nghiên-cứu-khoa-học)
7. [Sử dụng Công cụ AI/ML](#7-sử-dụng-công-cụ-aiml)
8. [Tương tác với Sinh viên](#8-tương-tác-với-sinh-viên)

---

## 1. GIỚI THIỆU

### 1.1. Vai trò của Giảng viên

Giảng viên là người trực tiếp giảng dạy và hướng dẫn sinh viên. Trong hệ thống Big Data, bạn có thể:
- Quản lý lớp học và sinh viên
- Nhập điểm và đánh giá
- Chia sẻ tài liệu học tập
- Thực hiện nghiên cứu khoa học
- Sử dụng công cụ AI hỗ trợ giảng dạy

### 1.2. Quyền hạn

**Bạn có quyền:**
- ✅ Xem thông tin lớp học được phân công
- ✅ Quản lý sinh viên trong lớp
- ✅ Nhập và chỉnh sửa điểm
- ✅ Upload và quản lý tài liệu giảng dạy
- ✅ Tạo và quản lý dự án nghiên cứu cá nhân
- ✅ Sử dụng Data Lake cho nghiên cứu
- ✅ Sử dụng công cụ ML/AI

**Không có quyền:**
- ❌ Xem điểm của lớp khác (trừ khi được chia sẻ)
- ❌ Phê duyệt ngân sách
- ❌ Quản lý người dùng hệ thống

---

## 2. ĐĂNG NHẬP HỆ THỐNG

### 2.1. Truy cập

**URL:** `https://bigdata.hvhc.edu.vn`

**Đăng nhập:**
- Email: {your_email}@hvhc.edu.vn
- Mật khẩu: (được cấp bởi Admin)

### 2.2. Dashboard Giảng viên

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  Dashboard Giảng viên         [Thông báo] 🔔    │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐                                            │
│ │ MENU     │  TỔNG QUAN                                 │
│ │          │                                            │
│ │ 📊 Tổng  │  ┌──────────┬──────────┬──────────┐       │
│ │  quan    │  │Lớp đang  │Sinh viên │Dự án NC │       │
│ │          │  │dạy: 3    │  150     │   2     │       │
│ │ 📚 Lớp   │  └──────────┴──────────┴──────────┘       │
│ │  học     │                                            │
│ │          │  LỊCH DẠY TUẦN NÀY:                        │
│ │ 📝 Điểm  │  T2: 13:30 - Lớp K23-QL01 (50 SV)         │
│ │          │  T4: 13:30 - Lớp K23-QL01                  │
│ │ 📄 Tài   │  T4: 09:30 - Lớp K22-QL05                  │
│ │  liệu    │  T6: 09:30 - Lớp K22-QL05                  │
│ │          │                                            │
│ │ 🔬 Nghiên│  SỰ KIỆN SẮP TỚI:                          │
│ │  cứu     │  15/10 - Deadline nộp điểm giữa kỳ        │
│ │          │  20/10 - Họp Bộ môn                        │
│ │ 🤖 Công  │  25/10 - Seminar "Logistics 4.0"           │
│ │  cụ AI   │                                            │
│ └──────────┘                                            │
└─────────────────────────────────────────────────────────┘
```

---

## 3. QUẢN LÝ LỚP HỌC

### 3.1. Danh sách Lớp học

**Truy cập:** Menu → **Lớp học**

```
┌───────────────────────────────────────────────────────┐
│ LỚP HỌC CỦA TÔI                                       │
├───────────────────────────────────────────────────────┤
│ 1. LỚP K23-QL01: QUẢN LÝ DỰ ÁN                        │
│    • Môn: Quản lý Dự án (QL301)                       │
│    • Số SV: 50 sinh viên                              │
│    • Lịch: T2, T4 (13:30-15:30)                       │
│    • Phòng: A301                                      │
│    • Tiến độ: [███████░░░] 70%                       │
│    • Điểm danh TB: 96%                                │
│    [Xem chi tiết] [Điểm danh] [Nhập điểm]             │
│                                                       │
│ 2. LỚP K23-QL02: QUẢN LÝ DỰ ÁN                        │
│    • Môn: Quản lý Dự án (QL301)                       │
│    • Số SV: 48 sinh viên                              │
│    • Lịch: T3, T5 (07:30-09:30)                       │
│    • Phòng: A302                                      │
│    • Tiến độ: [██████░░░░] 65%                       │
│    • Điểm danh TB: 94%                                │
│    [Xem chi tiết] [Điểm danh] [Nhập điểm]             │
│                                                       │
│ 3. LỚP K22-QL05: QUẢN LÝ DỰ ÁN                        │
│    • Môn: Quản lý Dự án (QL301)                       │
│    • Số SV: 52 sinh viên                              │
│    • Lịch: T4, T6 (09:30-11:30)                       │
│    • Phòng: A303                                      │
│    • Tiến độ: [█████████░] 95%                       │
│    • Điểm danh TB: 97%                                │
│    [Xem chi tiết] [Điểm danh] [Nhập điểm]             │
└───────────────────────────────────────────────────────┘
```

### 3.2. Chi tiết Lớp học

Click vào **"Xem chi tiết"**:

```
┌───────────────────────────────────────────────────────┐
│ LỚP K23-QL01: QUẢN LÝ DỰ ÁN                          │
├───────────────────────────────────────────────────────┤
│ THÔNG TIN CHUNG                                       │
│ • Mã lớp: K23-QL01                                    │
│ • Môn: Quản lý Dự án (QL301) - 3 tín chỉ             │
│ • Giảng viên: Đại tá Nguyễn Văn A (bạn)              │
│ • Số SV: 50 sinh viên                                 │
│ • Lịch: Thứ 2, Thứ 4 (13:30-15:30)                   │
│ • Phòng: A301                                         │
│ • Học kỳ: I/2024-2025                                 │
│ • Tiến độ: 70% [███████░░░]                          │
│                                                       │
│ ├─ TAB: DANH SÁCH SINH VIÊN                           │
│ │  STT │ MSSV    │ Họ tên          │ Điểm danh │ Ghi chú│
│ │  1   │ SV12345 │ Nguyễn Văn A    │ 14/15     │        │
│ │  2   │ SV12346 │ Trần Thị B      │ 15/15     │ ✓      │
│ │  3   │ SV12347 │ Lê Văn C        │ 13/15     │        │
│ │  ... │ ...     │ ...             │ ...       │ ...    │
│ │                                                     │
│ │  [Xuất danh sách] [Gửi thông báo] [Thêm ghi chú]  │
│ │                                                     │
│ ├─ TAB: LỊCH HỌC & TIẾN ĐỘ                            │
│ │  Tuần 1: Chương 1 - Tổng quan về Quản lý Dự án ✓  │
│ │  Tuần 2: Chương 2 - Khởi động Dự án ✓              │
│ │  Tuần 3: Chương 3 - Lập Kế hoạch (phần 1) ✓        │
│ │  Tuần 4: Chương 3 - Lập Kế hoạch (phần 2) ✓        │
│ │  Tuần 5: Chương 4 - Quản lý Nguồn lực ✓            │
│ │  ...                                                │
│ │  Tuần 11: (Hiện tại) Chương 8 - Quản lý Rủi ro    │
│ │  Tuần 12: Chương 9 - Quản lý Chất lượng            │
│ │                                                     │
│ │  [Cập nhật tiến độ] [Thêm ghi chú buổi học]       │
│ │                                                     │
│ ├─ TAB: ĐIỂM DANH                                     │
│ │  Tổng số buổi: 15 buổi                             │
│ │  Tỷ lệ có mặt TB: 96%                               │
│ │                                                     │
│ │  Buổi gần nhất: 08/10/2025                         │
│ │  Có mặt: 48/50 SV (96%)                            │
│ │  Vắng có phép: 2 SV (Nguyễn Văn D, Trần Thị E)    │
│ │  Vắng không phép: 0 SV                             │
│ │                                                     │
│ │  [Điểm danh hôm nay] [Xem lịch sử] [Thống kê]     │
│ │                                                     │
│ ├─ TAB: BÀI TẬP                                       │
│ │  Bài tập 1: Xác định phạm vi dự án                 │
│ │    Deadline: 05/09/2025  |  Nộp: 48/50 (96%)      │
│ │    [Xem bài nộp] [Chấm điểm] [Feedback]           │
│ │                                                     │
│ │  Bài tập 2: Lập WBS                                │
│ │    Deadline: 20/09/2025  |  Nộp: 50/50 (100%)     │
│ │    [Xem bài nộp] [Chấm điểm]                       │
│ │                                                     │
│ │  Bài tập 3: Lập tiến độ với MS Project            │
│ │    Deadline: 10/10/2025  |  Nộp: 45/50 (90%)      │
│ │    ⚠️ 5 SV chưa nộp                                │
│ │    [Xem bài nộp] [Nhắc nhở] [Chấm điểm]           │
│ │                                                     │
│ │  [Tạo bài tập mới] [Thống kê]                      │
│ │                                                     │
│ └─ TAB: TÀI LIỆU                                      │
│    • Giáo trình Quản lý Dự án (v2.0)                 │
│    • Bài giảng Chương 1-10 (PowerPoint)              │
│    • Video bài giảng (10 video)                      │
│    • Tài liệu tham khảo (15 tài liệu)                │
│    • Case study (5 cases)                             │
│                                                       │
│    [Thêm tài liệu] [Quản lý tài liệu]                 │
└───────────────────────────────────────────────────────┘
```

### 3.3. Điểm danh

**Điểm danh online:**

1. Vào Lớp học → Click **"Điểm danh"**
2. Hệ thống hiển thị:

```
┌───────────────────────────────────────────────────────┐
│ ĐIỂM DANH LỚP K23-QL01                                │
├───────────────────────────────────────────────────────┤
│ Ngày: 10/10/2025                                      │
│ Buổi: Thứ 2, 13:30-15:30                              │
│ Phòng: A301                                           │
│                                                       │
│ ☑ Tất cả │ Có mặt: 0 │ Vắng: 0 │ Muộn: 0             │
│                                                       │
│ STT │ MSSV    │ Họ tên          │ Trạng thái         │
│ 1   │ SV12345 │ Nguyễn Văn A    │ ● Có  ○ Vắng ○ Muộn│
│ 2   │ SV12346 │ Trần Thị B      │ ● Có  ○ Vắng ○ Muộn│
│ 3   │ SV12347 │ Lê Văn C        │ ● Có  ○ Vắng ○ Muộn│
│ ... │ ...     │ ...             │ ...                │
│                                                       │
│ Ghi chú buổi học:                                     │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Giảng chương 8: Quản lý Rủi ro. Sinh viên tích │   │
│ │ cực tham gia thảo luận. Đã giao bài tập 3.     │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ [Hủy] [Lưu điểm danh]                                 │
└───────────────────────────────────────────────────────┘
```

3. Chọn trạng thái cho từng sinh viên
4. Nhập ghi chú (nếu có)
5. Click **"Lưu điểm danh"**

**Hoặc sử dụng QR Code:**
- Hệ thống tạo mã QR
- Sinh viên quét mã để tự điểm danh
- Giảng viên chỉ cần xác nhận

### 3.4. Giao Bài tập

**Tạo bài tập mới:**

1. Vào Lớp học → Tab **"Bài tập"** → Click **"Tạo bài tập mới"**

```
┌───────────────────────────────────────────────────────┐
│ TẠO BÀI TẬP MỚI                                       │
├───────────────────────────────────────────────────────┤
│ Tiêu đề: *                                            │
│ [Bài tập 4: Phân tích Rủi ro Dự án                ]  │
│                                                       │
│ Mô tả: *                                              │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Sinh viên chọn một dự án thực tế (có thể là dự │   │
│ │ án mô phỏng), xác định và phân tích các rủi ro │   │
│ │ có thể xảy ra, đề xuất biện pháp ứng phó.      │   │
│ │                                                 │   │
│ │ Yêu cầu:                                        │   │
│ │ - Xác định ít nhất 10 rủi ro                   │   │
│ │ - Phân loại và đánh giá mức độ rủi ro          │   │
│ │ - Đề xuất biện pháp ứng phó cụ thể             │   │
│ │ - Trình bày bằng Word hoặc PowerPoint          │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ File đính kèm:                                        │
│ [Chọn file...] 📎 Mau_Phan_tich_Rui_ro.docx         │
│                                                       │
│ Deadline: *                                           │
│ [20/10/2025 23:59]                                    │
│                                                       │
│ Điểm tối đa:                                          │
│ [10] điểm                                             │
│                                                       │
│ Cho phép nộp muộn:                                    │
│ ☑ Có (trừ 10% điểm/ngày)                              │
│                                                       │
│ Thông báo sinh viên:                                  │
│ ☑ Gửi email thông báo                                 │
│ ☑ Gửi thông báo trên hệ thống                         │
│                                                       │
│ [Hủy] [Lưu nháp] [Giao bài tập]                      │
└───────────────────────────────────────────────────────┘
```

2. Click **"Giao bài tập"**
3. Sinh viên sẽ nhận được thông báo

**Xem và Chấm bài:**

```
┌───────────────────────────────────────────────────────┐
│ BÀI NỘP - BÀI TẬP 4: PHÂN TÍCH RỦI RO               │
├───────────────────────────────────────────────────────┤
│ Đã nộp: 45/50 (90%)                                   │
│ Chưa chấm: 30 bài                                     │
│ Đã chấm: 15 bài (Điểm TB: 8.2/10)                     │
│                                                       │
│ STT │ Sinh viên      │ Ngày nộp   │ File      │ Điểm │
│ 1   │ Nguyễn Văn A   │ 18/10 10:20│ [Xem]     │ 8.5  │
│ 2   │ Trần Thị B     │ 19/10 14:30│ [Xem]     │ 9.0  │
│ 3   │ Lê Văn C       │ 20/10 20:15│ [Chấm]    │ -    │
│ 4   │ Phạm Văn D     │ 20/10 23:50│ [Chấm]    │ -    │
│ ... │ ...            │ ...        │ ...       │ ...  │
│                                                       │
│ Chưa nộp (5 SV):                                      │
│ • Hoàng Văn E, Nguyễn Thị F, ...                     │
│ [Gửi nhắc nhở]                                        │
│                                                       │
│ [Chấm hàng loạt] [Xuất điểm] [Thống kê]              │
└───────────────────────────────────────────────────────┘
```

**Chấm bài:**

Click **[Chấm]** → Hiển thị:

```
┌───────────────────────────────────────────────────────┐
│ CHẤM BÀI - LÊ VĂN C                                  │
├───────────────────────────────────────────────────────┤
│ Sinh viên: Lê Văn C (SV12347)                         │
│ Ngày nộp: 20/10/2025 20:15                            │
│ File nộp: Phan_tich_Rui_ro_LeVanC.docx               │
│ [Tải xuống] [Xem online]                              │
│                                                       │
│ ──────────────────────────────────────────────────    │
│ [Hiển thị nội dung bài làm của sinh viên]            │
│ ──────────────────────────────────────────────────    │
│                                                       │
│ CHẤM ĐIỂM:                                            │
│                                                       │
│ Tiêu chí 1: Xác định rủi ro (3 điểm)                 │
│ [2.5] điểm                                            │
│                                                       │
│ Tiêu chí 2: Phân loại và đánh giá (3 điểm)           │
│ [2.8] điểm                                            │
│                                                       │
│ Tiêu chí 3: Biện pháp ứng phó (3 điểm)               │
│ [2.7] điểm                                            │
│                                                       │
│ Tiêu chí 4: Trình bày (1 điểm)                       │
│ [0.8] điểm                                            │
│                                                       │
│ TỔNG ĐIỂM: 8.8/10                                     │
│                                                       │
│ Nhận xét:                                             │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Bài làm tốt, xác định đầy đủ các rủi ro. Phân  │   │
│ │ tích khá chi tiết. Biện pháp ứng phó hợp lý.   │   │
│ │ Cần cải thiện phần trình bày, một số lỗi chính │   │
│ │ tả.                                             │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ [Hủy] [Lưu và Sang bài tiếp]                         │
└───────────────────────────────────────────────────────┘
```

---

## 4. QUẢN LÝ ĐIỂM VÀ ĐÁNH GIÁ

### 4.1. Nhập Điểm

**Truy cập:** Lớp học → Tab **"Điểm"**

```
┌───────────────────────────────────────────────────────┐
│ BẢNG ĐIỂM LỚP K23-QL01                                │
├───────────────────────────────────────────────────────┤
│ Cấu trúc điểm:                                        │
│ • Chuyên cần (10%): Điểm danh + Thái độ              │
│ • Bài tập (20%): TB 4 bài tập                         │
│ • Giữa kỳ (30%)                                       │
│ • Cuối kỳ (40%)                                       │
│                                                       │
│ STT│MSSV   │Họ tên      │CC│BT1│BT2│BT3│BT4│GK│CK│TB │
│ 1  │SV12345│Nguyễn Văn A│10│8.5│9.0│8.0│  -│30│- │-  │
│ 2  │SV12346│Trần Thị B  │10│9.0│9.5│8.5│9.0│32│- │-  │
│ 3  │SV12347│Lê Văn C    │ 9│8.0│8.5│7.5│8.8│28│- │-  │
│ ... │ ...   │ ...        │..│...│...│...│...│..│..│.. │
│                                                       │
│ Đã nhập: CC (100%), BT1-3 (100%), BT4 (90%), GK (100%)│
│ Chưa nhập: CK (0%)                                    │
│                                                       │
│ [Nhập điểm hàng loạt] [Xuất Excel] [Import Excel]    │
│ [Thống kê] [Gửi điểm cho SV]                          │
└───────────────────────────────────────────────────────┘
```

**Nhập điểm Giữa kỳ/Cuối kỳ:**

1. Click **"Nhập điểm hàng loạt"**
2. Chọn cột điểm (ví dụ: Cuối kỳ)
3. Nhập điểm:

```
┌───────────────────────────────────────────────────────┐
│ NHẬP ĐIỂM CUỐI KỲ - LỚP K23-QL01                      │
├───────────────────────────────────────────────────────┤
│ STT │ MSSV    │ Họ tên          │ Điểm CK (thang 40) │
│ 1   │ SV12345 │ Nguyễn Văn A    │ [35]               │
│ 2   │ SV12346 │ Trần Thị B      │ [38]               │
│ 3   │ SV12347 │ Lê Văn C        │ [32]               │
│ ... │ ...     │ ...             │ ...                │
│                                                       │
│ ☑ Tự động tính điểm tổng kết                          │
│ ☑ Gửi thông báo điểm cho sinh viên                    │
│                                                       │
│ Hoặc: [Import từ Excel] 📎                            │
│                                                       │
│ [Hủy] [Lưu điểm]                                      │
└───────────────────────────────────────────────────────┘
```

4. Click **"Lưu điểm"**

**Lưu ý:**
- Deadline nhập điểm: Sau thi 7 ngày
- Sau khi gửi cho SV, cần xin phép mới sửa được

### 4.2. Đánh giá Quá trình

**Đánh giá tổng hợp sinh viên:**

```
┌───────────────────────────────────────────────────────┐
│ ĐÁNH GIÁ SINH VIÊN: NGUYỄN VĂN A                     │
├───────────────────────────────────────────────────────┤
│ Lớp: K23-QL01  |  Môn: Quản lý Dự án                  │
│                                                       │
│ ĐIỂM SỐ:                                              │
│ • Chuyên cần: 10/10                                   │
│ • Bài tập TB: 8.4/10                                  │
│ • Giữa kỳ: 30/30                                      │
│ • Cuối kỳ: 35/40                                      │
│ • Tổng kết: 8.9/10 (Xuất sắc)                         │
│                                                       │
│ ĐÁNH GIÁ ĐỊNH TÍNH:                                   │
│                                                       │
│ Thái độ học tập:                                      │
│ ● Xuất sắc  ○ Tốt  ○ Trung bình  ○ Yếu              │
│                                                       │
│ Khả năng tiếp thu:                                    │
│ ● Xuất sắc  ○ Tốt  ○ Trung bình  ○ Yếu              │
│                                                       │
│ Tư duy sáng tạo:                                      │
│ ○ Xuất sắc  ● Tốt  ○ Trung bình  ○ Yếu              │
│                                                       │
│ Làm việc nhóm:                                        │
│ ● Xuất sắc  ○ Tốt  ○ Trung bình  ○ Yếu              │
│                                                       │
│ Nhận xét:                                             │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Sinh viên học tập nghiêm túc, tích cực tham gia│   │
│ │ thảo luận. Khả năng phân tích và tổng hợp tốt. │   │
│ │ Bài tập làm đầy đủ, chất lượng. Đề xuất tiếp   │   │
│ │ tục phát huy và tham gia các dự án thực tế.    │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ [Lưu] [In phiếu đánh giá]                             │
└───────────────────────────────────────────────────────┘
```

---

## 5. TÀI LIỆU GIẢNG DẠY

### 5.1. Thư viện Tài liệu

**Truy cập:** Menu → **Tài liệu**

```
┌───────────────────────────────────────────────────────┐
│ TÀI LIỆU CỦA TÔI                                      │
├───────────────────────────────────────────────────────┤
│ GIÁO TRÌNH (2)                                        │
│ • Giáo trình Quản lý Dự án v2.0 (2024)               │
│   [Xem] [Tải] [Chia sẻ] [Chỉnh sửa]                  │
│ • Tài liệu Thực hành MS Project (2023)                │
│   [Xem] [Tải] [Chia sẻ]                               │
│                                                       │
│ BÀI GIẢNG (15)                                        │
│ • Chương 1: Tổng quan (50 slides)                     │
│ • Chương 2: Khởi động Dự án (45 slides)              │
│ • Chương 3: Lập Kế hoạch (60 slides)                 │
│ • ...                                                 │
│ [Xem tất cả]                                          │
│                                                       │
│ VIDEO (10)                                            │
│ • Video 1: Giới thiệu môn học (15 phút)              │
│ • Video 2: Quy trình quản lý dự án (20 phút)         │
│ • ...                                                 │
│ [Xem tất cả]                                          │
│                                                       │
│ BÀI TẬP (10)                                          │
│ • Bài tập 1: Xác định phạm vi                         │
│ • Bài tập 2: Lập WBS                                  │
│ • ...                                                 │
│ [Xem tất cả]                                          │
│                                                       │
│ [Upload tài liệu mới] [Tìm kiếm] [Sắp xếp]           │
└───────────────────────────────────────────────────────┘
```

### 5.2. Upload Tài liệu

1. Click **"Upload tài liệu mới"**

```
┌───────────────────────────────────────────────────────┐
│ UPLOAD TÀI LIỆU                                       │
├───────────────────────────────────────────────────────┤
│ Loại tài liệu: *                                      │
│ ● Bài giảng  ○ Giáo trình  ○ Video  ○ Bài tập        │
│                                                       │
│ Môn học: *                                            │
│ [Quản lý Dự án (QL301)                        ▼]      │
│                                                       │
│ Tiêu đề: *                                            │
│ [Bài giảng Chương 10: Kết thúc Dự án         ]      │
│                                                       │
│ Mô tả:                                                │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Nội dung: Quy trình kết thúc dự án, bàn giao  │   │
│ │ sản phẩm, đánh giá và rút kinh nghiệm          │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ File: *                                               │
│ [Chọn file...] 📎 Chuong10_KetThucDuAn.pptx          │
│                                                       │
│ Chia sẻ với:                                          │
│ ☑ Sinh viên trong lớp                                 │
│ ☑ Giảng viên Bộ môn                                   │
│ ☐ Công khai (tất cả Khoa)                             │
│                                                       │
│ [Hủy] [Upload]                                        │
└───────────────────────────────────────────────────────┘
```

2. Click **"Upload"**

### 5.3. Chia sẻ Tài liệu

**Chia sẻ với sinh viên:**
- Tài liệu upload với quyền "Sinh viên trong lớp" tự động hiển thị trong lớp
- Sinh viên có thể xem và tải xuống

**Chia sẻ với đồng nghiệp:**
1. Chọn tài liệu → Click **"Chia sẻ"**
2. Chọn người/nhóm cần chia sẻ
3. Chọn quyền: Xem hoặc Chỉnh sửa
4. Click **"Chia sẻ"**

---

## 6. NGHIÊN CỨU KHOA HỌC

### 6.1. Dự án Nghiên cứu của Tôi

**Truy cập:** Menu → **Nghiên cứu**

```
┌───────────────────────────────────────────────────────┐
│ DỰ ÁN NGHIÊN CỨU CỦA TÔI                              │
├───────────────────────────────────────────────────────┤
│ 1. ỨNG DỤNG AI TRONG TỐI ƯU HÓA CHUỖI CUNG ỨNG       │
│    • Vai trò: Chủ nhiệm                               │
│    • Thành viên: 3 người                              │
│    • Kinh phí: 300 triệu VNĐ                          │
│    • Tiến độ: [██████░░░░] 60%                       │
│    • Deadline: 30/06/2026                             │
│    • Trạng thái: 🟢 Đúng tiến độ                      │
│    [Xem] [Cập nhật] [Báo cáo] [Thêm sản phẩm]        │
│                                                       │
│ 2. MÔ HÌNH DỰ BÁO NHU CẦU VẬT TƯ                     │
│    • Vai trò: Thành viên                              │
│    • Chủ nhiệm: Trung tá Lê Văn C                    │
│    • Kinh phí: 200 triệu VNĐ                          │
│    • Tiến độ: [████░░░░░░] 40%                       │
│    • Deadline: 31/12/2026                             │
│    • Trạng thái: 🟢 Đúng tiến độ                      │
│    [Xem] [Cập nhật công việc]                         │
│                                                       │
│ [Đề xuất dự án mới] [Tìm kiếm dự án] [Thống kê]      │
└───────────────────────────────────────────────────────┘
```

### 6.2. Đề xuất Dự án Mới

1. Click **"Đề xuất dự án mới"**
2. Điền đầy đủ thông tin (tương tự phần Chủ nhiệm Bộ môn)
3. Gửi phê duyệt lên Chủ nhiệm Bộ môn

### 6.3. Cập nhật Tiến độ

```
┌───────────────────────────────────────────────────────┐
│ CẬP NHẬT TIẾN ĐỘ DỰ ÁN                                │
├───────────────────────────────────────────────────────┤
│ Dự án: Ứng dụng AI trong Tối ưu hóa Chuỗi cung ứng   │
│                                                       │
│ Giai đoạn hiện tại:                                   │
│ [Giai đoạn 2: Xây dựng mô hình                ▼]      │
│                                                       │
│ Tiến độ giai đoạn: [80] %                             │
│                                                       │
│ Công việc đã hoàn thành:                              │
│ ┌─────────────────────────────────────────────────┐   │
│ │ - Thu thập và xử lý dữ liệu (hoàn thành)       │   │
│ │ - Xây dựng mô hình AI (80%)                     │   │
│ │ - Test trên dữ liệu mẫu (đang thực hiện)       │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ Kế hoạch tuần tới:                                    │
│ ┌─────────────────────────────────────────────────┐   │
│ │ - Hoàn thiện mô hình AI                         │   │
│ │ - Viết báo cáo tiến độ giai đoạn 2             │   │
│ │ - Chuẩn bị demo cho Bộ môn                      │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ Vấn đề/Khó khăn:                                      │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Dữ liệu thực tế còn hạn chế, cần bổ sung       │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ [Lưu] [Gửi báo cáo]                                   │
└───────────────────────────────────────────────────────┘
```

### 6.4. Thêm Sản phẩm Nghiên cứu

```
┌───────────────────────────────────────────────────────┐
│ THÊM SẢN PHẨM NGHIÊN CỨU                              │
├───────────────────────────────────────────────────────┤
│ Dự án: Ứng dụng AI trong Tối ưu hóa Chuỗi cung ứng   │
│                                                       │
│ Loại sản phẩm: *                                      │
│ ● Bài báo  ○ Phần mềm  ○ Báo cáo  ○ Sáng chế         │
│                                                       │
│ Tiêu đề: *                                            │
│ [AI-based Supply Chain Optimization for Military ]   │
│                                                       │
│ Tác giả: *                                            │
│ [Nguyen V.A., Tran T.B., Le V.C.              ]      │
│                                                       │
│ Nơi công bố: *                                        │
│ [Journal of Defense Analytics                 ]      │
│                                                       │
│ Loại xuất bản:                                        │
│ ● Quốc tế (ISI/Scopus)  ○ Trong nước  ○ Hội nghị    │
│                                                       │
│ Ngày công bố:                                         │
│ [15/08/2025]                                          │
│                                                       │
│ File đính kèm:                                        │
│ [Chọn file...] 📎 Paper_AI_SCO.pdf                   │
│                                                       │
│ DOI/Link:                                             │
│ [https://doi.org/10.xxxx/xxxx                ]      │
│                                                       │
│ [Hủy] [Lưu]                                           │
└───────────────────────────────────────────────────────┘
```

### 6.5. Sử dụng Data Lake

**Truy cập dữ liệu cho nghiên cứu:**

**Truy cập:** Menu → **Data Lake**

```
┌───────────────────────────────────────────────────────┐
│ DATA LAKE - DỮ LIỆU CHO NGHIÊN CỨU                    │
├───────────────────────────────────────────────────────┤
│ BỘ LỌC:                                               │
│ Loại: [Tất cả ▼]  Thời gian: [12 tháng ▼]            │
│                                                       │
│ 1. DỮ LIỆU ĐÀO TẠO                                    │
│    • Kết quả học tập 5 năm (2020-2024)               │
│      Format: CSV  |  Size: 2.5 GB  |  Records: 12M   │
│      [Xem mẫu] [Tải xuống] [Phân tích]                │
│                                                       │
│    • Điểm danh và tham gia lớp                        │
│      Format: CSV  |  Size: 500 MB  |  Records: 3M    │
│      [Xem mẫu] [Tải xuống] [Phân tích]                │
│                                                       │
│ 2. DỮ LIỆU NGHIÊN CỨU                                 │
│    • Thông tin các dự án nghiên cứu                   │
│      Format: JSON  |  Size: 50 MB  |  Records: 500   │
│      [Xem mẫu] [Tải xuống] [Phân tích]                │
│                                                       │
│ 3. DỮ LIỆU HOẠT ĐỘNG                                  │
│    • Dữ liệu vận hành hậu cần (mô phỏng)             │
│      Format: CSV  |  Size: 1 GB  |  Records: 5M      │
│      [Xem mẫu] [Tải xuống] [Phân tích]                │
│                                                       │
│ [Tìm kiếm] [Yêu cầu dataset mới] [Upload dataset]    │
└───────────────────────────────────────────────────────┘
```

**Tải dataset:**
1. Chọn dataset cần thiết
2. Click **"Tải xuống"**
3. Dataset sẽ được download về máy

**Phân tích nhanh:**
- Click **"Phân tích"** để xem thống kê cơ bản
- Biểu đồ phân phối
- Thống kê mô tả

---

## 7. SỬ DỤNG CÔNG CỤ AI/ML

### 7.1. ML Training

**Truy cập:** Menu → **Công cụ AI** → **ML Training**

```
┌───────────────────────────────────────────────────────┐
│ HUẤN LUYỆN MÔ HÌNH MACHINE LEARNING                   │
├───────────────────────────────────────────────────────┤
│ BƯỚC 1: CHỌN DATASET                                  │
│                                                       │
│ Dataset: *                                            │
│ [Kết quả học tập 5 năm (2020-2024)       ▼]          │
│                                                       │
│ Hoặc upload dataset mới:                              │
│ [Chọn file...] 📎                                     │
│                                                       │
│ ────────────────────────────────────────────────────  │
│                                                       │
│ BƯỚC 2: CHỌN LOẠI MÔ HÌNH                             │
│                                                       │
│ ● Phân loại (Classification)                          │
│ ○ Hồi quy (Regression)                                │
│ ○ Phân cụm (Clustering)                               │
│                                                       │
│ ────────────────────────────────────────────────────  │
│                                                       │
│ BƯỚC 3: CẤU HÌNH                                      │
│                                                       │
│ Biến mục tiêu (Target):                               │
│ [Xếp loại tốt nghiệp                      ▼]          │
│                                                       │
│ Biến đầu vào (Features):                              │
│ ☑ Điểm trung bình                                     │
│ ☑ Số môn xuất sắc                                     │
│ ☑ Tỷ lệ điểm danh                                     │
│ ☑ Số bài báo                                          │
│ ☐ ... (Chọn thêm)                                     │
│                                                       │
│ Thuật toán:                                           │
│ [Random Forest                            ▼]          │
│                                                       │
│ Tham số:                                              │
│ • Train/Test split: [80/20] %                         │
│ • Cross-validation: [5] folds                         │
│ • Max depth: [10]                                     │
│                                                       │
│ ────────────────────────────────────────────────────  │
│                                                       │
│ [Hủy] [Bắt đầu Training]                              │
└───────────────────────────────────────────────────────┘
```

**Sau khi training:**

```
┌───────────────────────────────────────────────────────┐
│ KẾT QUẢ TRAINING                                      │
├───────────────────────────────────────────────────────┤
│ Model ID: ML-20251010-001                             │
│ Trạng thái: ✓ Hoàn thành                              │
│ Thời gian: 15 phút 32 giây                            │
│                                                       │
│ HIỆU NĂNG MÔ HÌNH:                                    │
│ • Accuracy: 89.5%                                     │
│ • Precision: 87.3%                                    │
│ • Recall: 91.2%                                       │
│ • F1-Score: 89.2%                                     │
│                                                       │
│ CONFUSION MATRIX:                                     │
│                Predicted                              │
│          │ Xuất sắc│ Giỏi │ Khá  │ TB   │            │
│ ─────────┼─────────┼──────┼──────┼──────┤            │
│ Xuất sắc │   850   │  50  │  10  │   0  │            │
│ Giỏi     │    30   │ 720  │  40  │   5  │            │
│ Khá      │    10   │  60  │ 580  │  20  │            │
│ TB       │     0   │  10  │  30  │ 140  │            │
│                                                       │
│ FEATURE IMPORTANCE:                                   │
│ Điểm trung bình      [████████████████] 45%          │
│ Tỷ lệ điểm danh      [██████████░░░░░░] 25%          │
│ Số môn xuất sắc      [████████░░░░░░░░] 20%          │
│ Số bài báo           [████░░░░░░░░░░░░] 10%          │
│                                                       │
│ [Lưu mô hình] [Dự đoán mới] [Xuất báo cáo] [Xóa]    │
└───────────────────────────────────────────────────────┘
```

### 7.2. Dự đoán với Mô hình

**Sử dụng mô hình đã train:**

1. Click **"Dự đoán mới"**
2. Nhập dữ liệu:

```
┌───────────────────────────────────────────────────────┐
│ DỰ ĐOÁN XẾP LOẠI TỐT NGHIỆP                          │
├───────────────────────────────────────────────────────┤
│ Nhập dữ liệu sinh viên:                               │
│                                                       │
│ Điểm trung bình: [8.5]                                │
│ Số môn xuất sắc: [15]                                 │
│ Tỷ lệ điểm danh: [98] %                               │
│ Số bài báo: [2]                                       │
│                                                       │
│ [Dự đoán]                                             │
│                                                       │
│ ───────────────────────────────────────────────────   │
│                                                       │
│ KẾT QUẢ DỰ ĐOÁN:                                      │
│                                                       │
│ Xếp loại dự đoán: GIỎI                                │
│ Độ tin cậy: 92.5%                                     │
│                                                       │
│ Xác suất từng loại:                                   │
│ • Xuất sắc: 35%                                       │
│ • Giỏi: 92.5% ⭐                                       │
│ • Khá: 8%                                             │
│ • Trung bình: 0.5%                                    │
│                                                       │
│ [Dự đoán khác] [Xuất kết quả]                         │
└───────────────────────────────────────────────────────┘
```

### 7.3. Phân tích Dữ liệu với AI

**Trợ lý AI phân tích:**

**Truy cập:** **Công cụ AI** → **Phân tích Dữ liệu**

```
┌───────────────────────────────────────────────────────┐
│ TRỢ LÝ AI PHÂN TÍCH DỮ LIỆU                          │
├───────────────────────────────────────────────────────┤
│ Upload dataset hoặc chọn từ Data Lake:                │
│ [Chọn từ Data Lake ▼]                                 │
│                                                       │
│ Câu hỏi phân tích:                                    │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Phân tích mối quan hệ giữa điểm danh và kết    │   │
│ │ quả học tập của sinh viên 5 năm gần đây        │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ [Phân tích]                                           │
│                                                       │
│ ───────────────────────────────────────────────────   │
│                                                       │
│ KẾT QUẢ PHÂN TÍCH:                                    │
│                                                       │
│ Dữ liệu: 12,000 sinh viên từ 2020-2024              │
│                                                       │
│ PHÁT HIỆN CHÍNH:                                      │
│                                                       │
│ 1. Có mối tương quan mạnh (r=0.78) giữa tỷ lệ điểm  │
│    danh và kết quả học tập.                           │
│                                                       │
│ 2. Sinh viên có tỷ lệ điểm danh >95% có khả năng     │
│    đạt xếp loại Giỏi/Xuất sắc cao gấp 3.2 lần.      │
│                                                       │
│ 3. Xu hướng: Tỷ lệ điểm danh trung bình đang tăng    │
│    từ 92% (2020) lên 95% (2024).                     │
│                                                       │
│ [Biểu đồ tương quan] [Biểu đồ xu hướng]              │
│                                                       │
│ KHUYẾN NGHỊ:                                          │
│ • Tiếp tục duy trì chính sách điểm danh nghiêm        │
│ • Có biện pháp hỗ trợ SV có tỷ lệ điểm danh thấp     │
│                                                       │
│ [Xuất báo cáo] [Hỏi thêm]                             │
└───────────────────────────────────────────────────────┘
```

---

## 8. TƯƠNG TÁC VỚI SINH VIÊN

### 8.1. Gửi Thông báo

**Truy cập:** Lớp học → **"Gửi thông báo"**

```
┌───────────────────────────────────────────────────────┐
│ GỬI THÔNG BÁO ĐẾN SINH VIÊN                          │
├───────────────────────────────────────────────────────┤
│ Gửi đến:                                              │
│ ● Toàn lớp (50 sinh viên)                             │
│ ○ Nhóm sinh viên (chọn)                               │
│ ○ Cá nhân (chọn)                                      │
│                                                       │
│ Tiêu đề: *                                            │
│ [Thông báo Thi Giữa kỳ môn Quản lý Dự án     ]      │
│                                                       │
│ Nội dung: *                                           │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Thân gửi các em sinh viên lớp K23-QL01,        │   │
│ │                                                 │   │
│ │ Thầy thông báo lịch thi Giữa kỳ môn Quản lý   │   │
│ │ Dự án như sau:                                  │   │
│ │                                                 │   │
│ │ - Thời gian: 15/10/2025, 13:30-15:00           │   │
│ │ - Địa điểm: Phòng thi A501                      │   │
│ │ - Hình thức: Tự luận (2 câu)                   │   │
│ │ - Tài liệu: Không được mang tài liệu           │   │
│ │                                                 │   │
│ │ Các em chuẩn bị kỹ nội dung từ Chương 1-5.     │   │
│ │                                                 │   │
│ │ Chúc các em thi tốt!                            │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ File đính kèm:                                        │
│ [Chọn file...] 📎 De_cuong_on_tap_GK.pdf             │
│                                                       │
│ Gửi qua:                                              │
│ ☑ Email                                               │
│ ☑ Thông báo trên hệ thống                             │
│ ☐ SMS (chỉ khẩn cấp)                                  │
│                                                       │
│ [Hủy] [Gửi ngay] [Lên lịch gửi]                      │
└───────────────────────────────────────────────────────┘
```

### 8.2. Tư vấn Sinh viên

**Đăng ký lịch tư vấn:**

**Truy cập:** Menu → **Tư vấn**

```
┌───────────────────────────────────────────────────────┐
│ LỊCH TƯ VẤN SINH VIÊN                                 │
├───────────────────────────────────────────────────────┤
│ Lịch khả dụng của tôi:                                │
│ Thứ 3: 15:00-17:00                                    │
│ Thứ 5: 15:00-17:00                                    │
│                                                       │
│ [Cập nhật lịch khả dụng]                              │
│                                                       │
│ ───────────────────────────────────────────────────   │
│                                                       │
│ LỊCH HẸN SẮP TỚI:                                     │
│                                                       │
│ 12/10/2025 (Thứ 3) 15:00-15:30                       │
│ • Sinh viên: Nguyễn Văn A (SV12345)                  │
│ • Chủ đề: Hướng nghiên cứu sau đại học               │
│ • Địa điểm: Phòng A205 hoặc Online                    │
│ [Xác nhận] [Hủy] [Đổi lịch]                          │
│                                                       │
│ 12/10/2025 (Thứ 3) 15:30-16:00                       │
│ • Sinh viên: Trần Thị B (SV12346)                    │
│ • Chủ đề: Khó khăn trong học tập                      │
│ [Xác nhận] [Hủy] [Đổi lịch]                          │
│                                                       │
│ ───────────────────────────────────────────────────   │
│                                                       │
│ YÊU CẦU TƯ VẤN MỚI (3):                               │
│ [Xem tất cả] [Phê duyệt hàng loạt]                    │
└───────────────────────────────────────────────────────┘
```

### 8.3. Phản hồi Câu hỏi

**Hộp thư Câu hỏi:**

```
┌───────────────────────────────────────────────────────┐
│ CÂU HỎI TỪ SINH VIÊN                                  │
├───────────────────────────────────────────────────────┤
│ Chưa trả lời (5):                                     │
│                                                       │
│ 1. Nguyễn Văn A - 09/10/2025 20:15                    │
│    "Thầy ơi, em không hiểu phần Critical Path trong  │
│    Chương 3. Thầy có thể giải thích thêm không ạ?"   │
│    [Trả lời] [Xem chi tiết]                           │
│                                                       │
│ 2. Trần Thị B - 09/10/2025 21:30                      │
│    "Bài tập 3 có thể nộp muộn 1 ngày được không ạ?   │
│    Em có việc đột xuất ạ."                            │
│    [Trả lời] [Xem chi tiết]                           │
│                                                       │
│ ...                                                   │
│                                                       │
│ Đã trả lời (25): [Xem tất cả]                         │
└───────────────────────────────────────────────────────┘
```

**Trả lời:**

Click **"Trả lời"** → Nhập câu trả lời → Gửi

---

## PHỤ LỤC

### A. Mẹo Sử dụng

**1. Quản lý Lớp học:**
- Sử dụng QR Code điểm danh để tiết kiệm thời gian
- Nhập điểm sớm để sinh viên có thời gian xem xét
- Sử dụng Excel template để nhập điểm hàng loạt

**2. Tài liệu:**
- Đặt tên file rõ ràng, có version
- Upload video ngắn (10-15 phút) dễ xem hơn video dài
- Chia sẻ tài liệu với đồng nghiệp để học hỏi lẫn nhau

**3. Nghiên cứu:**
- Cập nhật tiến độ định kỳ để dễ quản lý
- Sử dụng Data Lake thay vì tìm dữ liệu từ nhiều nguồn
- Lưu tất cả sản phẩm nghiên cứu vào hệ thống

**4. AI/ML:**
- Bắt đầu với dataset nhỏ để test
- Thử nhiều thuật toán để tìm mô hình tốt nhất
- Lưu lại mô hình tốt để tái sử dụng

### B. Câu hỏi Thường gặp

**Q: Tôi có thể sửa điểm sau khi đã gửi cho sinh viên không?**
A: Có, nhưng cần xin phép Chủ nhiệm Bộ môn và ghi rõ lý do.

**Q: Làm sao để xem sinh viên nào chưa nộp bài tập?**
A: Vào Lớp học → Tab "Bài tập" → Chọn bài tập → Phần "Chưa nộp" sẽ liệt kê.

**Q: Tôi muốn chia sẻ tài liệu với giảng viên khác Khoa, làm thế nào?**
A: Upload tài liệu → Chọn quyền "Công khai (tất cả Khoa)" → Upload.

**Q: Dataset của tôi quá lớn, upload lâu. Có cách nào khác?**
A: Liên hệ Admin để họ hỗ trợ upload trực tiếp lên server.

**Q: Mô hình ML của tôi accuracy thấp, làm sao cải thiện?**
A: Thử: 1) Thu thập thêm dữ liệu, 2) Feature engineering, 3) Thử thuật toán khác, 4) Tune hyperparameters.

### C. Liên hệ Hỗ trợ

**Hotline:** 024-xxxx-xxxx  
**Email:** support@hvhc.edu.vn  
**Giờ làm việc:** 7:30 - 17:00 (Thứ 2 - Thứ 6)

**Hỗ trợ kỹ thuật ML/AI:**
Email: ai-support@hvhc.edu.vn

---

**Học viện Hậu cần - Bộ Quốc phòng**  
*Giảng dạy chất lượng - Nghiên cứu đột phá - Ứng dụng công nghệ tiên tiến*

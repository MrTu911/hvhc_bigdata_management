
# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG BIG DATA
## DÀNH CHO CHỈ HUY KHOA/PHÒNG/HỆ/TIỂU ĐOÀN

**Phiên bản:** 1.0  
**Ngày ban hành:** 10/10/2025  
**Đơn vị:** Học viện Hậu cần - Bộ Quốc phòng

---

## MỤC LỤC

1. [Giới thiệu](#1-giới-thiệu)
2. [Đăng nhập và Giao diện](#2-đăng-nhập-và-giao-diện)
3. [Quản lý Đơn vị](#3-quản-lý-đơn-vị)
4. [Quản lý Đào tạo](#4-quản-lý-đào-tạo)
5. [Quản lý Nghiên cứu](#5-quản-lý-nghiên-cứu)
6. [Quản lý Nhân sự](#6-quản-lý-nhân-sự)
7. [Báo cáo và Đánh giá](#7-báo-cáo-và-đánh-giá)
8. [Phê duyệt và Quyết định](#8-phê-duyệt-và-quyết-định)

---

## 1. GIỚI THIỆU

### 1.1. Vai trò của Chỉ huy Khoa/Phòng

Là cấp lãnh đạo trung gian quan trọng, Chỉ huy Khoa/Phòng chịu trách nhiệm:
- Quản lý và điều hành hoạt động của đơn vị
- Giám sát chất lượng đào tạo và nghiên cứu
- Quản lý đội ngũ cán bộ, giảng viên
- Phân bổ nguồn lực và ngân sách
- Báo cáo kết quả lên cấp trên

### 1.2. Quyền hạn trong Hệ thống

**Bạn có quyền:**
- ✅ Xem dashboard và báo cáo của đơn vị mình
- ✅ Quản lý danh sách giảng viên, nghiên cứu viên của đơn vị
- ✅ Phê duyệt đề xuất, kế hoạch của cấp dưới
- ✅ Tạo và quản lý lớp học, khóa đào tạo
- ✅ Quản lý dự án nghiên cứu của đơn vị
- ✅ Xuất báo cáo và số liệu thống kê
- ✅ Xem so sánh với các đơn vị khác

**Không có quyền:**
- ❌ Xem chi tiết dữ liệu của đơn vị khác (trừ khi được chia sẻ)
- ❌ Chỉnh sửa dữ liệu của đơn vị khác
- ❌ Quản lý người dùng toàn hệ thống

---

## 2. ĐĂNG NHẬP VÀ GIAO DIỆN

### 2.1. Đăng nhập

**URL:** `https://bigdata.hvhc.edu.vn`

**Thông tin đăng nhập:**
- Email: {your_email}@hvhc.edu.vn
- Mật khẩu: (được cấp bởi Admin)

**Lần đầu đăng nhập:**
1. Đổi mật khẩu ngay (bắt buộc)
2. Cập nhật thông tin cá nhân
3. Cấu hình thông báo

### 2.2. Giao diện Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  KHOA QUẢN LÝ - Dashboard      [Thông báo] 🔔   │
├─────────────────────────────────────────────────────────┤
│ ┌────────┐                                              │
│ │ MENU   │  TỔNG QUAN KHOA QUẢN LÝ                      │
│ │        │                                              │
│ │ 📊 Tổng│  ┌──────────┬──────────┬──────────┐         │
│ │  quan  │  │Sinh viên │Giảng viên│Dự án NC │         │
│ │        │  │   680    │    25    │   12    │         │
│ │ 🎓 Lớp │  └──────────┴──────────┴──────────┘         │
│ │  học   │                                              │
│ │        │  [Biểu đồ hoạt động tháng này]               │
│ │ 🔬 Nghiên│                                            │
│ │  cứu   │  [Tiến độ các mục tiêu]                      │
│ │        │                                              │
│ │ 👥 Nhân│                                              │
│ │  sự    │                                              │
│ │        │                                              │
│ │ 📈 Báo │                                              │
│ │  cáo   │                                              │
│ └────────┘                                              │
└─────────────────────────────────────────────────────────┘
```

---

## 3. QUẢN LÝ ĐƠN VỊ

### 3.1. Dashboard Đơn vị

**Truy cập:** Trang chủ sau khi đăng nhập

**Các chỉ số hiển thị:**

```
┌───────────────────────────────────────────────────────┐
│ TỔNG QUAN KHOA QUẢN LÝ                                │
├───────────────────────────────────────────────────────┤
│ Tháng 10/2025                                         │
│                                                       │
│ NHÂN SỰ:                                              │
│ • Tổng số cán bộ, giảng viên:    25 người            │
│ • Giáo sư/Phó Giáo sư:            4 người (16%)      │
│ • Tiến sĩ:                        12 người (48%)     │
│ • Thạc sĩ:                        9 người (36%)      │
│                                                       │
│ ĐÀO TẠO:                                              │
│ • Sinh viên đang học:             680 sinh viên      │
│ • Lớp học đang diễn ra:           12 lớp            │
│ • Tỷ lệ hoàn thành:                95.2%             │
│ • Điểm trung bình:                 8.3/10            │
│                                                       │
│ NGHIÊN CỨU:                                           │
│ • Dự án đang triển khai:          12 dự án          │
│ • Bài báo công bố năm nay:        8 bài             │
│ • Kinh phí nghiên cứu:            3.5 tỷ VNĐ       │
│                                                       │
│ MỤC TIÊU THÁNG NÀY:                                   │
│ [████████░░] 80% - Đúng tiến độ                      │
│                                                       │
│ XẾP HẠNG: 🥇 Thứ 1/8 Khoa                            │
│                                                       │
│ [Xem chi tiết] [So sánh với tháng trước]             │
└───────────────────────────────────────────────────────┘
```

### 3.2. So sánh với Các Khoa khác

**Truy cập:** **Dashboard** → **"So sánh với các đơn vị"**

```
┌───────────────────────────────────────────────────────┐
│ SO SÁNH CÁC KHOA                                      │
├───────────────────────────────────────────────────────┤
│ Chỉ số: [Tỷ lệ hoàn thành khóa học            ▼]     │
│                                                       │
│ 1. 🥇 Khoa Quản lý           95.2%  [██████████]     │
│ 2. 🥈 Khoa Kỹ thuật          93.8%  [█████████░]     │
│ 3. 🥉 Khoa Vận tải           93.1%  [█████████░]     │
│ 4.    Khoa Tài chính         91.5%  [████████░░]     │
│ 5.    Khoa Quân y            90.2%  [████████░░]     │
│                                                       │
│ Trung bình toàn học viện: 92.8%                       │
│                                                       │
│ [Đổi chỉ số] [Xem xu hướng] [Xuất báo cáo]           │
└───────────────────────────────────────────────────────┘
```

**Các chỉ số có thể so sánh:**
- Tỷ lệ hoàn thành
- Điểm trung bình
- Số lượng nghiên cứu
- Số bài báo công bố
- Tỷ lệ giảng viên cao học
- Ngân sách sử dụng

### 3.3. Mục tiêu và KPI

**Xem tiến độ KPI:**

**Truy cập:** **Dashboard** → **"Mục tiêu KPI"**

```
┌───────────────────────────────────────────────────────┐
│ MỤC TIÊU KPI NĂM 2025 - KHOA QUẢN LÝ                  │
├───────────────────────────────────────────────────────┤
│ 1. Tỷ lệ tốt nghiệp đúng hạn đạt 95%                  │
│    Hiện tại: 94.2%                                    │
│    [█████████░] 94% - Gần đạt mục tiêu               │
│    Còn 2 tháng                                        │
│                                                       │
│ 2. Công bố ít nhất 10 bài báo quốc tế                │
│    Hiện tại: 8 bài                                    │
│    [████████░░] 80% - Đúng tiến độ                   │
│    Còn 2 tháng                                        │
│                                                       │
│ 3. Tỷ lệ giảng viên TS/PGS/GS đạt 65%                 │
│    Hiện tại: 64%                                      │
│    [█████████░] 98% - Sắp hoàn thành                 │
│    1 cán bộ đang bảo vệ luận án                       │
│                                                       │
│ 4. Hoàn thành 12 dự án nghiên cứu                     │
│    Hiện tại: 6 dự án hoàn thành                       │
│    [█████░░░░░] 50% - Cần đẩy nhanh                  │
│    ⚠️ Chậm hơn dự kiến                                │
│                                                       │
│ TỔNG THỂ: [███████░░░] 74% - Đúng tiến độ            │
│                                                       │
│ [Cập nhật tiến độ] [Báo cáo chi tiết]                 │
└───────────────────────────────────────────────────────┘
```

**Cập nhật tiến độ:**
1. Click **"Cập nhật tiến độ"**
2. Chọn KPI cần cập nhật
3. Nhập số liệu mới và ghi chú
4. Click **"Lưu"**

### 3.4. Lịch làm việc và Sự kiện

**Truy cập:** Menu → **"Lịch"**

```
┌───────────────────────────────────────────────────────┐
│ LỊCH LÀM VIỆC THÁNG 10/2025                           │
├───────────────────────────────────────────────────────┤
│ T2  T3  T4  T5  T6  T7  CN                            │
│     01  02  03  04  05  06                            │
│ 07  08  09  10  11  12  13                            │
│ 14  15  16  17  18  19  20                            │
│ 21  22  23  24  25  26  27                            │
│ 28  29  30  31                                        │
│                                                       │
│ Hôm nay: 10/10/2025                                   │
│                                                       │
│ SỰ KIỆN HÔM NAY:                                      │
│ 09:00 - Họp Khoa (Phòng họp A2)                       │
│ 14:00 - Dự giờ lớp QL101 (GV: Thượng tá Nguyễn A)   │
│ 16:00 - Họp Ban chủ nhiệm (Online)                    │
│                                                       │
│ SỰ KIỆN SẮP TỚI:                                      │
│ 15/10 - Hội đồng nghiệm thu đề tài NC-2024-056       │
│ 20/10 - Hội nghị cán bộ Khoa                          │
│ 25/10 - Deadline nộp báo cáo tháng 10                 │
│                                                       │
│ [Thêm sự kiện] [Xem tháng khác]                       │
└───────────────────────────────────────────────────────┘
```

---

## 4. QUẢN LÝ ĐÀO TẠO

### 4.1. Danh sách Lớp học

**Truy cập:** Menu → **Đào tạo** → **Lớp học**

```
┌───────────────────────────────────────────────────────┐
│ DANH SÁCH LỚP HỌC - KHOA QUẢN LÝ                      │
├───────────────────────────────────────────────────────┤
│ Bộ lọc: [Tất cả] [Đang học] [Đã kết thúc]            │
│                                                       │
│ 1. LỚP QUẢN LÝ HẬU CẦN - K23                          │
│    • Giảng viên: Đại tá Nguyễn Văn A                 │
│    • Sinh viên: 45 SV                                 │
│    • Tiến độ: 70% [███████░░░]                       │
│    • Điểm TB: 8.4/10                                  │
│    • Trạng thái: 🟢 Đang học                          │
│    [Xem chi tiết] [Điểm danh] [Kết quả học tập]      │
│                                                       │
│ 2. LỚP LOGISTICS VÀ CHUỖI CUNG ỨNG - K23             │
│    • Giảng viên: Thượng tá Trần Thị B                │
│    • Sinh viên: 50 SV                                 │
│    • Tiến độ: 65% [██████░░░░]                       │
│    • Điểm TB: 8.1/10                                  │
│    • Trạng thái: 🟢 Đang học                          │
│    [Xem chi tiết] [Điểm danh] [Kết quả học tập]      │
│                                                       │
│ 3. LỚP QUẢN TRỊ CHIẾN LƯỢC - K22                      │
│    • Giảng viên: Thượng tá Lê Văn C                  │
│    • Sinh viên: 42 SV                                 │
│    • Tiến độ: 95% [█████████░]                       │
│    • Điểm TB: 8.6/10                                  │
│    • Trạng thái: 🔵 Sắp kết thúc                      │
│    [Xem chi tiết] [Kết quả học tập] [Báo cáo]        │
│                                                       │
│ [Tạo lớp mới] [Xuất danh sách]                        │
└───────────────────────────────────────────────────────┘
```

### 4.2. Xem Chi tiết Lớp học

Click vào **"Xem chi tiết"** để xem thông tin đầy đủ:

```
┌───────────────────────────────────────────────────────┐
│ LỚP: QUẢN LÝ HẬU CẦN HIỆN ĐẠI - K23                  │
├───────────────────────────────────────────────────────┤
│ THÔNG TIN CHUNG                                       │
│ • Mã lớp: QL-K23-01                                   │
│ • Giảng viên chủ nhiệm: Đại tá Nguyễn Văn A          │
│ • Số sinh viên: 45 sinh viên                          │
│ • Thời gian: 01/09/2024 - 30/06/2025                 │
│ • Phòng học chính: A301                               │
│ • Tiến độ: [███████░░░] 70%                          │
│                                                       │
│ ├─ TAB: DANH SÁCH SINH VIÊN                           │
│ │  STT │ Họ tên           │ MSSV    │ Điểm TB │      │
│ │  1   │ Nguyễn Văn A     │ SV12345 │ 8.9     │      │
│ │  2   │ Trần Thị B       │ SV12346 │ 8.5     │      │
│ │  3   │ Lê Văn C         │ SV12347 │ 7.8     │      │
│ │  ... │ ...              │ ...     │ ...     │      │
│ │                                                     │
│ │  [Xuất danh sách] [Gửi thông báo]                  │
│                                                       │
│ ├─ TAB: LỊCH HỌC                                      │
│ │  Thứ 2: 07:30-09:30 - Quản lý dự án (GV: Đại tá A) │
│ │  Thứ 4: 13:30-15:30 - Logistics (GV: Thượng tá B)  │
│ │  Thứ 6: 07:30-09:30 - Thực hành (GV: Trung tá C)   │
│ │                                                     │
│ │  [Xem lịch chi tiết] [Thay đổi lịch]               │
│                                                       │
│ ├─ TAB: ĐIỂM DANH                                     │
│ │  Tỷ lệ tham dự: 95.3%                               │
│ │  Có mặt trung bình: 43/45 sinh viên                 │
│ │  Vắng nhiều nhất: 2 sinh viên (đã có lý do)        │
│ │                                                     │
│ │  [Xem chi tiết] [Điểm danh hôm nay]                 │
│                                                       │
│ └─ TAB: KẾT QUẢ HỌC TẬP                               │
│    Điểm trung bình lớp: 8.4/10                        │
│    Xuất sắc: 12 SV (27%)                              │
│    Giỏi: 25 SV (55%)                                  │
│    Khá: 7 SV (16%)                                    │
│    Trung bình: 1 SV (2%)                              │
│                                                       │
│    [Xem bảng điểm] [Nhập điểm] [Xuất kết quả]        │
└───────────────────────────────────────────────────────┘
```

### 4.3. Tạo Lớp học Mới

1. Vào **Đào tạo** → **Lớp học** → Click **"Tạo lớp mới"**
2. Điền thông tin:

```
┌───────────────────────────────────────────────────────┐
│ TẠO LỚP HỌC MỚI                                       │
├───────────────────────────────────────────────────────┤
│ Tên lớp: *                                            │
│ [Quản lý Dự án Hậu cần                            ]   │
│                                                       │
│ Mã lớp: *                                             │
│ [QL-K24-03                                        ]   │
│                                                       │
│ Khóa học: *                                           │
│ [K24 - Khóa 2024                              ▼]      │
│                                                       │
│ Chương trình đào tạo: *                               │
│ [Cử nhân Quản lý Hậu cần                      ▼]      │
│                                                       │
│ Giảng viên chủ nhiệm: *                               │
│ [Thượng tá Nguyễn Văn A                       ▼]      │
│                                                       │
│ Giảng viên khác (tùy chọn):                           │
│ [+ Thêm giảng viên]                                   │
│                                                       │
│ Thời gian:                                            │
│ Từ ngày: [01/01/2025]  Đến ngày: [30/06/2025]        │
│                                                       │
│ Phòng học chính:                                      │
│ [A302                                         ▼]      │
│                                                       │
│ Số sinh viên dự kiến:                                 │
│ [50                                               ]   │
│                                                       │
│ Ghi chú:                                              │
│ [                                                 ]   │
│ [                                                 ]   │
│                                                       │
│ [Hủy]  [Tạo lớp]                                      │
└───────────────────────────────────────────────────────┘
```

3. Click **"Tạo lớp"**
4. Hệ thống sẽ tạo lớp và cho phép bạn:
   - Thêm sinh viên
   - Thiết lập lịch học
   - Thiết lập tiêu chí đánh giá

### 4.4. Quản lý Giảng viên

**Truy cập:** Menu → **Đào tạo** → **Giảng viên**

```
┌───────────────────────────────────────────────────────┐
│ DANH SÁCH GIẢNG VIÊN - KHOA QUẢN LÝ                   │
├───────────────────────────────────────────────────────┤
│ 1. ĐẠI TÁ NGUYỄN VĂN A                               │
│    • Chức vụ: Phó Trưởng Khoa                         │
│    • Trình độ: PGS.TS                                 │
│    • Chuyên môn: Quản lý Hậu cần, Logistics           │
│    • Lớp đang dạy: 3 lớp                              │
│    • Điểm đánh giá: 9.2/10 ⭐⭐⭐⭐⭐                   │
│    [Xem hồ sơ] [Phân công giảng dạy] [Đánh giá]      │
│                                                       │
│ 2. THƯỢNG TÁ TRẦN THỊ B                               │
│    • Chức vụ: Giảng viên chính                        │
│    • Trình độ: TS                                     │
│    • Chuyên môn: Quản trị Chuỗi cung ứng              │
│    • Lớp đang dạy: 2 lớp                              │
│    • Điểm đánh giá: 8.9/10 ⭐⭐⭐⭐⭐                   │
│    [Xem hồ sơ] [Phân công giảng dạy] [Đánh giá]      │
│                                                       │
│ 3. THƯỢNG TÁ LÊ VĂN C                                 │
│    • Chức vụ: Giảng viên                              │
│    • Trình độ: ThS                                    │
│    • Chuyên môn: Kế hoạch Hậu cần                     │
│    • Lớp đang dạy: 2 lớp                              │
│    • Điểm đánh giá: 8.5/10 ⭐⭐⭐⭐                     │
│    [Xem hồ sơ] [Phân công giảng dạy] [Đánh giá]      │
│                                                       │
│ [Thêm giảng viên] [Xuất danh sách] [Phân công chung] │
└───────────────────────────────────────────────────────┘
```

**Phân công Giảng dạy:**
1. Click **"Phân công giảng dạy"** của giảng viên
2. Xem danh sách môn học và lớp đang phụ trách
3. Thêm/bớt phân công
4. Lưu thay đổi

### 4.5. Báo cáo Đào tạo

**Tạo báo cáo tháng:**

1. Vào **Đào tạo** → **Báo cáo**
2. Chọn **"Tạo báo cáo tháng"**
3. Chọn tháng cần báo cáo
4. Hệ thống tự động tổng hợp:
   - Số lớp hoạt động
   - Tỷ lệ điểm danh
   - Kết quả học tập
   - Hoạt động nổi bật
   - Vấn đề cần giải quyết
5. Bạn có thể chỉnh sửa và bổ sung
6. Click **"Hoàn thành"** để gửi báo cáo lên cấp trên

---

## 5. QUẢN LÝ NGHIÊN CỨU

### 5.1. Danh sách Dự án

**Truy cập:** Menu → **Nghiên cứu** → **Dự án**

```
┌───────────────────────────────────────────────────────┐
│ DỰ ÁN NGHIÊN CỨU - KHOA QUẢN LÝ                       │
├───────────────────────────────────────────────────────┤
│ Bộ lọc: [Đang triển khai ▼] [Tất cả trạng thái]      │
│                                                       │
│ 1. ỨNG DỤNG BIG DATA TRONG QUẢN LÝ HẬU CẦN           │
│    • Chủ nhiệm: PGS.TS Nguyễn Văn A                  │
│    • Kinh phí: 800 triệu VNĐ                          │
│    • Tiến độ: [████████░░] 75%                       │
│    • Trạng thái: 🟢 Đúng tiến độ                      │
│    • Deadline: 31/12/2025                             │
│    [Xem chi tiết] [Cập nhật tiến độ] [Báo cáo]       │
│                                                       │
│ 2. HỆ THỐNG LOGISTICS THÔNG MINH CHO QĐND            │
│    • Chủ nhiệm: TS Trần Thị B                        │
│    • Kinh phí: 600 triệu VNĐ                          │
│    • Tiến độ: [██████░░░░] 60%                       │
│    • Trạng thái: 🟡 Cần theo dõi                      │
│    • Deadline: 30/06/2026                             │
│    [Xem chi tiết] [Cập nhật tiến độ] [Họp tiến độ]   │
│                                                       │
│ 3. BLOCKCHAIN TRONG QUẢN LÝ TÀI SẢN QĐND             │
│    • Chủ nhiệm: TS Lê Văn C                          │
│    • Kinh phí: 500 triệu VNĐ                          │
│    • Tiến độ: [████░░░░░░] 40%                       │
│    • Trạng thái: 🟢 Đúng tiến độ                      │
│    • Deadline: 31/12/2026                             │
│    [Xem chi tiết] [Cập nhật tiến độ] [Báo cáo]       │
│                                                       │
│ [Tạo dự án mới] [Thống kê] [Xuất báo cáo]            │
└───────────────────────────────────────────────────────┘
```

### 5.2. Chi tiết Dự án

Click vào **"Xem chi tiết"**:

```
┌───────────────────────────────────────────────────────┐
│ DỰ ÁN: ỨNG DỤNG BIG DATA TRONG QUẢN LÝ HẬU CẦN      │
├───────────────────────────────────────────────────────┤
│ MÃ DỰ ÁN: NC-2024-056                                 │
│ TRẠNG THÁI: 🟢 Đang triển khai                        │
│                                                       │
│ THÔNG TIN CHUNG:                                      │
│ • Chủ nhiệm: PGS.TS Nguyễn Văn A                     │
│ • Thành viên: 5 người                                 │
│   - TS Trần Thị B (Phó chủ nhiệm)                    │
│   - ThS Lê Văn C                                      │
│   - ThS Phạm Thị D                                    │
│   - CN Hoàng Văn E                                    │
│ • Thời gian: 01/2024 - 12/2025 (24 tháng)            │
│ • Kinh phí: 800 triệu VNĐ                             │
│ • Đã giải ngân: 600 triệu VNĐ (75%)                   │
│                                                       │
│ TIẾN ĐỘ:                                              │
│ [████████░░] 75% hoàn thành                          │
│                                                       │
│ Giai đoạn 1: Nghiên cứu lý thuyết   ✓ Hoàn thành     │
│ Giai đoạn 2: Xây dựng hệ thống     ⏳ 80% (Đang làm)│
│ Giai đoạn 3: Thử nghiệm            ⏰ Chưa bắt đầu   │
│ Giai đoạn 4: Hoàn thiện & Nghiệm thu ⏰ Chưa bắt đầu │
│                                                       │
│ SẢN PHẨM ĐÃ CÓ:                                       │
│ • 3 bài báo hội nghị trong nước                       │
│ • 1 bài báo quốc tế (đang phản biện)                 │
│ • 1 phần mềm prototype (đã demo)                      │
│ • 2 báo cáo tiến độ                                   │
│                                                       │
│ HOẠT ĐỘNG GẦN ĐÂY:                                    │
│ • 05/10/2025: Họp nhóm, báo cáo tiến độ giai đoạn 2  │
│ • 28/09/2025: Nộp bài báo lên hội nghị quốc tế       │
│ • 15/09/2025: Demo phần mềm cho Ban chủ nhiệm        │
│                                                       │
│ [Cập nhật tiến độ] [Thêm sản phẩm] [Họp tiến độ]     │
│ [Báo cáo chi tiết] [Lịch sử]                          │
└───────────────────────────────────────────────────────┘
```

### 5.3. Phê duyệt Đề xuất Nghiên cứu

**Quy trình:**

1. Vào **Nghiên cứu** → **Đề xuất chờ Phê duyệt**
2. Danh sách đề xuất của cấp dưới hiển thị:

```
┌───────────────────────────────────────────────────────┐
│ ĐỀ XUẤT CHỜ PHÊ DUYỆT                                 │
├───────────────────────────────────────────────────────┤
│ 1. AI TRONG DỰ BÁO NHU CẦU HẬU CẦN                    │
│    • Người đề xuất: TS Trần Thị B                     │
│    • Ngày đề xuất: 05/10/2025                         │
│    • Kinh phí dự kiến: 400 triệu VNĐ                  │
│    • Thời gian: 18 tháng                              │
│    [Xem chi tiết] [Phê duyệt] [Yêu cầu sửa] [Từ chối]│
│                                                       │
│ 2. ỨNG DỤNG IOT TRONG QUẢN LÝ KHO                     │
│    • Người đề xuất: ThS Lê Văn C                      │
│    • Ngày đề xuất: 03/10/2025                         │
│    • Kinh phí dự kiến: 350 triệu VNĐ                  │
│    • Thời gian: 12 tháng                              │
│    [Xem chi tiết] [Phê duyệt] [Yêu cầu sửa] [Từ chối]│
└───────────────────────────────────────────────────────┘
```

3. Click **"Xem chi tiết"** để đọc đầy đủ
4. Đánh giá theo tiêu chí:
   - Tính khả thi
   - Ý nghĩa khoa học và thực tiễn
   - Năng lực nhóm nghiên cứu
   - Kinh phí hợp lý
5. Quyết định:
   - **Phê duyệt:** Đề xuất tốt, phê duyệt và gửi lên Học viện
   - **Yêu cầu chỉnh sửa:** Đề xuất có tiềm năng nhưng cần sửa
   - **Từ chối:** Đề xuất không phù hợp

### 5.4. Theo dõi Công bố Khoa học

**Truy cập:** **Nghiên cứu** → **Công bố**

```
┌───────────────────────────────────────────────────────┐
│ CÔNG BỐ KHOA HỌC NĂM 2025 - KHOA QUẢN LÝ             │
├───────────────────────────────────────────────────────┤
│ Mục tiêu năm: 10 bài báo quốc tế                      │
│ Hiện tại: 8 bài (80% mục tiêu)                        │
│                                                       │
│ BÀI BÁO QUỐC TẾ (ISI/SCOPUS):     8 bài              │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 1. "Big Data Analytics for Military Logistics"  │   │
│ │    • Tác giả: Nguyen V.A., Tran T.B., et al.   │   │
│ │    • Tạp chí: Journal of Defense Analytics (Q2) │   │
│ │    • Trạng thái: ✓ Đã xuất bản (Aug 2025)      │   │
│ │                                                 │   │
│ │ 2. "AI-based Supply Chain Optimization"         │   │
│ │    • Tác giả: Tran T.B., Le V.C., et al.       │   │
│ │    • Tạp chí: Military Operations Research (Q1) │   │
│ │    • Trạng thái: ⏳ Đang phản biện             │   │
│ │    ...                                          │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ BÀI BÁO TRONG NƯỚC:                10 bài             │
│ HỘI NGHỊ/HỘI THẢO:                 15 tham luận       │
│                                                       │
│ TOP TÁC GIẢ XUẤT SẮC:                                 │
│ 1. PGS.TS Nguyễn Văn A    - 5 bài                    │
│ 2. TS Trần Thị B          - 4 bài                    │
│ 3. TS Lê Văn C            - 3 bài                    │
│                                                       │
│ [Thêm công bố] [Xuất báo cáo] [Thống kê chi tiết]    │
└───────────────────────────────────────────────────────┘
```

---

## 6. QUẢN LÝ NHÂN SỰ

### 6.1. Danh sách Cán bộ

**Truy cập:** Menu → **Nhân sự**

```
┌───────────────────────────────────────────────────────┐
│ DANH SÁCH CÁN BỘ, GIẢNG VIÊN - KHOA QUẢN LÝ          │
├───────────────────────────────────────────────────────┤
│ Tổng số: 25 người                                     │
│                                                       │
│ 1. PGS.TS NGUYỄN VĂN A                               │
│    • Chức vụ: Phó Trưởng Khoa                         │
│    • Cấp bậc: Đại tá                                  │
│    • Năm sinh: 1975                                   │
│    • Trình độ: Phó Giáo sư, Tiến sĩ                   │
│    • Chuyên môn: Quản lý Hậu cần                      │
│    • Email: nguyenvana@hvhc.edu.vn                    │
│    • SĐT: 098xxxxxxx                                  │
│    [Xem hồ sơ] [Đánh giá] [Phân công công việc]      │
│                                                       │
│ 2. TS TRẦN THỊ B                                      │
│    • Chức vụ: Giảng viên chính                        │
│    • Cấp bậc: Thượng tá                               │
│    • Năm sinh: 1980                                   │
│    • Trình độ: Tiến sĩ                                │
│    • Chuyên môn: Logistics & Chuỗi cung ứng           │
│    • Email: tranthib@hvhc.edu.vn                      │
│    • SĐT: 091xxxxxxx                                  │
│    [Xem hồ sơ] [Đánh giá] [Phân công công việc]      │
│                                                       │
│ ...                                                   │
│                                                       │
│ [Thêm cán bộ] [Xuất danh sách] [Phân loại]           │
└───────────────────────────────────────────────────────┘
```

### 6.2. Hồ sơ Chi tiết Cán bộ

Click vào **"Xem hồ sơ"**:

```
┌───────────────────────────────────────────────────────┐
│ HỒ SƠ CÁN BỘ: PGS.TS NGUYỄN VĂN A                   │
├───────────────────────────────────────────────────────┤
│ THÔNG TIN CÁ NHÂN:                                    │
│ • Họ tên: Nguyễn Văn A                                │
│ • Ngày sinh: 15/03/1975                               │
│ • Giới tính: Nam                                      │
│ • Quê quán: Hà Nội                                    │
│ • CMND: 001075xxxxxx                                  │
│                                                       │
│ THÔNG TIN CÔNG TÁC:                                   │
│ • Chức vụ: Phó Trưởng Khoa                            │
│ • Cấp bậc: Đại tá                                     │
│ • Đơn vị: Khoa Quản lý                                │
│ • Ngày vào ngũ: 01/09/1993                            │
│ • Ngày vào Học viện: 01/09/2005                       │
│                                                       │
│ TRÌNH ĐỘ:                                             │
│ • Học vị: Tiến sĩ (2010)                              │
│ • Học hàm: Phó Giáo sư (2018)                         │
│ • Chuyên ngành: Quản lý Hậu cần                       │
│ • Ngoại ngữ: Tiếng Anh (C1), Tiếng Nga (B1)          │
│                                                       │
│ CÔNG VIỆC ĐANG PHỤ TRÁCH:                             │
│ • Phụ trách Đào tạo của Khoa                          │
│ • Giảng dạy: 3 lớp                                    │
│ • Chủ nhiệm dự án: 1 dự án                            │
│ • Hướng dẫn sau đại học: 3 học viên                   │
│                                                       │
│ THÀNH TÍCH:                                           │
│ • 2024: Bằng khen Bộ Quốc phòng                       │
│ • 2023: Giải thưởng Nghiên cứu xuất sắc               │
│ • 2022: Bằng khen Học viện                            │
│                                                       │
│ [Chỉnh sửa] [Lịch sử công tác] [Đánh giá]            │
└───────────────────────────────────────────────────────┘
```

### 6.3. Đánh giá Cán bộ

**Tạo đánh giá định kỳ:**

1. Vào hồ sơ cán bộ → Click **"Đánh giá"**
2. Chọn kỳ đánh giá (6 tháng, 1 năm)
3. Điền phiếu đánh giá:

```
┌───────────────────────────────────────────────────────┐
│ ĐÁNH GIÁ CÁN BỘ: PGS.TS NGUYỄN VĂN A                │
├───────────────────────────────────────────────────────┤
│ Kỳ đánh giá: Năm 2025                                 │
│                                                       │
│ 1. CHÍNH TRỊ, ĐẠO ĐỨC (20 điểm)                      │
│    • Ý thức chính trị              [████████░░] 18   │
│    • Đạo đức lối sống              [█████████░] 19   │
│    Nhận xét: Có ý thức chính trị vững vàng, đạo đức  │
│    tốt, gương mẫu trong đơn vị.                       │
│                                                       │
│ 2. NĂNG LỰC CHUYÊN MÔN (30 điểm)                      │
│    • Trình độ chuyên môn           [█████████░] 28   │
│    • Phương pháp giảng dạy         [█████████░] 27   │
│    • Năng lực nghiên cứu           [█████████░] 29   │
│    Nhận xét: Chuyên môn sâu, phương pháp giảng dạy   │
│    hiệu quả, năng lực nghiên cứu xuất sắc.            │
│                                                       │
│ 3. KẾT QUẢ CÔNG VIỆC (30 điểm)                        │
│    • Giảng dạy                     [█████████░] 28   │
│    • Nghiên cứu khoa học           [█████████░] 27   │
│    • Công tác quản lý              [████████░░] 26   │
│    Nhận xét: Hoàn thành tốt nhiệm vụ giảng dạy và    │
│    nghiên cứu. Công tác quản lý hiệu quả.             │
│                                                       │
│ 4. TINH THẦN TRÁCH NHIỆM (20 điểm)                    │
│    • Ý thức kỷ luật                [█████████░] 19   │
│    • Tinh thần hợp tác             [█████████░] 18   │
│    Nhận xét: Có ý thức kỷ luật cao, tinh thần hợp    │
│    tác tốt với đồng nghiệp.                           │
│                                                       │
│ TỔNG ĐIỂM: 93/100                                     │
│ XẾP LOẠI: XUẤT SẮC                                    │
│                                                       │
│ ƯU ĐIỂM:                                              │
│ - Năng lực chuyên môn xuất sắc                        │
│ - Tận tâm với công việc                               │
│ - Đóng góp tích cực vào nghiên cứu khoa học           │
│                                                       │
│ ĐIỂM CẦN CẢI THIỆN:                                   │
│ - Cần tăng cường công tác quản lý hành chính          │
│                                                       │
│ ĐỀ XUẤT:                                              │
│ - Xem xét bổ nhiệm Trưởng Khoa trong nhiệm kỳ tới    │
│ - Cử đi đào tạo về quản lý giáo dục                   │
│                                                       │
│ [Lưu nháp] [Hoàn thành đánh giá]                      │
└───────────────────────────────────────────────────────┘
```

4. Click **"Hoàn thành đánh giá"**
5. Đánh giá sẽ được gửi lên cấp trên và lưu vào hồ sơ cán bộ

### 6.4. Kế hoạch Đào tạo, Bồi dưỡng

**Truy cập:** **Nhân sự** → **Đào tạo & Bồi dưỡng**

```
┌───────────────────────────────────────────────────────┐
│ KẾ HOẠCH ĐÀO TẠO, BỒI DƯỠNG NĂM 2025-2026            │
├───────────────────────────────────────────────────────┤
│ MỤC TIÊU: Nâng cao trình độ đội ngũ                   │
│ • 2 cán bộ học Tiến sĩ                                │
│ • 3 cán bộ đào tạo ngắn hạn ở nước ngoài              │
│ • 5 cán bộ bồi dưỡng chuyên môn trong nước            │
│                                                       │
│ TIẾN ĐỘ:                                              │
│                                                       │
│ 1. ThS Lê Văn C - Học Tiến sĩ                         │
│    • Trường: ĐH Bách Khoa Hà Nội                      │
│    • Chuyên ngành: Khoa học dữ liệu                   │
│    • Thời gian: 2024-2028                             │
│    • Trạng thái: 🟢 Đang học năm 2                    │
│                                                       │
│ 2. ThS Phạm Thị D - Học Tiến sĩ                       │
│    • Trường: ĐH Quốc gia Hà Nội                       │
│    • Chuyên ngành: Quản lý Logistics                  │
│    • Thời gian: 2025-2029                             │
│    • Trạng thái: 🔵 Đang làm hồ sơ                    │
│                                                       │
│ 3. TS Trần Thị B - Đào tạo ngắn hạn tại Mỹ           │
│    • Nội dung: Supply Chain Management                │
│    • Thời gian: Q2/2026 (3 tháng)                     │
│    • Trạng thái: ⏰ Đang chuẩn bị hồ sơ               │
│                                                       │
│ [Thêm kế hoạch] [Theo dõi tiến độ] [Báo cáo]         │
└───────────────────────────────────────────────────────┘
```

---

## 7. BÁO CÁO VÀ ĐÁNH GIÁ

### 7.1. Báo cáo Định kỳ

**Tạo Báo cáo Tháng:**

1. Vào Menu → **Báo cáo** → **Báo cáo Định kỳ**
2. Click **"Tạo báo cáo tháng"**
3. Chọn tháng
4. Hệ thống tự động tổng hợp dữ liệu:

```
┌───────────────────────────────────────────────────────┐
│ BÁO CÁO THÁNG 10/2025 - KHOA QUẢN LÝ                  │
├───────────────────────────────────────────────────────┤
│ (Tự động tổng hợp, có thể chỉnh sửa)                  │
│                                                       │
│ I. TÌNH HÌNH CHUNG                                    │
│                                                       │
│ 1. Nhân sự:                                           │
│ - Tổng số cán bộ, giảng viên: 25 người               │
│ - Có mặt: 24 người (1 người đi công tác dài ngày)    │
│                                                       │
│ 2. Đào tạo:                                           │
│ - Số lớp đang hoạt động: 12 lớp                       │
│ - Tổng số sinh viên: 680 sinh viên                    │
│ - Tỷ lệ điểm danh: 95.3%                              │
│ - Điểm trung bình: 8.3/10                             │
│                                                       │
│ 3. Nghiên cứu:                                        │
│ - Dự án đang triển khai: 12 dự án                     │
│ - Công bố tháng này: 2 bài (1 quốc tế, 1 trong nước) │
│                                                       │
│ II. HOẠT ĐỘNG NỔI BẬT                                 │
│                                                       │
│ 1. Tổ chức thành công Hội thảo "Big Data trong Hậu   │
│    cần Quân đội" với 150 đại biểu tham dự.           │
│                                                       │
│ 2. Dự án "Ứng dụng Big Data..." đạt 75% tiến độ,     │
│    demo thành công phần mềm prototype.                │
│                                                       │
│ 3. 3 cán bộ được Học viện khen thưởng về thành tích   │
│    giảng dạy và nghiên cứu.                           │
│                                                       │
│ III. KHÓ KHĂN, VẤN ĐỀ                                 │
│                                                       │
│ 1. Thiếu phòng học cho lớp mới (dự kiến mở Q1/2026)  │
│ 2. Một số thiết bị thực hành đã cũ, cần thay thế      │
│                                                       │
│ IV. NHIỆM VỤ THÁNG TỚI                                │
│                                                       │
│ 1. Chuẩn bị kế hoạch tuyển sinh năm 2026             │
│ 2. Nghiệm thu 2 đề tài nghiên cứu                     │
│ 3. Tổ chức đánh giá giảng viên cuối kỳ               │
│                                                       │
│ [Chỉnh sửa] [Xem trước] [Gửi báo cáo]                 │
└───────────────────────────────────────────────────────┘
```

5. Bạn có thể chỉnh sửa, bổ sung thông tin
6. Click **"Gửi báo cáo"** để gửi lên Học viện

### 7.2. Báo cáo Chuyên đề

Tạo báo cáo theo chủ đề cụ thể:
- Báo cáo chất lượng đào tạo
- Báo cáo nghiên cứu khoa học
- Báo cáo công tác sinh viên
- Báo cáo sử dụng ngân sách

**Quy trình tương tự báo cáo định kỳ.**

### 7.3. Thống kê và Phân tích

**Xem các biểu đồ phân tích:**

**Truy cập:** **Báo cáo** → **Thống kê & Phân tích**

```
┌───────────────────────────────────────────────────────┐
│ PHÂN TÍCH HOẠT ĐỘNG - KHOA QUẢN LÝ                    │
├───────────────────────────────────────────────────────┤
│ Chọn chỉ số: [Kết quả học tập              ▼]        │
│ Thời gian: [6 tháng gần đây               ▼]        │
│                                                       │
│ BIỂU ĐỒ XU HƯỚNG ĐIỂM TRUNG BÌNH                      │
│                                                       │
│ 9.0 │                                         ●       │
│ 8.5 │                               ●       ╱         │
│ 8.0 │                     ●       ╱                   │
│ 7.5 │           ●       ╱                             │
│ 7.0 │ ●       ╱                                       │
│     └────────────────────────────────────────────    │
│      T5    T6    T7    T8    T9    T10               │
│                                                       │
│ NHẬN XÉT:                                             │
│ • Xu hướng tăng ổn định qua các tháng                 │
│ • Tăng 1.3 điểm so với 6 tháng trước (+18%)           │
│ • Cao hơn trung bình toàn Học viện (8.2)              │
│                                                       │
│ SO SÁNH VỚI CÁC KHOA:                                 │
│ Khoa Quản lý    [██████████] 8.3                     │
│ Khoa Kỹ thuật   [█████████░] 8.1                     │
│ Khoa Vận tải    [█████████░] 8.0                     │
│ Khoa Tài chính  [████████░░] 7.9                     │
│                                                       │
│ [Xuất báo cáo] [Xem chỉ số khác]                      │
└───────────────────────────────────────────────────────┘
```

---

## 8. PHÊ DUYỆT VÀ QUYẾT ĐỊNH

### 8.1. Danh sách Chờ Phê duyệt

**Truy cập:** Menu → **Phê duyệt**

```
┌───────────────────────────────────────────────────────┐
│ DANH SÁCH CHỜ PHÊ DUYỆT                               │
├───────────────────────────────────────────────────────┤
│ Bạn có 5 mục chờ phê duyệt                            │
│                                                       │
│ ĐÀO TẠO (2):                                          │
│ 1. Kế hoạch Đào tạo ngắn hạn Q1/2026                  │
│    • Người đề xuất: Ban chủ nhiệm Bộ môn A            │
│    • Ngày gửi: 08/10/2025                             │
│    [Xem] [Phê duyệt] [Yêu cầu sửa]                    │
│                                                       │
│ 2. Đề xuất Chương trình đào tạo mới "Data Science"   │
│    • Người đề xuất: PGS.TS Nguyễn Văn A              │
│    • Ngày gửi: 05/10/2025                             │
│    [Xem] [Phê duyệt] [Yêu cầu sửa]                    │
│                                                       │
│ NGHIÊN CỨU (2):                                       │
│ 3. Đề xuất dự án "AI trong Dự báo Nhu cầu"           │
│    • Chủ nhiệm: TS Trần Thị B                        │
│    • Ngày gửi: 07/10/2025                             │
│    • Kinh phí: 400 triệu VNĐ                          │
│    [Xem] [Phê duyệt] [Yêu cầu sửa] [Từ chối]         │
│                                                       │
│ 4. Đề xuất dự án "IoT trong Quản lý Kho"             │
│    • Chủ nhiệm: ThS Lê Văn C                          │
│    • Ngày gửi: 06/10/2025                             │
│    • Kinh phí: 350 triệu VNĐ                          │
│    [Xem] [Phê duyệt] [Yêu cầu sửa] [Từ chối]         │
│                                                       │
│ HÀNH CHÍNH (1):                                       │
│ 5. Đề xuất mua sắm thiết bị thực hành                 │
│    • Người đề xuất: Phòng Thiết bị                    │
│    • Ngày gửi: 04/10/2025                             │
│    • Giá trị: 150 triệu VNĐ                           │
│    [Xem] [Phê duyệt] [Yêu cầu sửa]                    │
└───────────────────────────────────────────────────────┘
```

### 8.2. Quy trình Phê duyệt

**Bước 1:** Click **"Xem"** để đọc nội dung đầy đủ

**Bước 2:** Đánh giá theo tiêu chí:
- Tính cần thiết
- Tính khả thi
- Nguồn lực (ngân sách, nhân sự)
- Phù hợp với kế hoạch

**Bước 3:** Quyết định

**Phê duyệt:**
```
┌───────────────────────────────────────────────────────┐
│ PHÊ DUYỆT ĐỀ XUẤT                                     │
├───────────────────────────────────────────────────────┤
│ Đề xuất: AI trong Dự báo Nhu cầu Hậu cần              │
│                                                       │
│ Ý kiến phê duyệt (tùy chọn):                          │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Đề xuất tốt, có ý nghĩa thực tiễn cao. Đồng ý  │   │
│ │ phê duyệt và đề nghị gửi lên Học viện để xét   │   │
│ │ cấp kinh phí.                                   │   │
│ │                                                 │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ Mức kinh phí đề xuất: 400 triệu VNĐ                   │
│ Mức kinh phí phê duyệt: [400] triệu VNĐ               │
│                                                       │
│ Mức độ ưu tiên:                                       │
│ ○ Cao  ● Trung bình  ○ Thấp                          │
│                                                       │
│ [Hủy] [Xác nhận Phê duyệt]                            │
└───────────────────────────────────────────────────────┘
```

**Yêu cầu chỉnh sửa:**
```
┌───────────────────────────────────────────────────────┐
│ YÊU CẦU CHỈNH SỬA                                     │
├───────────────────────────────────────────────────────┤
│ Đề xuất: AI trong Dự báo Nhu cầu Hậu cần              │
│                                                       │
│ Nội dung cần chỉnh sửa: *                             │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 1. Cần bổ sung chi tiết về phương pháp nghiên  │   │
│ │    cứu và kế hoạch thực hiện từng giai đoạn.   │   │
│ │                                                 │   │
│ │ 2. Dự toán kinh phí cần chi tiết hơn, đặc biệt │   │
│ │    phần mua sắm thiết bị và chi phí nhân công. │   │
│ │                                                 │   │
│ │ 3. Đề xuất bổ sung thêm 1 thành viên có kinh   │   │
│ │    nghiệm về AI/ML.                             │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ Thời hạn chỉnh sửa: [7] ngày                          │
│                                                       │
│ [Hủy] [Gửi yêu cầu]                                   │
└───────────────────────────────────────────────────────┘
```

**Từ chối:**
```
┌───────────────────────────────────────────────────────┐
│ TỪ CHỐI ĐỀ XUẤT                                       │
├───────────────────────────────────────────────────────┤
│ Đề xuất: ...                                          │
│                                                       │
│ Lý do từ chối: *                                      │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Đề xuất không phù hợp với định hướng nghiên    │   │
│ │ cứu của Khoa. Nội dung trùng lặp với dự án     │   │
│ │ NC-2024-056 đang triển khai.                    │   │
│ │                                                 │   │
│ │ Đề nghị tập trung vào các hướng nghiên cứu    │   │
│ │ khác phù hợp hơn với chuyên môn.                │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ ⚠️ Hành động này không thể hoàn tác                   │
│                                                       │
│ [Hủy] [Xác nhận Từ chối]                              │
└───────────────────────────────────────────────────────┘
```

### 8.3. Lịch sử Phê duyệt

**Xem lại các quyết định đã đưa ra:**

**Truy cập:** **Phê duyệt** → **Lịch sử**

```
┌───────────────────────────────────────────────────────┐
│ LỊCH SỬ PHÊ DUYỆT                                     │
├───────────────────────────────────────────────────────┤
│ Bộ lọc: [Tất cả ▼] [Đã phê duyệt] [Từ chối]          │
│                                                       │
│ 08/10/2025 - ✓ ĐÃ PHÊ DUYỆT                          │
│ Kế hoạch mua sắm thiết bị Q4/2025                     │
│ [Xem chi tiết]                                        │
│                                                       │
│ 05/10/2025 - 🔄 YÊU CẦU CHỈNH SỬA                     │
│ Đề xuất dự án "Blockchain trong Quản lý Tài sản"     │
│ [Xem chi tiết] [Xem phiên bản chỉnh sửa]              │
│                                                       │
│ 02/10/2025 - ✓ ĐÃ PHÊ DUYỆT                          │
│ Kế hoạch Đào tạo ngắn hạn Q4/2025                     │
│ [Xem chi tiết]                                        │
│                                                       │
│ 28/09/2025 - ❌ TỪ CHỐI                               │
│ Đề xuất dự án "Ứng dụng VR trong Đào tạo"            │
│ [Xem chi tiết]                                        │
│                                                       │
│ [Tải thêm] [Xuất báo cáo]                             │
└───────────────────────────────────────────────────────┘
```

---

## PHỤ LỤC

### A. Mẹo Sử dụng

**1. Dashboard:**
- Tùy chỉnh widget để hiển thị thông tin quan trọng nhất
- Sử dụng bộ lọc thời gian để xem xu hướng

**2. Quản lý Lớp học:**
- Thiết lập thông báo tự động cho giảng viên và sinh viên
- Sử dụng tính năng "Xuất Excel" để xử lý dữ liệu ngoại tuyến

**3. Nghiên cứu:**
- Cập nhật tiến độ định kỳ để theo dõi tốt hơn
- Sử dụng nhắc nhở deadline để không bỏ lỡ

**4. Báo cáo:**
- Lưu các template báo cáo thường dùng
- Sử dụng tính năng tự động tổng hợp dữ liệu

### B. Câu hỏi Thường gặp

**Q: Làm sao để so sánh hiệu suất đơn vị mình với các đơn vị khác?**
A: Vào Dashboard → Click "So sánh với các đơn vị" → Chọn chỉ số cần so sánh.

**Q: Tôi có thể ủy quyền phê duyệt cho cấp dưới không?**
A: Có, vào Hồ sơ → Ủy quyền → Chọn người và phạm vi ủy quyền.

**Q: Làm sao để xuất danh sách sinh viên ra Excel?**
A: Vào Lớp học → Chọn lớp → Tab "Danh sách Sinh viên" → Click "Xuất danh sách" → Chọn Excel.

**Q: Tôi muốn nhận thông báo khi có đề xuất chờ phê duyệt, làm thế nào?**
A: Vào Hồ sơ → Cài đặt Thông báo → Bật "Đề xuất chờ phê duyệt" → Chọn "Ngay lập tức".

**Q: Dữ liệu trên Dashboard cập nhật khi nào?**
A: Dữ liệu real-time cập nhật liên tục. Báo cáo thống kê cập nhật mỗi ngày lúc 06:00 sáng.

### C. Hỗ trợ Kỹ thuật

**Liên hệ:**
- **Hotline:** 024-xxxx-xxxx (24/7)
- **Email:** support@hvhc.edu.vn
- **Tài liệu:** https://docs.bigdata.hvhc.edu.vn

**Các vấn đề thường gặp:**
1. Không đăng nhập được → Liên hệ Admin
2. Quên mật khẩu → Liên hệ Admin để reset
3. Lỗi hiển thị → Thử refresh trang hoặc xóa cache
4. Không tìm thấy chức năng → Kiểm tra quyền truy cập

---

**Học viện Hậu cần - Bộ Quốc phòng**  
*Đào tạo chất lượng - Nghiên cứu hiệu quả - Phục vụ tận tâm*

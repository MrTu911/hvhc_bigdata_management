
# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG BIG DATA
## DÀNH CHO CHỈ HUY HỌC VIỆN

**Phiên bản:** 1.0  
**Ngày ban hành:** 10/10/2025  
**Đơn vị:** Học viện Hậu cần - Bộ Quốc phòng

---

## MỤC LỤC

1. [Giới thiệu](#1-giới-thiệu)
2. [Đăng nhập Hệ thống](#2-đăng-nhập-hệ-thống)
3. [Dashboard Tổng quan](#3-dashboard-tổng-quan)
4. [Quản lý Đào tạo](#4-quản-lý-đào-tạo)
5. [Quản lý Nghiên cứu Khoa học](#5-quản-lý-nghiên-cứu-khoa-học)
6. [Báo cáo và Phân tích](#6-báo-cáo-và-phân-tích)
7. [Quản lý Tổ chức](#7-quản-lý-tổ-chức)
8. [Ra quyết định Chiến lược](#8-ra-quyết-định-chiến-lược)
9. [Các Tính năng Nâng cao](#9-các-tính-năng-nâng-cao)

---

## 1. GIỚI THIỆU

### 1.1. Về Hệ thống
Hệ thống Big Data của Học viện Hậu cần là công cụ hỗ trợ lãnh đạo toàn diện, cung cấp:

**Cho Chỉ huy Học viện:**
- **Dashboard tổng quan** theo dõi toàn bộ hoạt động của học viện
- **Báo cáo phân tích** chi tiết về đào tạo, nghiên cứu, và hoạt động
- **Công cụ ra quyết định** dựa trên dữ liệu và AI
- **Giám sát hiệu suất** của các đơn vị trực thuộc
- **Dự báo và kế hoạch** chiến lược dài hạn

### 1.2. Vai trò và Quyền hạn

**Quyền truy cập của Chỉ huy Học viện:**
- ✅ Xem tất cả báo cáo và dashboard tổng hợp
- ✅ Phê duyệt các dự án nghiên cứu quan trọng
- ✅ Quyết định phân bổ ngân sách và tài nguyên
- ✅ Xem báo cáo đánh giá hiệu suất các đơn vị
- ✅ Truy cập dữ liệu thống kê và xu hướng
- ✅ Xuất báo cáo cho cấp trên và các cơ quan liên quan

**Không có quyền:**
- ❌ Chỉnh sửa trực tiếp dữ liệu chi tiết
- ❌ Quản lý kỹ thuật hệ thống
- ❌ Xóa dữ liệu lịch sử

---

## 2. ĐĂNG NHẬP HỆ THỐNG

### 2.1. Truy cập Hệ thống

**URL:** `https://bigdata.hvhc.edu.vn`

**Bước đăng nhập:**
1. Mở trình duyệt web (khuyến nghị Chrome hoặc Edge)
2. Truy cập địa chỉ: `https://bigdata.hvhc.edu.vn`
3. Nhập thông tin đăng nhập:
   - **Email:** {your_email}@hvhc.edu.vn
   - **Mật khẩu:** (được cấp bởi Admin)
4. Click "Đăng nhập"

### 2.2. Lần đầu đăng nhập

**Thay đổi mật khẩu:**
1. Sau khi đăng nhập lần đầu, hệ thống sẽ yêu cầu đổi mật khẩu
2. Click vào **Hồ sơ** (góc trên bên phải) → **Đổi mật khẩu**
3. Nhập:
   - Mật khẩu cũ
   - Mật khẩu mới (tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số, ký tự đặc biệt)
   - Xác nhận mật khẩu mới
4. Click **"Cập nhật"**

**Cấu hình xác thực 2 lớp (khuyến nghị):**
1. Vào **Hồ sơ** → **Bảo mật**
2. Bật **"Xác thực 2 lớp (2FA)"**
3. Quét mã QR bằng ứng dụng Google Authenticator hoặc Microsoft Authenticator
4. Nhập mã xác thực để kích hoạt

### 2.3. Giao diện Chính

Sau khi đăng nhập, bạn sẽ thấy:

```
┌─────────────────────────────────────────────────────────┐
│  [Logo HVHC]  Dashboard Chỉ huy           [Thông báo] 🔔│
├─────────────────────────────────────────────────────────┤
│ ┌─────────┐                                             │
│ │ MENU    │  DASHBOARD TỔNG QUAN                        │
│ │         │                                             │
│ │ 📊 Tổng │  ┌──────────┬──────────┬──────────┐        │
│ │   quan  │  │Sinh viên │Giảng viên│Nghiên cứu│        │
│ │         │  │  2,450   │   180    │   42     │        │
│ │ 🎓 Đào  │  └──────────┴──────────┴──────────┘        │
│ │   tạo   │                                             │
│ │         │  [Biểu đồ hoạt động]                        │
│ │ 🔬 Nghiên│                                            │
│ │   cứu   │  [Thống kê theo tháng]                      │
│ │         │                                             │
│ │ 📈 Báo  │                                             │
│ │   cáo   │                                             │
│ └─────────┘                                             │
└─────────────────────────────────────────────────────────┘
```

---

## 3. DASHBOARD TỔNG QUAN

### 3.1. Truy cập Dashboard

Click vào **"Dashboard Tổng quan"** trong menu bên trái.

### 3.2. Các Chỉ số Quan trọng

**Phần 1: Tổng quan Nhân sự**

| Chỉ số | Mô tả | Hành động |
|--------|-------|-----------|
| **Tổng số Học viên** | Số lượng học viên đang theo học | Click để xem chi tiết theo khóa/ngành |
| **Tổng số Giảng viên** | Số lượng giảng viên và nghiên cứu viên | Click để xem phân bổ theo khoa |
| **Tỷ lệ Giảng viên/Sinh viên** | Chỉ số đánh giá nguồn lực giảng dạy | Màu xanh: tốt, Màu vàng: cần cải thiện |

**Ví dụ hiển thị:**
```
┌────────────────────────────────────────┐
│ TỔNG SỐ HỌC VIÊN                       │
│                                        │
│    2,450 học viên                      │
│    ↑ +120 so với năm trước (+5.2%)    │
│                                        │
│    [Xem chi tiết theo khóa]           │
└────────────────────────────────────────┘
```

**Phần 2: Hoạt động Đào tạo**

```
┌────────────────────────────────────────┐
│ HOẠT ĐỘNG ĐÀO TẠO THÁNG NÀY           │
│                                        │
│ Lớp học đang diễn ra:      45 lớp     │
│ Khóa đào tạo mới:          12 khóa    │
│ Tỷ lệ hoàn thành:          94.5%      │
│ Điểm trung bình:           8.2/10     │
│                                        │
│ [Biểu đồ xu hướng 6 tháng]            │
└────────────────────────────────────────┘
```

**Phần 3: Nghiên cứu Khoa học**

```
┌────────────────────────────────────────┐
│ NGHIÊN CỨU KHOA HỌC                    │
│                                        │
│ Dự án đang triển khai:     42 dự án   │
│ Đã hoàn thành năm nay:     18 dự án   │
│ Bài báo công bố:           25 bài     │
│ Sáng chế/Giải pháp:        8 hồ sơ    │
│                                        │
│ [Top 5 dự án nổi bật]                 │
└────────────────────────────────────────┘
```

**Phần 4: Tài chính và Ngân sách**

```
┌────────────────────────────────────────┐
│ TÌNH HÌNH TÀI CHÍNH                    │
│                                        │
│ Ngân sách năm:             50 tỷ VNĐ  │
│ Đã sử dụng:                32 tỷ VNĐ  │
│ Còn lại:                   18 tỷ VNĐ  │
│ Tỷ lệ giải ngân:           64%        │
│                                        │
│ [Biểu đồ phân bổ ngân sách]           │
└────────────────────────────────────────┘
```

### 3.3. Bộ lọc và Tùy chỉnh Dashboard

**Lọc theo thời gian:**
- Hôm nay
- Tuần này
- Tháng này
- Quý này
- Năm học hiện tại
- Tùy chỉnh (chọn khoảng thời gian)

**Lọc theo đơn vị:**
- Tất cả các Khoa/Phòng
- Khoa cụ thể
- Phòng/Ban cụ thể
- So sánh giữa các đơn vị

**Cách sử dụng bộ lọc:**
1. Click vào **"Bộ lọc"** ở góc trên bên phải của dashboard
2. Chọn các tiêu chí lọc
3. Click **"Áp dụng"**
4. Dashboard sẽ cập nhật theo bộ lọc đã chọn

### 3.4. Xuất Báo cáo Dashboard

1. Click nút **"Xuất báo cáo"** 📥
2. Chọn định dạng:
   - **PDF** - Dùng cho báo cáo chính thức
   - **Excel** - Dùng cho phân tích thêm
   - **PowerPoint** - Dùng cho thuyết trình
3. Chọn nội dung cần xuất:
   - Tất cả các phần
   - Chỉ các chỉ số tổng quan
   - Chỉ biểu đồ
   - Tùy chỉnh
4. Click **"Tải xuống"**

---

## 4. QUẢN LÝ ĐÀO TẠO

### 4.1. Xem Tổng quan Đào tạo

**Truy cập:** Menu → **Đào tạo** → **Tổng quan**

**Thông tin hiển thị:**

**A. Thống kê Sinh viên**
```
┌───────────────────────────────────────────────────────┐
│ THỐNG KÊ SINH VIÊN                                    │
├───────────────────────────────────────────────────────┤
│ Tổng số:              2,450 sinh viên                 │
│ Phân bổ:                                              │
│   • Đại học chính quy:      1,850 (75%)              │
│   • Cao học:                  450 (18%)              │
│   • Ngắn hạn:                 150 (7%)               │
│                                                       │
│ Theo Khoa:                                            │
│   📊 Khoa Quân lý:           680 sinh viên           │
│   📊 Khoa Vận tải:           520 sinh viên           │
│   📊 Khoa Kỹ thuật:          490 sinh viên           │
│   📊 Khoa Tài chính:         420 sinh viên           │
│   📊 Các Khoa khác:          340 sinh viên           │
│                                                       │
│ [Xem chi tiết] [Xuất báo cáo]                        │
└───────────────────────────────────────────────────────┘
```

**B. Hiệu quả Đào tạo**
```
┌───────────────────────────────────────────────────────┐
│ HIỆU QUẢ ĐÀO TẠO                                     │
├───────────────────────────────────────────────────────┤
│ Tỷ lệ hoàn thành khóa học:     94.5%  ↑ +2.1%       │
│ Điểm trung bình:               8.2/10  ↑ +0.3        │
│ Tỷ lệ xuất sắc/giỏi:          68%     ↑ +5%         │
│ Tỷ lệ không đạt:               2.3%   ↓ -0.8%        │
│                                                       │
│ [Biểu đồ xu hướng 12 tháng]                          │
│                                                       │
│ So sánh với năm trước:        🟢 Tốt hơn             │
│ Mục tiêu năm học:             🟡 Đang đạt 92%        │
└───────────────────────────────────────────────────────┘
```

**C. Chương trình Đào tạo**
```
┌───────────────────────────────────────────────────────┐
│ CHƯƠNG TRÌNH ĐÀO TẠO                                  │
├───────────────────────────────────────────────────────┤
│ Tổng số chương trình:          45 chương trình        │
│                                                       │
│ Đang triển khai:               32 chương trình        │
│ Mới phê duyệt:                 8 chương trình         │
│ Đang xây dựng:                 5 chương trình         │
│                                                       │
│ Cập nhật gần đây:                                     │
│ • Chương trình Quản lý Hậu cần Hiện đại (15/09/2025) │
│ • Chương trình Big Data & AI cho QĐND (01/09/2025)   │
│ • Chương trình Logistics 4.0 (20/08/2025)            │
│                                                       │
│ [Xem tất cả chương trình]                            │
└───────────────────────────────────────────────────────┘
```

### 4.2. Xem Chi tiết Lớp học

1. Vào **Đào tạo** → **Danh sách Lớp học**
2. Sử dụng bộ lọc để tìm lớp:
   - Theo Khoa
   - Theo Khóa học
   - Theo trạng thái (đang học, đã hoàn thành)
3. Click vào tên lớp để xem chi tiết

**Thông tin chi tiết lớp học:**
```
┌───────────────────────────────────────────────────────┐
│ LỚP HỌC: QUẢN LÝ HẬU CẦN HIỆN ĐẠI - K23              │
├───────────────────────────────────────────────────────┤
│ Thông tin chung:                                      │
│ • Khoa: Khoa Quân lý                                  │
│ • Giảng viên chủ nhiệm: Đại tá Nguyễn Văn A          │
│ • Số sinh viên: 45 sinh viên                          │
│ • Thời gian: 01/09/2024 - 30/06/2025                 │
│ • Tiến độ: 70% hoàn thành                             │
│                                                       │
│ Kết quả học tập:                                      │
│ • Điểm trung bình: 8.4/10                             │
│ • Xuất sắc: 12 sinh viên (27%)                        │
│ • Giỏi: 25 sinh viên (55%)                            │
│ • Khá: 7 sinh viên (16%)                              │
│ • Trung bình: 1 sinh viên (2%)                        │
│                                                       │
│ [Danh sách sinh viên] [Lịch học] [Điểm danh]         │
│ [Kết quả thi] [Báo cáo chi tiết]                      │
└───────────────────────────────────────────────────────┘
```

### 4.3. Phân tích Chất lượng Đào tạo

**Truy cập:** **Đào tạo** → **Phân tích Chất lượng**

**Các chỉ số đánh giá:**

1. **Đầu vào:**
   - Điểm trung bình đầu vào
   - Tỷ lệ học sinh giỏi/xuất sắc tuyển vào
   - Phân bố theo vùng miền

2. **Quá trình đào tạo:**
   - Tỷ lệ tham gia lớp học
   - Kết quả kiểm tra giữa kỳ
   - Đánh giá của sinh viên về giảng viên

3. **Đầu ra:**
   - Kết quả tốt nghiệp
   - Tỷ lệ có việc làm sau tốt nghiệp (cho các khóa đã tốt nghiệp)
   - Phản hồi từ đơn vị sử dụng

**Biểu đồ so sánh:**
- So sánh giữa các Khoa
- So sánh giữa các khóa học
- Xu hướng theo thời gian

### 4.4. Đánh giá Giảng viên

**Truy cập:** **Đào tạo** → **Đánh giá Giảng viên**

**Xem kết quả đánh giá:**
```
┌───────────────────────────────────────────────────────┐
│ TOP 10 GIẢNG VIÊN XUẤT SẮC                            │
├───────────────────────────────────────────────────────┤
│ 1. Đại tá Nguyễn Văn A    - Khoa Quân lý      9.5/10 │
│ 2. Thượng tá Trần Thị B   - Khoa Vận tải     9.3/10 │
│ 3. Thượng tá Lê Văn C     - Khoa Kỹ thuật    9.2/10 │
│ ...                                                   │
│                                                       │
│ Tiêu chí đánh giá:                                    │
│ • Chuyên môn và kiến thức        ⭐⭐⭐⭐⭐            │
│ • Phương pháp giảng dạy          ⭐⭐⭐⭐⭐            │
│ • Tương tác với học viên         ⭐⭐⭐⭐⭐            │
│ • Đánh giá và phản hồi           ⭐⭐⭐⭐⭐            │
│                                                       │
│ [Xem chi tiết] [Xuất báo cáo]                        │
└───────────────────────────────────────────────────────┘
```

### 4.5. Phê duyệt Kế hoạch Đào tạo

**Quy trình phê duyệt:**

1. Vào **Đào tạo** → **Kế hoạch chờ Phê duyệt**
2. Danh sách các kế hoạch cần phê duyệt hiển thị:
   ```
   ┌─────────────────────────────────────────────────┐
   │ KẾ HOẠCH CHỜ PHÊ DUYỆT                          │
   ├─────────────────────────────────────────────────┤
   │ 1. Kế hoạch Đào tạo ngắn hạn Q1/2026           │
   │    Khoa: Khoa Quân lý                           │
   │    Ngày đề xuất: 05/10/2025                     │
   │    [Xem chi tiết] [Phê duyệt] [Yêu cầu chỉnh sửa] │
   │                                                 │
   │ 2. Chương trình Đào tạo Logistics 4.0          │
   │    Khoa: Khoa Vận tải                           │
   │    Ngày đề xuất: 03/10/2025                     │
   │    [Xem chi tiết] [Phê duyệt] [Yêu cầu chỉnh sửa] │
   └─────────────────────────────────────────────────┘
   ```

3. Click **"Xem chi tiết"** để đọc nội dung kế hoạch
4. Xem xét các thông tin:
   - Mục tiêu
   - Nội dung
   - Thời gian thực hiện
   - Ngân sách dự kiến
   - Nguồn lực cần thiết
5. Quyết định:
   - **Phê duyệt:** Click "Phê duyệt" → Nhập ý kiến → Xác nhận
   - **Yêu cầu chỉnh sửa:** Click "Yêu cầu chỉnh sửa" → Nhập ý kiến → Gửi
   - **Từ chối:** Click "Từ chối" → Nhập lý do → Xác nhận

---

## 5. QUẢN LÝ NGHIÊN CỨU KHOA HỌC

### 5.1. Tổng quan Nghiên cứu

**Truy cập:** Menu → **Nghiên cứu** → **Tổng quan**

**Dashboard Nghiên cứu:**
```
┌───────────────────────────────────────────────────────┐
│ TỔNG QUAN NGHIÊN CỨU KHOA HỌC                         │
├───────────────────────────────────────────────────────┤
│ Năm học 2024-2025                                     │
│                                                       │
│ DỰ ÁN NGHIÊN CỨU:                                     │
│ • Đang triển khai:           42 dự án                 │
│ • Đã hoàn thành:             18 dự án                 │
│ • Chờ phê duyệt:             12 dự án                 │
│ • Tổng kinh phí:             15 tỷ VNĐ               │
│                                                       │
│ CÔNG BỐ KHOA HỌC:                                     │
│ • Bài báo quốc tế:           15 bài                   │
│ • Bài báo trong nước:        10 bài                   │
│ • Hội thảo/Hội nghị:         25 tham luận             │
│                                                       │
│ SỞ HỮU TRÍ TUỆ:                                       │
│ • Bằng độc quyền sáng chế:   3 bằng                   │
│ • Giải pháp hữu ích:         5 giải pháp             │
│                                                       │
│ [Xem chi tiết] [Báo cáo toàn diện]                    │
└───────────────────────────────────────────────────────┘
```

### 5.2. Danh sách Dự án Nghiên cứu

**Truy cập:** **Nghiên cứu** → **Danh sách Dự án**

**Bộ lọc:**
- Theo trạng thái (Đang triển khai, Hoàn thành, Chờ phê duyệt)
- Theo Khoa/Bộ môn
- Theo năm
- Theo lĩnh vực nghiên cứu
- Theo mức kinh phí

**Xem chi tiết dự án:**

Click vào tên dự án để xem:
```
┌───────────────────────────────────────────────────────┐
│ DỰ ÁN: ỨNG DỤNG BIG DATA TRONG QUẢN LÝ HẬU CẦN QĐND  │
├───────────────────────────────────────────────────────┤
│ THÔNG TIN CHUNG:                                      │
│ • Mã dự án: NC-2024-056                               │
│ • Chủ nhiệm: PGS.TS Nguyễn Văn A                     │
│ • Đơn vị: Khoa Quản lý                                │
│ • Thời gian: 01/2024 - 12/2025 (24 tháng)            │
│ • Kinh phí: 800 triệu VNĐ                             │
│ • Trạng thái: Đang triển khai (60% hoàn thành)       │
│                                                       │
│ MỤC TIÊU:                                             │
│ Xây dựng hệ thống quản lý dữ liệu lớn phục vụ công   │
│ tác quản lý hậu cần trong QĐND, ứng dụng AI/ML để    │
│ dự báo nhu cầu và tối ưu hóa nguồn lực...            │
│                                                       │
│ TIẾN ĐỘ:                                              │
│ [████████████░░░░░░░░] 60%                           │
│                                                       │
│ • Giai đoạn 1: Hoàn thành ✓                           │
│ • Giai đoạn 2: Đang thực hiện (80%)                   │
│ • Giai đoạn 3: Chưa bắt đầu                           │
│                                                       │
│ SẢN PHẨM ĐÃ CÓ:                                       │
│ • 3 bài báo hội nghị trong nước                       │
│ • 1 bài báo quốc tế (đang phản biện)                 │
│ • 1 phần mềm prototype                                │
│                                                       │
│ KINH PHÍ:                                             │
│ • Đã giải ngân: 480 triệu VNĐ (60%)                   │
│ • Còn lại: 320 triệu VNĐ                              │
│                                                       │
│ [Báo cáo tiến độ] [Sản phẩm] [Tài chính]             │
│ [Đánh giá] [Lịch sử]                                  │
└───────────────────────────────────────────────────────┘
```

### 5.3. Phê duyệt Đề xuất Nghiên cứu

**Quy trình:**

1. Vào **Nghiên cứu** → **Đề xuất chờ Phê duyệt**
2. Danh sách các đề xuất hiển thị với thông tin tóm tắt
3. Click **"Xem chi tiết"** để đọc đầy đủ đề xuất

**Nội dung đề xuất bao gồm:**
- Tên đề tài
- Chủ nhiệm và thành viên
- Lý do nghiên cứu
- Mục tiêu và câu hỏi nghiên cứu
- Phương pháp nghiên cứu
- Kế hoạch thực hiện
- Dự toán kinh phí chi tiết
- Sản phẩm dự kiến

**Các tiêu chí đánh giá:**
- ✅ Tính cấp thiết và ý nghĩa thực tiễn
- ✅ Tính khả thi
- ✅ Năng lực của nhóm nghiên cứu
- ✅ Tính hợp lý của kinh phí
- ✅ Sản phẩm dự kiến

**Quyết định:**

**Phê duyệt:**
1. Click **"Phê duyệt"**
2. Nhập ý kiến đánh giá (tùy chọn)
3. Xác nhận mức kinh phí phê duyệt
4. Click **"Xác nhận Phê duyệt"**

**Yêu cầu chỉnh sửa:**
1. Click **"Yêu cầu chỉnh sửa"**
2. Nhập chi tiết các phần cần chỉnh sửa
3. Click **"Gửi yêu cầu"**
4. Đề xuất sẽ được trả về cho chủ nhiệm để chỉnh sửa

**Từ chối:**
1. Click **"Từ chối"**
2. Nhập rõ lý do từ chối
3. Click **"Xác nhận Từ chối"**

### 5.4. Theo dõi Hiệu quả Nghiên cứu

**Dashboard Hiệu quả:**

```
┌───────────────────────────────────────────────────────┐
│ HIỆU QUẢ NGHIÊN CỨU                                   │
├───────────────────────────────────────────────────────┤
│ CHỈ SỐ XUẤT BẢN:                                      │
│                                                       │
│ Bài báo quốc tế (ISI/Scopus):        [████░] 15 bài  │
│ Mục tiêu năm: 20 bài                                  │
│                                                       │
│ Bài báo trong nước:                   [██████] 10 bài│
│ Mục tiêu năm: 8 bài  ✓ Vượt mục tiêu                 │
│                                                       │
│ CHỈ SỐ TÀI CHÍNH:                                     │
│                                                       │
│ Tổng kinh phí các dự án:              15 tỷ VNĐ      │
│ Từ ngân sách nhà nước:                10 tỷ VNĐ      │
│ Từ nguồn khác:                        5 tỷ VNĐ       │
│ Tỷ lệ giải ngân:                      68%            │
│                                                       │
│ CHỈ SỐ ỨNG DỤNG:                                      │
│                                                       │
│ Kết quả áp dụng vào thực tiễn:        8 dự án        │
│ Chuyển giao công nghệ:                3 hợp đồng     │
│ Đào tạo qua nghiên cứu:               45 học viên    │
│                                                       │
│ [Biểu đồ chi tiết] [So sánh với năm trước]           │
└───────────────────────────────────────────────────────┘
```

**Xếp hạng theo Đơn vị:**
```
┌───────────────────────────────────────────────────────┐
│ XẾP HẠNG ĐƠN VỊ NGHIÊN CỨU                           │
├───────────────────────────────────────────────────────┤
│ 1. 🥇 Khoa Quản lý           - 85 điểm                │
│    • 12 dự án, 8 bài báo quốc tế, 2 sáng chế         │
│                                                       │
│ 2. 🥈 Khoa Kỹ thuật          - 78 điểm                │
│    • 10 dự án, 5 bài báo quốc tế, 3 giải pháp       │
│                                                       │
│ 3. 🥉 Khoa Vận tải           - 72 điểm                │
│    • 8 dự án, 4 bài báo quốc tế, 1 sáng chế         │
│                                                       │
│ [Xem chi tiết tất cả đơn vị]                         │
└───────────────────────────────────────────────────────┘
```

### 5.5. Hội đồng Khoa học

**Truy cập:** **Nghiên cứu** → **Hội đồng Khoa học**

**Chức năng:**
- Xem lịch họp Hội đồng
- Xem biên bản các cuộc họp
- Danh sách các quyết định của Hội đồng
- Thành viên Hội đồng

**Thông báo họp Hội đồng:**
```
┌───────────────────────────────────────────────────────┐
│ LỊCH HỌP HỘI ĐỒNG KHOA HỌC                            │
├───────────────────────────────────────────────────────┤
│ Cuộc họp tiếp theo:                                   │
│                                                       │
│ 📅 Thời gian: 15/10/2025, 14:00                       │
│ 📍 Địa điểm: Phòng họp A2, Tòa nhà Hành chính        │
│                                                       │
│ Nội dung:                                             │
│ 1. Xét duyệt 5 đề xuất nghiên cứu cấp Học viện       │
│ 2. Nghiệm thu 3 đề tài hoàn thành                     │
│ 3. Xét tặng giải thưởng nghiên cứu xuất sắc          │
│                                                       │
│ [Xem chi tiết] [Tài liệu cuộc họp]                   │
└───────────────────────────────────────────────────────┘
```

---

## 6. BÁO CÁO VÀ PHÂN TÍCH

### 6.1. Các Loại Báo cáo

**Truy cập:** Menu → **Báo cáo**

**Danh mục báo cáo:**

1. **Báo cáo Định kỳ**
   - Báo cáo tuần
   - Báo cáo tháng
   - Báo cáo quý
   - Báo cáo năm học

2. **Báo cáo Chuyên đề**
   - Báo cáo Đào tạo
   - Báo cáo Nghiên cứu
   - Báo cáo Tài chính
   - Báo cáo Nhân sự

3. **Báo cáo So sánh**
   - So sánh giữa các Khoa
   - So sánh theo thời gian
   - So sánh với chỉ tiêu

### 6.2. Tạo Báo cáo Tùy chỉnh

**Bước 1: Chọn loại báo cáo**
1. Click **"Tạo báo cáo mới"**
2. Chọn template:
   - Báo cáo tổng hợp
   - Báo cáo chuyên đề
   - Báo cáo so sánh

**Bước 2: Cấu hình báo cáo**
```
┌───────────────────────────────────────────────────────┐
│ TẠO BÁO CÁO TÙY CHỈNH                                 │
├───────────────────────────────────────────────────────┤
│ Tên báo cáo:                                          │
│ [Báo cáo tổng kết năm học 2024-2025           ]      │
│                                                       │
│ Khoảng thời gian:                                     │
│ Từ: [01/09/2024] Đến: [30/06/2025]                   │
│                                                       │
│ Phạm vi:                                              │
│ ☑ Toàn học viện                                       │
│ ☐ Chỉ một số Khoa (chọn Khoa)                         │
│                                                       │
│ Nội dung bao gồm:                                     │
│ ☑ Tổng quan và chỉ số chính                           │
│ ☑ Hoạt động đào tạo                                   │
│ ☑ Nghiên cứu khoa học                                 │
│ ☑ Tài chính và ngân sách                              │
│ ☑ Nhân sự                                             │
│ ☑ Biểu đồ và phân tích                                │
│                                                       │
│ Định dạng xuất:                                       │
│ ● PDF  ○ Excel  ○ PowerPoint                         │
│                                                       │
│ [Xem trước] [Tạo báo cáo]                             │
└───────────────────────────────────────────────────────┘
```

**Bước 3: Xem trước và Tạo**
- Click **"Xem trước"** để kiểm tra
- Nếu hài lòng, click **"Tạo báo cáo"**
- Hệ thống sẽ xử lý và gửi báo cáo qua email hoặc cho phép tải xuống

### 6.3. Báo cáo Phân tích Chiến lược

**Truy cập:** **Báo cáo** → **Phân tích Chiến lược**

**Các phân tích có sẵn:**

**A. Phân tích SWOT**
```
┌───────────────────────────────────────────────────────┐
│ PHÂN TÍCH SWOT - HỌC VIỆN HẬU CẦN                     │
├───────────────────────────────────────────────────────┤
│ ĐIỂM MẠNH (Strengths):                                │
│ • Đội ngũ giảng viên chất lượng cao                   │
│ • Cơ sở vật chất hiện đại                             │
│ • Uy tín và thương hiệu trong QĐND                    │
│ • Hệ thống Big Data tiên tiến                         │
│                                                       │
│ ĐIỂM YẾU (Weaknesses):                                │
│ • Chưa nhiều nghiên cứu công bố quốc tế               │
│ • Liên kết với doanh nghiệp còn hạn chế               │
│                                                       │
│ CƠ HỘI (Opportunities):                               │
│ • Nhu cầu đào tạo nhân lực hậu cần tăng cao           │
│ • Ứng dụng công nghệ 4.0 trong quân đội               │
│ • Hợp tác quốc tế mở rộng                             │
│                                                       │
│ THÁCH THỨC (Threats):                                 │
│ • Cạnh tranh với các trường đại học dân sự            │
│ • Biến động công nghệ nhanh                           │
│                                                       │
│ [Xem phân tích chi tiết] [Xuất báo cáo]               │
└───────────────────────────────────────────────────────┘
```

**B. Phân tích Xu hướng**
```
┌───────────────────────────────────────────────────────┐
│ XU HƯỚNG 5 NĂM (2020-2025)                            │
├───────────────────────────────────────────────────────┤
│                                                       │
│ SỐ LƯỢNG SINH VIÊN:                                   │
│   2020  ▓▓▓▓▓▓▓▓▓░  2,100                            │
│   2021  ▓▓▓▓▓▓▓▓▓▓  2,200                            │
│   2022  ▓▓▓▓▓▓▓▓▓▓▓ 2,350                            │
│   2023  ▓▓▓▓▓▓▓▓▓▓▓ 2,380                            │
│   2024  ▓▓▓▓▓▓▓▓▓▓▓▓ 2,450                           │
│   Xu hướng: ↗ Tăng trưởng ổn định 3-5% mỗi năm       │
│                                                       │
│ NGHIÊN CỨU KHOA HỌC:                                  │
│   2020  ▓▓▓▓▓▓░░░░  25 dự án                          │
│   2021  ▓▓▓▓▓▓▓░░░  28 dự án                          │
│   2022  ▓▓▓▓▓▓▓▓░░  32 dự án                          │
│   2023  ▓▓▓▓▓▓▓▓▓░  36 dự án                          │
│   2024  ▓▓▓▓▓▓▓▓▓▓  42 dự án                          │
│   Xu hướng: ↗ Tăng mạnh, trung bình 12% mỗi năm      │
│                                                       │
│ DỰ BÁO 2025-2026:                                     │
│ • Sinh viên: 2,580 (+5.3%)                            │
│ • Dự án nghiên cứu: 48 (+14%)                         │
│ • Công bố quốc tế: 25 bài (+25%)                      │
│                                                       │
│ [Xem phân tích đầy đủ]                                │
└───────────────────────────────────────────────────────┘
```

**C. Benchmarking (So sánh với các trường tương đương)**
```
┌───────────────────────────────────────────────────────┐
│ SO SÁNH VỚI CÁC TRƯỜNG QUÂN ĐỘI                       │
├───────────────────────────────────────────────────────┤
│ Chỉ số              | HVHC | Trung bình | Xếp hạng   │
│─────────────────────┼──────┼────────────┼────────────│
│ Số sinh viên        | 2450 | 2200       | 🥈 Thứ 2   │
│ Giảng viên PGS/GS   | 18%  | 15%        | 🥇 Thứ 1   │
│ Công bố quốc tế     | 15   | 12         | 🥇 Thứ 1   │
│ Kinh phí NC/GV      | 83M  | 75M        | 🥈 Thứ 2   │
│ Tỷ lệ tốt nghiệp    | 94%  | 91%        | 🥇 Thứ 1   │
│                                                       │
│ NHẬN XÉT:                                             │
│ Học viện Hậu cần đang đứng vị trí số 1-2 trong các   │
│ trường quân đội về hầu hết các chỉ số. Cần tiếp tục  │
│ duy trì và phát huy lợi thế, đặc biệt là nghiên cứu  │
│ khoa học và chất lượng đào tạo.                       │
└───────────────────────────────────────────────────────┘
```

### 6.4. Xuất Báo cáo

**Các định dạng hỗ trợ:**
- **PDF** - Báo cáo chính thức, in ấn
- **Excel** - Dữ liệu chi tiết, phân tích thêm
- **PowerPoint** - Trình bày, thuyết trình
- **Word** - Chỉnh sửa nội dung

**Cách xuất:**
1. Mở báo cáo cần xuất
2. Click nút **"Xuất báo cáo"** 📥 ở góc trên
3. Chọn định dạng
4. Click **"Tải xuống"**
5. File sẽ được tải về máy tính

**Lưu ý:**
- Báo cáo chứa dữ liệu nhạy cảm, cần bảo mật
- Không chia sẻ ra bên ngoài học viện
- Đánh dấu mật độ phù hợp khi in ấn

---

## 7. QUẢN LÝ TỔ CHỨC

### 7.1. Cơ cấu Tổ chức

**Truy cập:** Menu → **Tổ chức**

**Sơ đồ tổ chức:**
```
                    HỌC VIỆN HẬU CẦN
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   CÁC KHOA          CÁC PHÒNG         CÁC HỆ
        │                 │                 │
   ┌────┴────┐       ┌────┴────┐      ┌────┴────┐
   │         │       │         │      │         │
Khoa    Khoa      Phòng    Phòng    Hệ     Hệ
Quân lý Vận tải   ĐTTC     KH&TC   Chính trị Cơ yếu
```

**Xem thông tin đơn vị:**
- Click vào tên đơn vị trên sơ đồ
- Xem chi tiết: Lãnh đạo, nhân sự, hoạt động, thành tích

### 7.2. Quản lý Nhân sự

**Dashboard Nhân sự:**
```
┌───────────────────────────────────────────────────────┐
│ TỔNG QUAN NHÂN SỰ                                     │
├───────────────────────────────────────────────────────┤
│ TỔNG SỐ CÁN BỘ, GIẢNG VIÊN:           320 người      │
│                                                       │
│ Theo cấp bậc:                                         │
│ • Thiếu tướng:                   2 người             │
│ • Đại tá:                        15 người            │
│ • Thượng tá:                     68 người            │
│ • Trung tá:                      95 người            │
│ • Khác:                          140 người           │
│                                                       │
│ Theo trình độ:                                        │
│ • Giáo sư:                       5 người (1.6%)      │
│ • Phó Giáo sư:                   18 người (5.6%)     │
│ • Tiến sĩ:                       82 người (25.6%)    │
│ • Thạc sĩ:                       165 người (51.6%)   │
│ • Khác:                          50 người (15.6%)    │
│                                                       │
│ [Xem chi tiết] [Xuất danh sách]                      │
└───────────────────────────────────────────────────────┘
```

**Phân tích Nhân sự:**
- Cơ cấu độ tuổi
- Tỷ lệ nam/nữ
- Phân bổ theo đơn vị
- Nhu cầu đào tạo nâng cao

### 7.3. Đánh giá Hiệu quả Đơn vị

**Bảng xếp hạng các Khoa:**
```
┌───────────────────────────────────────────────────────┐
│ XẾP HẠNG HIỆU QUẢ CÁC KHOA/PHÒNG                      │
├───────────────────────────────────────────────────────┤
│ Tiêu chí đánh giá:                                    │
│ • Đào tạo (40%)                                       │
│ • Nghiên cứu (30%)                                    │
│ • Công tác chính trị (15%)                            │
│ • Quản lý hành chính (15%)                            │
│                                                       │
│ XẾP HẠNG:                                             │
│                                                       │
│ 1. 🥇 Khoa Quản lý            92.5 điểm  - Xuất sắc  │
│    Điểm mạnh: Nghiên cứu và đào tạo                   │
│                                                       │
│ 2. 🥈 Khoa Kỹ thuật           89.3 điểm  - Xuất sắc  │
│    Điểm mạnh: Nghiên cứu ứng dụng                     │
│                                                       │
│ 3. 🥉 Khoa Vận tải            87.8 điểm  - Tốt       │
│    Điểm mạnh: Đào tạo chất lượng cao                  │
│                                                       │
│ 4. Khoa Tài chính             85.2 điểm  - Tốt       │
│ 5. Khoa Quân y                83.6 điểm  - Tốt       │
│                                                       │
│ [Xem chi tiết từng đơn vị] [Lịch sử xếp hạng]        │
└───────────────────────────────────────────────────────┘
```

**Xem chi tiết đơn vị:**
- Click vào tên đơn vị
- Xem điểm số từng tiêu chí
- So sánh với kỳ trước
- Điểm mạnh và điểm cần cải thiện
- Khuyến nghị

### 7.4. Khen thưởng và Kỷ luật

**Danh sách Khen thưởng:**
```
┌───────────────────────────────────────────────────────┐
│ KHEN THƯỞNG NĂM 2025                                  │
├───────────────────────────────────────────────────────┤
│ Tập thể:                                              │
│ • Bằng khen Bộ Quốc phòng:      3 đơn vị             │
│ • Bằng khen Học viện:            8 đơn vị             │
│ • Giấy khen:                     15 đơn vị            │
│                                                       │
│ Cá nhân:                                              │
│ • Huân chương:                   2 người             │
│ • Bằng khen Bộ:                  12 người            │
│ • Bằng khen Học viện:            35 người            │
│ • Giấy khen:                     120 người           │
│                                                       │
│ [Danh sách chi tiết] [Quyết định khen thưởng]        │
└───────────────────────────────────────────────────────┘
```

---

## 8. RA QUYẾT ĐỊNH CHIẾN LƯỢC

### 8.1. Công cụ Hỗ trợ Ra quyết định (DSS)

**Truy cập:** Menu → **Ra quyết định**

**Các công cụ có sẵn:**

**A. Mô phỏng Kịch bản (What-if Analysis)**
```
┌───────────────────────────────────────────────────────┐
│ MÔ PHỎNG KỊCH BẢN                                     │
├───────────────────────────────────────────────────────┤
│ Câu hỏi: Nếu tăng số lượng tuyển sinh lên 10%, các   │
│ nguồn lực cần thiết là gì?                            │
│                                                       │
│ THAM SỐ ĐẦU VÀO:                                      │
│ • Sinh viên hiện tại:        2,450 người             │
│ • Tỷ lệ tăng:                 10%                     │
│ • Năm áp dụng:                2026                    │
│                                                       │
│ [Chạy mô phỏng]                                       │
│                                                       │
│ KẾT QUẢ DỰ BÁO:                                       │
│ • Sinh viên mới:              2,695 người (+245)     │
│ • Giảng viên cần thêm:        12 người               │
│ • Phòng học cần thêm:         3 phòng                │
│ • Ngân sách tăng:             +8% (4 tỷ VNĐ)        │
│ • Thư viện, thiết bị:         +800 triệu VNĐ         │
│                                                       │
│ KHUYẾN NGHỊ:                                          │
│ ✓ Khả thi với kế hoạch 2 năm                         │
│ ✓ Cần tuyển dụng giảng viên từ Q3/2025               │
│ ✓ Cần mở rộng cơ sở vật chất                         │
│                                                       │
│ [Xem chi tiết] [Lưu kịch bản] [So sánh kịch bản]     │
└───────────────────────────────────────────────────────┘
```

**B. Dự báo Xu hướng (Forecasting)**
```
┌───────────────────────────────────────────────────────┐
│ DỰ BÁO XU HƯỚNG                                       │
├───────────────────────────────────────────────────────┤
│ Chọn chỉ số cần dự báo:                               │
│ ● Số lượng sinh viên                                  │
│ ○ Số dự án nghiên cứu                                 │
│ ○ Ngân sách                                           │
│                                                       │
│ Khoảng thời gian dự báo: [3 năm tới (2026-2028)]     │
│                                                       │
│ [Tạo dự báo]                                          │
│                                                       │
│ KẾT QUẢ (sử dụng AI/ML):                              │
│                                                       │
│ Năm 2026: 2,580 sinh viên (95% confidence)           │
│ Năm 2027: 2,710 sinh viên (92% confidence)           │
│ Năm 2028: 2,850 sinh viên (88% confidence)           │
│                                                       │
│ [Biểu đồ xu hướng]                                    │
│                                                       │
│ 3000 │                                         ╱      │
│ 2800 │                                   ╱            │
│ 2600 │                           ╱                    │
│ 2400 │                   ╱                            │
│ 2200 │           ╱                                    │
│ 2000 │   ╱                                            │
│      └───────────────────────────────────────────    │
│        2023  2024  2025  2026  2027  2028            │
│                                                       │
│ Các yếu tố ảnh hưởng:                                 │
│ • Xu hướng tăng ổn định 5% hàng năm                   │
│ • Nhu cầu nhân lực hậu cần quân đội                   │
│ • Chính sách tuyển sinh                               │
└───────────────────────────────────────────────────────┘
```

**C. Phân tích Đa tiêu chí (Multi-Criteria Decision Analysis)**
```
┌───────────────────────────────────────────────────────┐
│ HỖ TRỢ QUYẾT ĐỊNH ĐA TIÊU CHÍ                         │
├───────────────────────────────────────────────────────┤
│ Quyết định: Chọn dự án nghiên cứu ưu tiên đầu tư     │
│                                                       │
│ Danh sách dự án:                                      │
│ 1. Ứng dụng AI trong Quản lý Hậu cần                 │
│ 2. Hệ thống Logistics thông minh                      │
│ 3. Blockchain cho Quản lý Tài sản                     │
│                                                       │
│ Tiêu chí đánh giá (có thể tùy chỉnh trọng số):       │
│ • Tác động thực tiễn:         30%  [░░░░░░▓▓▓▓]      │
│ • Tính khả thi:               25%  [░░░░░▓▓▓▓▓]      │
│ • Kinh phí hợp lý:            20%  [░░░░▓▓▓▓▓▓]      │
│ • Đội ngũ thực hiện:          15%  [░░░▓▓▓▓▓▓▓]      │
│ • Thời gian hoàn thành:       10%  [░░▓▓▓▓▓▓▓▓]      │
│                                                       │
│ [Tính toán điểm]                                      │
│                                                       │
│ KẾT QUẢ:                                              │
│ 1. 🥇 Ứng dụng AI trong QL Hậu cần    85.6 điểm     │
│ 2. 🥈 Hệ thống Logistics thông minh    82.3 điểm     │
│ 3. 🥉 Blockchain cho QL Tài sản        78.9 điểm     │
│                                                       │
│ KHUYẾN NGHỊ: Ưu tiên dự án "Ứng dụng AI"             │
│                                                       │
│ [Xem phân tích chi tiết] [Xuất báo cáo]               │
└───────────────────────────────────────────────────────┘
```

### 8.2. Phân tích Ngân sách và Phân bổ Tài nguyên

**Truy cập:** **Ra quyết định** → **Phân bổ Ngân sách**

```
┌───────────────────────────────────────────────────────┐
│ PHÂN BỔ NGÂN SÁCH NĂM 2026                            │
├───────────────────────────────────────────────────────┤
│ TỔNG NGÂN SÁCH DỰ KIẾN:       55 tỷ VNĐ              │
│                                                       │
│ ĐỀ XUẤT PHÂN BỔ:                                      │
│                                                       │
│ 1. Đào tạo                    22 tỷ (40%)            │
│    ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░                          │
│    • Học bổng, chi phí học tập                        │
│    • Cơ sở vật chất, thiết bị                         │
│                                                       │
│ 2. Nghiên cứu Khoa học        16.5 tỷ (30%)          │
│    ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░                          │
│    • Các dự án nghiên cứu                             │
│    • Hội nghị, công bố                                │
│                                                       │
│ 3. Đầu tư Cơ sở vật chất      11 tỷ (20%)            │
│    ▓▓▓▓░░░░░░░░░░░░░░░░░░░░                          │
│    • Xây dựng, sửa chữa                               │
│    • Mua sắm thiết bị                                 │
│                                                       │
│ 4. Hành chính, Quản lý        5.5 tỷ (10%)           │
│    ▓▓░░░░░░░░░░░░░░░░░░░░░░                          │
│    • Lương, phụ cấp                                   │
│    • Chi phí vận hành                                 │
│                                                       │
│ [Điều chỉnh phân bổ] [Xem chi tiết từng mục]         │
│ [So sánh với năm trước] [Phê duyệt]                   │
└───────────────────────────────────────────────────────┘
```

**Công cụ tối ưu:**
- Tự động đề xuất phân bổ dựa trên mục tiêu chiến lược
- So sánh các phương án phân bổ
- Dự báo tác động của từng phương án

### 8.3. Kế hoạch Chiến lược

**Xem Kế hoạch Chiến lược hiện tại:**

**Truy cập:** **Ra quyết định** → **Kế hoạch Chiến lược**

```
┌───────────────────────────────────────────────────────┐
│ KẾ HOẠCH CHIẾN LƯỢC 2025-2030                         │
├───────────────────────────────────────────────────────┤
│ TẦM NHÌN:                                             │
│ Trở thành trung tâm đào tạo và nghiên cứu hậu cần    │
│ hàng đầu trong Quân đội, ứng dụng công nghệ 4.0      │
│                                                       │
│ MỤC TIÊU CHIẾN LƯỢC:                                  │
│                                                       │
│ 1. Nâng cao Chất lượng Đào tạo                        │
│    • KPI: Tỷ lệ xuất sắc/giỏi đạt 75% vào 2030       │
│    • Tiến độ: [████████░░] 80% - Đúng hạn            │
│                                                       │
│ 2. Phát triển Nghiên cứu Khoa học                     │
│    • KPI: 30 bài báo quốc tế/năm vào 2030            │
│    • Tiến độ: [██████░░░░] 60% - Đúng hạn            │
│                                                       │
│ 3. Ứng dụng Công nghệ và Big Data                     │
│    • KPI: 100% quy trình số hóa vào 2030              │
│    • Tiến độ: [███████░░░] 70% - Đúng hạn            │
│                                                       │
│ 4. Hợp tác Quốc tế                                    │
│    • KPI: 5 chương trình hợp tác quốc tế vào 2030    │
│    • Tiến độ: [█████░░░░░] 50% - Cần đẩy nhanh       │
│                                                       │
│ 5. Phát triển Đội ngũ                                 │
│    • KPI: 80% giảng viên có trình độ TS/PGS/GS       │
│    • Tiến độ: [████░░░░░░] 40% - Cần tăng tốc        │
│                                                       │
│ [Xem chi tiết từng mục tiêu] [Cập nhật tiến độ]      │
│ [Báo cáo đánh giá giữa kỳ]                            │
└───────────────────────────────────────────────────────┘
```

**Theo dõi thực hiện:**
- Cập nhật tiến độ định kỳ
- Cảnh báo khi có mục tiêu chậm tiến độ
- Đề xuất điều chỉnh khi cần thiết

---

## 9. CÁC TÍNH NĂNG NÂNG CAO

### 9.1. Dashboard Cá nhân hóa

**Tùy chỉnh Dashboard:**
1. Vào **Dashboard** → Click **"Tùy chỉnh"** ⚙️
2. Chọn các widget cần hiển thị:
   - Tổng quan nhanh
   - Hoạt động đào tạo
   - Nghiên cứu khoa học
   - Tài chính
   - Thông báo quan trọng
3. Kéo thả để sắp xếp vị trí
4. Click **"Lưu"**

### 9.2. Thông báo và Cảnh báo

**Cấu hình Thông báo:**

**Truy cập:** **Hồ sơ** → **Cài đặt Thông báo**

```
┌───────────────────────────────────────────────────────┐
│ CÀI ĐẶT THÔNG BÁO                                     │
├───────────────────────────────────────────────────────┤
│ Nhận thông báo qua:                                   │
│ ☑ Email                                               │
│ ☑ Hệ thống (hiển thị trên web)                        │
│ ☐ SMS (chỉ thông báo khẩn cấp)                        │
│                                                       │
│ Loại thông báo:                                       │
│ ☑ Đề xuất/Dự án chờ phê duyệt                         │
│ ☑ Báo cáo định kỳ sẵn sàng                            │
│ ☑ Cảnh báo mục tiêu chậm tiến độ                      │
│ ☑ Sự kiện quan trọng                                  │
│ ☐ Hoạt động hàng ngày (có thể gây nhiễu)             │
│                                                       │
│ Tần suất:                                             │
│ ● Ngay lập tức                                        │
│ ○ Tổng hợp cuối ngày                                  │
│ ○ Tổng hợp cuối tuần                                  │
│                                                       │
│ [Lưu cài đặt]                                         │
└───────────────────────────────────────────────────────┘
```

**Xem Thông báo:**
- Click vào icon 🔔 ở góc trên bên phải
- Danh sách thông báo hiển thị, mới nhất ở trên
- Click vào từng thông báo để xem chi tiết
- Đánh dấu đã đọc hoặc xóa

### 9.3. Tìm kiếm Nâng cao

**Thanh Tìm kiếm Toàn cục:**
- Ở góc trên bên phải, nhập từ khóa vào ô tìm kiếm
- Hệ thống tìm trong:
  - Người dùng
  - Dự án nghiên cứu
  - Báo cáo
  - Lớp học
  - Dataset
  - Tài liệu

**Bộ lọc Tìm kiếm:**
```
┌───────────────────────────────────────────────────────┐
│ TÌM KIẾM NÂNG CAO                                     │
├───────────────────────────────────────────────────────┤
│ Từ khóa: [Big Data                                 ]  │
│                                                       │
│ Loại nội dung:                                        │
│ ☑ Tất cả                                              │
│ ☐ Dự án nghiên cứu                                    │
│ ☐ Báo cáo                                             │
│ ☐ Dataset                                             │
│                                                       │
│ Thời gian:                                            │
│ ● Bất kỳ                                              │
│ ○ 1 tháng gần đây                                     │
│ ○ 3 tháng gần đây                                     │
│ ○ Năm nay                                             │
│ ○ Tùy chỉnh: [Từ ngày] - [Đến ngày]                  │
│                                                       │
│ Đơn vị:                                               │
│ [Tất cả các Khoa                          ▼]          │
│                                                       │
│ [Tìm kiếm]                                            │
└───────────────────────────────────────────────────────┘
```

### 9.4. Lịch sử và Audit Trail

**Xem Lịch sử Hoạt động:**

**Truy cập:** **Hồ sơ** → **Lịch sử Hoạt động**

```
┌───────────────────────────────────────────────────────┐
│ LỊCH SỬ HOẠT ĐỘNG CỦA BẠN                             │
├───────────────────────────────────────────────────────┤
│ 10/10/2025 09:15  Đăng nhập hệ thống                  │
│ 10/10/2025 09:20  Xem Dashboard Tổng quan             │
│ 10/10/2025 09:35  Phê duyệt dự án NC-2025-128         │
│ 10/10/2025 10:00  Xuất báo cáo tháng 9/2025 (PDF)     │
│ 10/10/2025 10:30  Xem chi tiết Khoa Quản lý           │
│ 09/10/2025 14:20  Tạo báo cáo tùy chỉnh               │
│ 09/10/2025 15:00  Phê duyệt kế hoạch đào tạo Q1/2026  │
│ ...                                                   │
│                                                       │
│ [Tải thêm] [Xuất lịch sử]                             │
└───────────────────────────────────────────────────────┘
```

**Mục đích:**
- Theo dõi các hoạt động của bạn
- Kiểm tra lại các quyết định đã đưa ra
- Đảm bảo trách nhiệm giải trình

### 9.5. Trợ lý AI (AI Assistant)

**Kích hoạt Trợ lý AI:**
- Click vào icon 🤖 ở góc dưới bên phải
- Hoặc nhấn tổ hợp phím `Ctrl + K`

**Các câu hỏi mẫu:**

```
┌───────────────────────────────────────────────────────┐
│ 🤖 TRỢ LÝ AI                                          │
├───────────────────────────────────────────────────────┤
│ Bạn: "Hiệu quả đào tạo tháng này thế nào?"            │
│                                                       │
│ AI:  Tháng 10/2025, hiệu quả đào tạo rất tốt:        │
│      • Tỷ lệ hoàn thành: 94.5% (+2.1% so với tháng 9) │
│      • Điểm trung bình: 8.2/10 (+0.3 điểm)            │
│      • 45 lớp đang hoạt động                          │
│      • Không có lớp nào chậm tiến độ                  │
│                                                       │
│      Bạn có muốn xem chi tiết theo từng Khoa?         │
│                                                       │
│ [Có] [Không] [Xuất báo cáo]                           │
└───────────────────────────────────────────────────────┘
```

**Các tính năng AI:**
- Trả lời câu hỏi về dữ liệu
- Tạo báo cáo nhanh
- Gợi ý quyết định
- Tóm tắt thông tin

**Ví dụ câu hỏi:**
- "Dự án nghiên cứu nào đang chậm tiến độ?"
- "So sánh hiệu suất của Khoa Quản lý và Khoa Vận tải"
- "Tạo báo cáo tổng kết tháng 9"
- "Ngân sách năm nay còn lại bao nhiêu?"
- "Top 5 giảng viên có điểm đánh giá cao nhất"

### 9.6. Xuất dữ liệu và API

**Xuất Dữ liệu:**

Hầu hết các trang đều có nút **"Xuất"** 📥 để xuất dữ liệu:
- **CSV/Excel** - Dữ liệu dạng bảng
- **PDF** - Báo cáo, tài liệu
- **JSON** - Dữ liệu cho hệ thống khác

**API Access (cho kết nối với hệ thống khác):**

**Truy cập:** **Hồ sơ** → **API Access**

1. Tạo API Key:
   - Click **"Tạo API Key mới"**
   - Nhập tên (ví dụ: "Kết nối hệ thống Báo cáo BQP")
   - Chọn quyền (Read-only khuyến nghị)
   - Click **"Tạo"**
2. Sao chép API Key (chỉ hiển thị 1 lần)
3. Sử dụng API Key để kết nối từ hệ thống khác

**Lưu ý bảo mật:**
- API Key có quyền truy cập như tài khoản của bạn
- Không chia sẻ API Key
- Nếu bị lộ, hủy bỏ ngay và tạo key mới

---

## PHỤ LỤC

### A. Phím tắt

| Phím tắt | Chức năng |
|----------|-----------|
| `Ctrl + K` | Mở Trợ lý AI |
| `Ctrl + /` | Mở/Đóng menu |
| `Ctrl + F` | Tìm kiếm |
| `Ctrl + E` | Xuất dữ liệu trang hiện tại |
| `Ctrl + P` | In trang hiện tại |
| `Esc` | Đóng dialog/modal |

### B. Thuật ngữ

| Thuật ngữ | Giải thích |
|-----------|------------|
| **Dashboard** | Bảng điều khiển hiển thị tổng quan |
| **KPI** | Key Performance Indicator - Chỉ số đánh giá hiệu suất |
| **Data Lake** | Kho dữ liệu lớn chứa dữ liệu thô |
| **ML/AI** | Machine Learning/Artificial Intelligence - Học máy/Trí tuệ nhân tạo |
| **Dataset** | Tập dữ liệu |
| **Benchmark** | So sánh, đối chuẩn |
| **SWOT** | Strengths, Weaknesses, Opportunities, Threats - Phân tích điểm mạnh, yếu, cơ hội, thách thức |

### C. Câu hỏi Thường gặp (FAQ)

**Q: Tôi quên mật khẩu, làm sao để lấy lại?**
A: Liên hệ với Admin qua email admin@hvhc.edu.vn hoặc gọi 024-xxxx-xxxx để được hỗ trợ reset mật khẩu.

**Q: Tôi không thấy một số chức năng trong menu?**
A: Có thể quyền truy cập của bạn không bao gồm chức năng đó. Liên hệ Admin nếu bạn cần quyền truy cập thêm.

**Q: Làm sao để xem báo cáo của năm trước?**
A: Vào **Báo cáo** → Chọn **"Năm học"** trong bộ lọc → Chọn năm cần xem.

**Q: Tôi có thể truy cập hệ thống từ điện thoại không?**
A: Có, hệ thống hỗ trợ responsive design. Tuy nhiên, một số chức năng nâng cao nên sử dụng trên máy tính để có trải nghiệm tốt nhất.

**Q: Dữ liệu trong hệ thống được cập nhật khi nào?**
A: Dữ liệu real-time (như dashboard) cập nhật liên tục. Báo cáo thống kê cập nhật mỗi ngày lúc 06:00 sáng.

**Q: Làm sao để phê duyệt nhiều đề xuất cùng lúc?**
A: Hiện tại, mỗi đề xuất cần phê duyệt riêng để đảm bảo xem xét kỹ lưỡng.

**Q: Tôi có thể ủy quyền phê duyệt cho người khác không?**
A: Có, vào **Hồ sơ** → **Ủy quyền** → Chọn người được ủy quyền và thời gian.

### D. Hỗ trợ Kỹ thuật

**Khi gặp vấn đề:**

1. **Lỗi nhỏ (UI, hiển thị):**
   - Thử refresh trang (F5)
   - Xóa cache trình duyệt
   - Thử trình duyệt khác

2. **Lỗi nghiêm trọng (không đăng nhập được, mất dữ liệu):**
   - Liên hệ ngay Hotline: 024-xxxx-xxxx (24/7)
   - Email: support@hvhc.edu.vn
   - Cung cấp thông tin:
     * Thời gian xảy ra lỗi
     * Các bước đã làm trước khi gặp lỗi
     * Screenshot nếu có

3. **Yêu cầu hỗ trợ sử dụng:**
   - Email: support@hvhc.edu.vn
   - Trả lời trong vòng 4 giờ làm việc

**Thời gian hỗ trợ:**
- Hotline: 24/7
- Email: Giờ hành chính (7:30 - 17:00, Thứ 2 - Thứ 6)

---

## KẾT LUẬN

Hệ thống Big Data của Học viện Hậu cần là công cụ mạnh mẽ hỗ trợ Chỉ huy Học viện trong việc:
- **Giám sát** toàn diện hoạt động của học viện
- **Ra quyết định** dựa trên dữ liệu và phân tích khoa học
- **Quản lý** hiệu quả các nguồn lực
- **Dự báo** và lập kế hoạch chiến lược

Nếu có bất kỳ thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ:

**Hotline Kỹ thuật:** 024-xxxx-xxxx (24/7)  
**Email:** support@hvhc.edu.vn  
**Tài liệu chi tiết:** https://docs.bigdata.hvhc.edu.vn

---

*Tài liệu này là tài liệu nội bộ của Học viện Hậu cần. Vui lòng không chia sẻ ra bên ngoài.*

**Học viện Hậu cần - Bộ Quốc phòng**  
*Đào tạo chất lượng cao - Nghiên cứu khoa học tiên tiến - Phục vụ hiệu quả sự nghiệp bảo vệ Tổ quốc*

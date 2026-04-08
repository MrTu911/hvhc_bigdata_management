
# 🚀 Data Pipeline Intelligence Layer - Phase 1.5

## 📋 Tổng quan

Đây là **Phase 1.5 - Data Pipeline Intelligence** của hệ thống BigDataAI_HVHC, bổ sung khả năng **tự động xử lý, phân tích, và làm sạch dữ liệu** sau khi upload.

---

## ✨ Tính năng mới

### 1. **Auto-Processing Pipeline**
- ✅ Tự động phân tích dữ liệu ngay sau khi upload
- ✅ Phát hiện schema và kiểu dữ liệu
- ✅ Tính toán quality score (0-100)
- ✅ Phát hiện lỗi và cảnh báo chất lượng

### 2. **Data Preview & Inspection**
- ✅ Preview 100 dòng đầu tiên
- ✅ Xem thống kê chi tiết từng cột
- ✅ Hiển thị warnings và errors
- ✅ Export schema information

### 3. **Data Cleaning & Transformation**
- ✅ Xóa dòng null
- ✅ Xóa duplicate rows
- ✅ Fill null values với giá trị mặc định
- ✅ Tạo phiên bản mới (version control)
- ✅ Ước tính cải thiện quality score

### 4. **Version Control**
- ✅ Lưu nhiều phiên bản của dataset
- ✅ Theo dõi changes history
- ✅ Rollback về phiên bản cũ

### 5. **Data Management Dashboard**
- ✅ Browse tất cả datasets
- ✅ Filter theo status và quality
- ✅ Search và sort
- ✅ Quick preview và edit

---

## 🗂️ Cấu trúc file mới

```
nextjs_space/
├── lib/
│   ├── data-processor.ts      ← Core data processing logic
│   └── db-query.ts             ← Database query wrapper
│
├── app/api/data/
│   ├── preview/[id]/route.ts   ← API xem preview dataset
│   ├── stats/[id]/route.ts     ← API lấy statistics
│   ├── clean/[id]/route.ts     ← API làm sạch dataset
│   ├── versions/[id]/route.ts  ← API quản lý versions
│   ├── process/route.ts        ← API tự động xử lý
│   └── list/route.ts           ← API list datasets
│
├── app/data/
│   ├── preview/[id]/page.tsx   ← UI xem preview
│   └── edit/[id]/page.tsx      ← UI clean & edit
│
└── app/(dashboard)/dashboard/data/
    └── manage/page.tsx         ← Data management dashboard

sql_migrations/
└── 006_data_processing_pipeline.sql  ← Database schema
```

---

## 🗄️ Database Schema

### Bảng mới:

1. **`data_processing_logs`** - Lưu lịch sử xử lý
2. **`data_versions`** - Version control
3. **`data_quality_metrics`** - Chỉ số chất lượng
4. **`data_schemas`** - Schema information

### Cột mới trong `research_files`:

- `processing_status` - UNPROCESSED, PROCESSING, PROCESSED, CLEANED, FAILED
- `last_processed_at` - Thời gian xử lý cuối
- `quality_score` - Điểm chất lượng (0-100)
- `row_count` - Số dòng
- `column_count` - Số cột

---

## 🔄 Workflow

### **Upload → Process → Preview → Clean → Train**

```
1. Upload File (CSV/Excel/JSON)
   ↓
2. Auto-trigger processing
   - Parse file
   - Analyze columns
   - Calculate quality score
   - Save statistics
   ↓
3. User previews data
   - View sample rows
   - Check schema
   - Review warnings
   ↓
4. User cleans data (optional)
   - Remove nulls/duplicates
   - Fill missing values
   - Create new version
   ↓
5. Use in ML Training
   - Only cleaned datasets
   - High quality data
```

---

## 📊 Quality Score Calculation

Quality Score = 100 - (penalties)

**Penalties:**
- Null percentage × 0.5
- Duplicate percentage × 0.8
- Mixed-type columns × 0.3

**Ratings:**
- 80-100: Excellent ✅
- 60-79: Good ⚠️
- 0-59: Needs Cleaning ❌

---

## 🚀 Cách sử dụng

### 1. Upload dataset

```bash
# Vào trang upload
/dashboard/data/upload

# Upload file CSV/Excel/JSON
# Hệ thống sẽ TỰ ĐỘNG xử lý trong background
```

### 2. Xem và quản lý datasets

```bash
# Vào data management dashboard
/dashboard/data/manage

# Xem danh sách tất cả datasets với:
- Processing status
- Quality score
- Row × Column count
- File size
```

### 3. Preview dataset

```bash
# Click "Preview" hoặc vào:
/data/preview/[dataset-id]

# Xem:
- 100 dòng đầu tiên
- Column schema
- Statistics chi tiết
- Warnings và errors
```

### 4. Clean dataset

```bash
# Click "Clean & Edit" hoặc vào:
/data/edit/[dataset-id]

# Chọn options:
✓ Remove nulls
✓ Remove duplicates
✓ Fill nulls with value
✓ Create new version (recommended)

# Xem ước tính improvement
# Click "Clean Dataset"
```

### 5. Sử dụng trong ML Training

```bash
# Chỉ datasets với:
- status = "PROCESSED" hoặc "CLEANED"
- quality_score >= 60

# Được recommend cho training
```

---

## 🔧 API Endpoints

### 1. **Preview Dataset**

```
GET /api/data/preview/[id]?limit=100
```

Response:
```json
{
  "success": true,
  "dataset": {
    "id": 123,
    "filename": "data.csv",
    "qualityScore": 85.5
  },
  "preview": {
    "data": [...],  // First 100 rows
    "stats": {
      "totalRows": 5000,
      "totalColumns": 15,
      "qualityScore": 85.5,
      "warnings": [...]
    }
  }
}
```

### 2. **Get Statistics**

```
GET /api/data/stats/[id]
```

### 3. **Clean Dataset**

```
POST /api/data/clean/[id]
Body: {
  "removeNulls": true,
  "removeDuplicates": true,
  "fillNulls": false,
  "createVersion": true
}
```

### 4. **Auto-Process**

```
POST /api/data/process
Body: {
  "datasetId": 123
}
```

### 5. **List Datasets**

```
GET /api/data/list
```

---

## 🎯 Next Steps (Q2 2025)

### Phase 2: Advanced Data Intelligence

1. **AI-Powered Data Profiling**
   - Tự động gợi ý data types
   - Phát hiện outliers
   - Recommend transformations

2. **Data Lineage Tracking**
   - Track data flow: upload → clean → train → model
   - Audit trail cho compliance
   - Impact analysis

3. **Advanced Cleaning**
   - Outlier detection & removal
   - Feature engineering suggestions
   - Data normalization

4. **Collaboration Features**
   - Comments trên datasets
   - Share và permission management
   - Approval workflow

5. **Integration với ML Pipeline**
   - Auto-select best datasets
   - Feature store integration
   - Training data versioning

---

## 📈 Metrics Dashboard

Access: `/dashboard/data/manage`

**Key Metrics:**
- Total Datasets
- Processed Count
- Average Quality Score
- Total Storage Used

**Filters:**
- Search by name/description
- Filter by status
- Sort by quality/size/date

---

## 🔒 Security & Permissions

- ✅ Authentication required
- ✅ User-level isolation (uploaded_by)
- ✅ Processing logs with user tracking
- ✅ Audit trail trong `data_processing_logs`

---

## 🧪 Testing

### Manual Testing:

1. Upload CSV file → Check auto-processing
2. View preview → Verify statistics
3. Clean dataset → Check quality improvement
4. Check versions → Verify version control

### Automated Testing:

```bash
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space
yarn test
```

---

## 📝 Migration

**Run database migration:**

```bash
# Apply schema changes
psql $DATABASE_URL -f ../sql_migrations/006_data_processing_pipeline.sql
```

Or it will auto-run on first API call.

---

## 💡 Best Practices

1. **Always create versions** when cleaning data
2. **Review warnings** before using in training
3. **Aim for quality score ≥ 80** for production
4. **Document changes** in version descriptions
5. **Use preview** before processing large files

---

## 🐛 Troubleshooting

### Issue: Processing stuck at "PROCESSING"

**Solution:**
- Check background worker logs
- Re-trigger: `POST /api/data/process` với datasetId

### Issue: Low quality score

**Solution:**
- View preview để xem warnings
- Use "Clean & Edit" để improve
- Remove duplicates và nulls

### Issue: Preview không load

**Solution:**
- Check file format (CSV, Excel, JSON)
- Check file size < 500MB
- Check logs trong `data_processing_logs`

---

## 📚 References

- [Data Processing Logic](/lib/data-processor.ts)
- [API Routes](/app/api/data/)
- [UI Components](/app/data/)
- [Database Schema](/sql_migrations/006_data_processing_pipeline.sql)

---

## ✅ Status: **Completed & Ready for Use**

**Phase 1.5 (Data Pipeline Intelligence)** - ✅ HOÀN THÀNH

**Next:** Phase 2 (Advanced Data Intelligence) - Q2 2025

---

**Người phát triển:** DeepAgent AI Assistant
**Ngày hoàn thành:** 05/10/2025
**Version:** 1.5.0
**Hệ thống:** BigDataAI_HVHC - Học viện Hậu cần

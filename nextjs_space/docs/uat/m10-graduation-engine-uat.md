# UAT: M10 Graduation Rule Engine
**Module**: M10 – UC-60 Xét tốt nghiệp  
**API**: `POST /api/education/graduation/audit`  
**Engine**: `runGraduationEngine(hocVienId)`  
**Date**: 2026-04-08

---

## Engine Logic (Source of Truth)

| Điều kiện | Rule |
|---|---|
| Tín chỉ | `tinChiTichLuy >= programVersion.totalCredits` (default 120) |
| GPA | `diemTrungBinh >= 5.0` (thang 10) — hằng số `MIN_GPA_FOR_GRADUATION` |
| Rèn luyện | `StudentConductRecord.conductScore >= 50` (kỳ gần nhất) |
| Khóa luận | Không có thesis → đạt; Có thesis → phải là `DEFENDED` |
| Ngoại ngữ | Luôn `true` (placeholder, chờ tích hợp M02) |

`graduationEligible = true` khi **tất cả 4 điều kiện** trên đều đạt.

---

## Test Cases

### TC-01: Đủ tất cả điều kiện → ELIGIBLE

**Tiền đề**:
- `tinChiTichLuy = 130`, `requiredCredits = 120`
- `diemTrungBinh = 8.5`
- `StudentConductRecord.conductScore = 85` (kỳ gần nhất)
- `ThesisProject.status = 'DEFENDED'`

**Gọi**: `POST /api/education/graduation/audit` với `hocVienId` của học viên trên

**Kết quả kỳ vọng**:
```json
{
  "success": true,
  "data": {
    "graduationEligible": true,
    "status": "ELIGIBLE",
    "conductEligible": true,
    "thesisEligible": true,
    "languageEligible": true,
    "failureReasonsJson": null
  }
}
```

**Verify DB**: `graduation_audits` có record mới với `"graduationEligible" = true`

---

### TC-02: Thiếu tín chỉ → INELIGIBLE

**Tiền đề**:
- `tinChiTichLuy = 100`, `requiredCredits = 130`
- GPA, rèn luyện, khóa luận đều đạt

**Kết quả kỳ vọng**:
```json
{
  "graduationEligible": false,
  "status": "INELIGIBLE",
  "failureReasonsJson": [
    {
      "code": "INSUFFICIENT_CREDITS",
      "message": "Tín chỉ tích lũy 100 < yêu cầu 130"
    }
  ]
}
```

---

### TC-03: GPA dưới ngưỡng → INELIGIBLE

**Tiền đề**:
- `tinChiTichLuy = 130` (đủ)
- `diemTrungBinh = 1.8` (< 2.0)
- Rèn luyện và khóa luận đạt

**Kết quả kỳ vọng**:
```json
{
  "graduationEligible": false,
  "status": "INELIGIBLE",
  "failureReasonsJson": [
    {
      "code": "LOW_GPA",
      "message": "GPA 1.80 < 2.0"
    }
  ]
}
```

---

### TC-04: Điểm rèn luyện không đạt → INELIGIBLE

**Tiền đề**:
- Tín chỉ và GPA đạt
- `StudentConductRecord.conductScore = 40` (< 50)
- Khóa luận DEFENDED

**Kết quả kỳ vọng**:
```json
{
  "graduationEligible": false,
  "status": "INELIGIBLE",
  "failureReasonsJson": [
    {
      "code": "CONDUCT_INELIGIBLE",
      "message": "Điểm rèn luyện chưa đạt (< 50)"
    }
  ]
}
```

---

### TC-05: Không có StudentConductRecord → INELIGIBLE

**Tiền đề**:
- Học viên không có bản ghi `StudentConductRecord` nào
- Tín chỉ, GPA đạt; khóa luận DEFENDED

**Kết quả kỳ vọng**:
```json
{
  "conductEligible": false,
  "graduationEligible": false,
  "failureReasonsJson": [
    {
      "code": "CONDUCT_INELIGIBLE",
      "message": "Điểm rèn luyện chưa đạt (< 50)"
    }
  ]
}
```

**Lý do**: Engine trả `false` nếu không tìm thấy conduct record (`lastConduct` = null).

---

### TC-06: Khóa luận chưa bảo vệ (IN_PROGRESS) → INELIGIBLE

**Tiền đề**:
- Tín chỉ, GPA, rèn luyện đều đạt
- `ThesisProject.status = 'IN_PROGRESS'`

**Kết quả kỳ vọng**:
```json
{
  "thesisEligible": false,
  "graduationEligible": false,
  "failureReasonsJson": [
    {
      "code": "THESIS_NOT_DEFENDED",
      "message": "Khóa luận / luận văn chưa bảo vệ"
    }
  ]
}
```

---

### TC-07: Không có ThesisProject → thesisEligible = true

**Tiền đề**:
- Tín chỉ, GPA, rèn luyện đều đạt
- Học viên **không có** bản ghi `ThesisProject`

**Kết quả kỳ vọng**:
```json
{
  "thesisEligible": true,
  "graduationEligible": true
}
```

**Lý do**: Rule `!thesis || thesis.status === 'DEFENDED'` → khi không có thesis, thesisEligible = true.

---

### TC-08: Nhiều điều kiện thất bại cùng lúc → tất cả reasons trả về

**Tiền đề**:
- `tinChiTichLuy = 80` (thiếu)
- `diemTrungBinh = 1.5` (< 2.0)
- `conductScore = 30` (< 50)
- `ThesisProject.status = 'DRAFT'`

**Kết quả kỳ vọng**:
```json
{
  "graduationEligible": false,
  "failureReasonsJson": [
    { "code": "INSUFFICIENT_CREDITS", "message": "..." },
    { "code": "LOW_GPA", "message": "..." },
    { "code": "CONDUCT_INELIGIBLE", "message": "..." },
    { "code": "THESIS_NOT_DEFENDED", "message": "..." }
  ]
}
```

**Verify**: `failureReasonsJson` có **4 phần tử**.

---

### TC-09: Học viên không tồn tại → 404

**Request**: `POST /api/education/graduation/audit` với `hocVienId = "nonexistent-id"`

**Kết quả kỳ vọng**:
```json
{ "success": false, "error": "Không tìm thấy học viên" }
```
HTTP status: `404`

---

### TC-10: Thiếu hocVienId trong body → 400

**Request**: `POST /api/education/graduation/audit` với body `{}`

**Kết quả kỳ vọng**:
```json
{ "success": false, "error": "hocVienId là bắt buộc" }
```
HTTP status: `400`

---

### TC-11: Không có quyền RUN_GRADUATION → 403

**Request**: Gọi API với user không có function code `RUN_GRADUATION`

**Kết quả kỳ vọng**: HTTP `403 Forbidden`

---

### TC-12: Audit log được ghi sau mỗi lần chạy engine

**Tiền đề**: Gọi `POST /api/education/graduation/audit` thành công

**Verify DB**:
```sql
SELECT * FROM audit_logs 
WHERE "resourceType" = 'GRADUATION_AUDIT' 
  AND "functionCode" = 'RUN_GRADUATION'
ORDER BY "createdAt" DESC LIMIT 1;
```

**Kết quả kỳ vọng**: Có bản ghi với `result = 'SUCCESS'`, `newValue` chứa `hocVienId` và `graduationEligible`.

---

### TC-13: DiplomaRecord được tạo khi ELIGIBLE (chỉ qua seed, không tự động qua engine)

**Ghi chú quan trọng**: Route `POST /api/education/graduation/audit` **không tự tạo DiplomaRecord**. DiplomaRecord được tạo thủ công hoặc qua batch process riêng. Đây là behavior đúng — tránh auto-issue văn bằng khi chưa được APPROVED.

**Verify**: `graduation_audits.status = 'ELIGIBLE'` ≠ `graduation_audits.status = 'APPROVED'`. Văn bằng chỉ nên cấp khi đã APPROVED.

---

## Demo Data Hiện Có (có thể dùng cho UAT)

```sql
-- Học viên ELIGIBLE (đủ điều kiện)
SELECT hv."maHocVien", hv."hoTen", ga.gpa, ga."totalCreditsEarned", ga.status
FROM graduation_audits ga
JOIN hoc_vien hv ON hv.id = ga."hocVienId"
WHERE ga."graduationEligible" = true
ORDER BY ga.gpa DESC LIMIT 5;

-- Học viên INELIGIBLE (không đủ)
SELECT hv."maHocVien", ga."failureReasonsJson"
FROM graduation_audits ga
JOIN hoc_vien hv ON hv.id = ga."hocVienId"
WHERE ga."graduationEligible" = false LIMIT 5;
```

---

## Trạng thái hiện tại

| Item | Tổng |
|---|---|
| GraduationAudit records | 15 |
| ELIGIBLE | ~7 |
| INELIGIBLE | ~8 |
| DiplomaRecord | 7 |
| ThesisProject (DEFENDED) | 15 |
| ThesisProject (IN_PROGRESS) | 15 |
| ThesisProject (DRAFT) | 10 |

---

## Điểm rủi ro production cần lưu ý

1. **GPA threshold**: Engine dùng ngưỡng `2.0` (thang 10) — rất thấp. Cần confirm với BGH trước khi go-live. Seed demo dùng ngưỡng `5.0`.
2. **conductEligible**: Nếu học viên chưa nhập điểm rèn luyện → tự động `false`. Cần pre-check trước khi chạy batch.
3. **languageEligible**: Luôn `true` — placeholder. Cần integrate M02 ForeignLanguageCert trước khi đưa production.
4. **requiredCredits fallback**: Dùng `tongTinChi` nếu không có `currentProgramVersion`, default `120`. Cần đảm bảo học viên đã gán `currentProgramVersionId`.
5. **Không auto-create DiplomaRecord**: Phải APPROVED riêng — đây là safeguard đúng.

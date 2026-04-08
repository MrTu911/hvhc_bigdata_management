---
description: Review code theo kiến trúc, nghiệp vụ, dữ liệu, API, UI, bảo mật và khả năng production
---

# Review Code

## Mục tiêu
Review code một cách có hệ thống, chỉ ra lỗi nghiêm trọng, lệch kiến trúc, rủi ro production và thứ tự sửa.

## Checklist review

### 1. Đúng thiết kế chưa
- Có bám use case không
- Có bỏ sót lifecycle hoặc rule quan trọng không

### 2. Đúng kiến trúc chưa
- Route có mỏng không
- Service có đúng trách nhiệm không
- Repository có chỉ data access không
- UI có nhồi business logic không

### 3. Đúng dữ liệu chưa
- Model có đúng không
- Relation/index có ổn không
- Có model trùng hoặc field thừa không

### 4. Đúng bảo mật chưa
- Có check quyền không
- Có scope filter không
- Có lộ dữ liệu nhạy cảm không
- Có audit nơi cần thiết không

### 5. Đúng production chưa
- Có validation không
- Có logging/error handling không
- Có migration risk không
- Có performance risk không

## Output bắt buộc
1. Lỗi nghiêm trọng
2. Lỗi kiến trúc
3. Lỗi dữ liệu
4. Rủi ro bảo mật
5. Rủi ro production
6. Thứ tự sửa tối ưu
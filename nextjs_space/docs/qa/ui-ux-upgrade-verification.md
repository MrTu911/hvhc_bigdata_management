# Kiểm tra & nghiệm thu sau nâng cấp UI/UX

Tài liệu nghiệm thu cho đợt nâng cấp UI/UX (ModuleHero + theme tokens + i18n vi/en +
settings tabs + ForcePasswordChangeGuard). Gồm 2 phần: **độ phủ tự động** (đã chạy)
và **checklist thủ công** cho các luồng tương tác không thể tự động hoàn toàn.

---

## 1. Độ phủ tự động (chạy lại bất cứ lúc nào)

| Cổng | Lệnh | Phủ |
| --- | --- | --- |
| Type-check | `npx tsc --noEmit` | Toàn bộ 301 trang + lib + api (prop ModuleHero, moduleId, import) |
| Unit/contract | `npm test` | i18n completeness, MODULE_TOKENS, useActiveModule + 15 suite nghiệp vụ |
| Smoke runtime | `SMOKE_BASE_URL=http://localhost:3000 npm run smoke` | Mọi trang dashboard + API GET trả 2xx/không 5xx |

**Test regression mới (Phase 2):**
- `lib/i18n/__tests__/i18n-completeness.test.ts` — vi≡en, mọi key menu + role enum có đủ.
- `lib/constants/__tests__/module-tokens.test.ts` — mọi ModuleId resolve token đầy đủ.
- `hooks/__tests__/use-active-module.test.ts` — ánh xạ pathname→module đúng.

**Smoke harness:** `scripts/smoke/auth.ts` (login NextAuth) + `scripts/smoke/route-health.ts`.
Lưu ý độ phủ: route động `[id]` của **trang** được đánh dấu `SKIPPED_NO_ID` (chỉ resolve
id cho API). Chạy bổ sung với DB đã seed để tăng độ phủ id động.

---

## 2. Checklist thủ công (chạy trên trình duyệt, dev server + admin demo)

Tài khoản: `admin@hvhc.edu.vn` / `Hv@2025`. Mỗi mục: tiền đề → thao tác → kỳ vọng.

### 2.1. Force-password-change guard  *(rủi ro cao — chặn dashboard nếu lỗi)*
- [ ] Tài khoản `mustChangePassword=true` → vào trang dashboard bất kỳ ⇒ redirect tới
      `/dashboard/settings/security?forceChange=1`, KHÔNG lặp vô hạn.
- [ ] Đang ở chính trang đổi mật khẩu ⇒ không bị redirect tiếp.
- [ ] Tài khoản bình thường (`false`) ⇒ chỉ 1 lần gọi `/api/auth/me`, sau đó không gọi lại
      khi điều hướng (kiểm tra Network tab).
- [ ] Sau khi đổi mật khẩu xong ⇒ cờ về `false`, không còn redirect.

### 2.2. Đổi mật khẩu (Settings → Bảo mật)
- [ ] Đúng current + new (≥8, ≠ current) + confirm khớp ⇒ toast thành công, đăng nhập lại được bằng mật khẩu mới.
- [ ] Confirm lệch ⇒ chặn ở client (`settings.security.passwordMismatch`).
- [ ] New < 8 ký tự ⇒ lỗi 400.
- [ ] Sai current ⇒ lỗi 400, không đổi.

### 2.3. MFA (Settings → Bảo mật)
- [ ] Bật: quét QR / nhập secret vào Authenticator → nhập OTP 6 số ⇒ bật thành công, status `Đã bật`.
- [ ] Đăng nhập lần sau ⇒ yêu cầu OTP (thiếu OTP ⇒ MFA_REQUIRED).
- [ ] Tắt bằng OTP hợp lệ ⇒ status `Chưa bật`, có ghi audit; OTP sai ⇒ 401.

### 2.4. Phiên đăng nhập (Settings → Bảo mật)
- [ ] Đăng nhập từ 2 trình duyệt ⇒ danh sách hiện cả 2 (đánh dấu phiên hiện tại).
- [ ] Thu hồi phiên khác ⇒ phiên đó biến mất; phiên không sở hữu ⇒ 403; id lạ ⇒ 404.

### 2.5. Đổi ngôn ngữ (Settings → Giao diện)
- [ ] Chọn English ⇒ nhãn đổi ngay, `localStorage['language']='en'`, giữ qua reload.
- [ ] Quan trọng: ở English KHÔNG còn nhãn sidebar dạng raw key (đã sửa 7 key `nav.*`
      thiếu en + 6 key `role.*`). Kiểm tra nhóm "Hạ tầng & Dữ liệu" và "Quản trị Hệ thống".

### 2.6. Dark mode (Settings → Giao diện)
- [ ] Chọn Dark ⇒ `<html class="dark">`, `localStorage['theme']='dark'`, giữ qua reload.
- [ ] System ⇒ theo `prefers-color-scheme` của OS.
- [ ] ModuleHero + thẻ settings hiển thị đúng ở dark (không mất chữ/nền).

### 2.7. ModuleHero theming (đi nhanh qua các module)
- [ ] Mỗi module có màu hero đúng token (Nhân sự=xanh dương, Đảng=đỏ, Giáo dục=indigo,
      NCKH=tím, Chính sách/Thi đua=teal, Bảo hiểm=emerald, Khoa học=tím-hồng, Quản trị=slate).
- [ ] Trang con chưa migrate (≈293 trang) vẫn hoạt động, không vỡ layout (chấp nhận khác phong cách).

---

## 3. Vấn đề tồn đọng (ngoài phạm vi nâng cấp UI/UX)

- **Build production đang bị chặn** bởi ~228 lỗi type **có sẵn từ trước** (không do đợt UI/UX),
  chủ yếu ở `lib/services`, `app/api`, `prisma/seed`, và type `Formatter` của recharts ở 3 file chart.
  `next.config.js` đặt `typescript.ignoreBuildErrors: false` nên `npm run build` sẽ fail ở bước type-check.
  → Cần một đợt dọn nợ kỹ thuật riêng (quyết định phạm vi với chủ dự án).

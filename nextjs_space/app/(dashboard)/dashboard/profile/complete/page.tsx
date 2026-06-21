/**
 * DEPRECATED — wizard "hoàn thiện hồ sơ" đã được thay bằng vòng đời khai báo trên trang canonical.
 *
 * Trạng thái "đang khai báo" (DeclarationBanner) ở /dashboard/profile đã đảm nhận việc nhắc
 * hoàn thiện hồ sơ. Giữ route mỏng để không vỡ link/bookmark cũ.
 */
import { permanentRedirect } from 'next/navigation';

export default function ProfileCompleteRedirectPage() {
  permanentRedirect('/dashboard/profile');
}

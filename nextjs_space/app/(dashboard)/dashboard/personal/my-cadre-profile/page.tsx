/**
 * DEPRECATED — đã hợp nhất vào trang hồ sơ điện tử canonical.
 *
 * Hồ sơ cán bộ điện tử 99 trường giờ là tab "HSCB 99 trường" trong /dashboard/profile
 * (cùng vòng đời khai báo + minh chứng). Giữ route mỏng để không vỡ link/bookmark cũ.
 */
import { permanentRedirect } from 'next/navigation';

export default function MyCadreProfileRedirectPage() {
  permanentRedirect('/dashboard/profile?tab=cadre');
}

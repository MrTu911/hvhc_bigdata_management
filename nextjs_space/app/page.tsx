import HeroSection from '@/components/homepage/hero-section';
import StatsSection from '@/components/homepage/stats-section';
import ModulesSection from '@/components/homepage/modules-section';
import FeaturesSection from '@/components/homepage/features-section';
import AICapabilitiesSection from '@/components/homepage/ai-capabilities-section';
import SecuritySection from '@/components/homepage/security-section';
import ArchitectureSection from '@/components/homepage/architecture-section';
import CTASection from '@/components/homepage/cta-section';
import Footer from '@/components/homepage/footer';
import Header from '@/components/homepage/header';

// Bắt buộc render động mỗi request.
// Lý do: Header đọc session (qua getServerSession ở root layout → SessionProvider) để hiển thị
// đúng nút "Đăng nhập" (chưa login) hoặc "Vào hệ thống" (đã login). Nếu để Next static-prerender
// trang chủ, session bị "đóng băng" = null lúc build → user đã đăng nhập vẫn thấy nút "Đăng nhập"
// và bị đẩy về form login. force-dynamic đảm bảo session luôn đọc theo cookie thực của request.
export const dynamic = 'force-dynamic';

// Server component: nội dung trang chủ là marketing tĩnh, nhưng trạng thái auth ở Header phụ thuộc session.
// Để SSR render ngay HTML, không gate bằng `mounted`/`useSession` (gây màn hình trắng + phải refresh).
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />
      <main>
        {/* Hero: Giới thiệu chính */}
        <HeroSection />

        {/* Stats: Thống kê ấn tượng với animation counter */}
        <StatsSection />

        {/* Modules: 8 CSDL chính */}
        <ModulesSection />

        {/* Features: Nền tảng BigData 6 lớp */}
        <FeaturesSection />

        {/* AI: 4 Engine AI/ML */}
        <AICapabilitiesSection />

        {/* Security: RBAC Function-based */}
        <SecuritySection />

        {/* Architecture: Kiến trúc 4 tầng */}
        <ArchitectureSection />

        {/* CTA: Call to Action */}
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

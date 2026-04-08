'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Cell,
} from 'recharts';
import {
  FileText, Download, CheckCircle, FolderOpen, Shield, Database,
  Users, Loader2, Eye, Printer, Search, Layers, HardDrive,
  FlaskConical, Gavel, ChevronRight, Star, BarChart3, FileCheck,
  CalendarCheck, Info, Package, Server, BookOpen, Lock, RefreshCw,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────
interface DocItem {
  id: string;
  name: string;
  status: 'ready' | 'pending';
  type: string;
  pages: string;
  purpose: string;
  content: string;
}

interface DocCategory {
  id: string;
  name: string;
  shortName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  pillClass: string;
  barColor: string;
  description: string;
  documents: DocItem[];
}

interface LiveStats {
  party: { total: number; chinhThuc: number; duBi: number; quanChung: number; camTinh: number; doiTuong: number };
  faculty: number;
  students: number;
  auditLogs: number;
  policies: number;
  research: number;
  users: number;
  units: number;
}

// ─────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────
const TOOLTIP_STYLE = {
  background: 'white', border: '1px solid #e2e8f0',
  borderRadius: '8px', fontSize: '11px', padding: '6px 10px',
};

const DOCUMENT_CATEGORIES: DocCategory[] = [
  {
    id: 'E1', name: 'Hồ sơ Pháp lý - Quản lý', shortName: 'Pháp lý',
    icon: Gavel,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-800',
    pillClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    barColor: '#3b82f6',
    description: 'Văn bản pháp lý, quyết định phê duyệt và biên bản triển khai dự án',
    documents: [
      { id: 'E1.1', name: 'Quyết định phê duyệt chủ trương đầu tư', status: 'ready', type: 'QĐ', pages: '3–5 trang',
        purpose: 'Xác lập cơ sở pháp lý chính thức cho toàn bộ dự án đầu tư CNTT',
        content: 'Căn cứ NQ 3488-NQ/QUTW; Phạm vi 17 module; Ngân sách 2,13 tỷ; Tiến độ 2026–2028' },
      { id: 'E1.2', name: 'Quyết định thành lập Tổ triển khai', status: 'ready', type: 'QĐ', pages: '2–3 trang',
        purpose: 'Thành lập Tổ công tác chịu trách nhiệm triển khai và nghiệm thu hệ thống',
        content: 'Danh sách 8–10 thành viên; Phân công nhiệm vụ; Quyền hạn và trách nhiệm pháp lý' },
      { id: 'E1.3', name: 'Kế hoạch triển khai CNTT (đã duyệt)', status: 'ready', type: 'KH', pages: '8–10 trang',
        purpose: 'Xác định lộ trình, phân công và tiến độ theo 3 giai đoạn chiến lược',
        content: 'GĐ 1: Core & Pilot 2026 (~600 tr); GĐ 2: Toàn diện; GĐ 3: Nhân rộng 2028+' },
      { id: 'E1.4', name: 'Biên bản họp triển khai', status: 'ready', type: 'BB', pages: '4–6 trang',
        purpose: 'Ghi nhận các quyết nghị và phân công trong quá trình họp bàn triển khai',
        content: 'Danh sách tham dự; Nội dung thảo luận; Kết luận & phân công; Chữ ký các bên' },
    ],
  },
  {
    id: 'E2', name: 'Hồ sơ Kiến trúc & Thiết kế', shortName: 'Kiến trúc',
    icon: Layers,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-200 dark:border-purple-800',
    pillClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    barColor: '#a855f7',
    description: 'Tài liệu kiến trúc 4 lớp, sơ đồ hệ thống và luồng dữ liệu tổng thể',
    documents: [
      { id: 'E2.1', name: 'Thuyết minh kiến trúc tổng thể', status: 'ready', type: 'TM', pages: '12–15 trang',
        purpose: 'Mô tả toàn diện kiến trúc 4 lớp và 17 module của hệ thống HVHC BigData',
        content: 'Kiến trúc: Thu thập → Lưu trữ → Xử lý → Phục vụ; Stack: Next.js 14 + Prisma + PG; 305 APIs' },
      { id: 'E2.2', name: 'Sơ đồ kiến trúc BEFORE / AFTER', status: 'ready', type: 'SD', pages: '2 trang',
        purpose: 'So sánh trạng thái trước và sau để minh chứng hiệu quả chuyển đổi số',
        content: 'BEFORE: 17 kho Excel/Word rời rạc; AFTER: Data Lake tập trung, tra cứu < 5 giây' },
      { id: 'E2.3', name: 'Sơ đồ phân lớp: Frontend / Backend / Database', status: 'ready', type: 'SD', pages: '1 trang',
        purpose: 'Mô tả rõ trách nhiệm từng lớp trong kiến trúc 3-tier',
        content: 'Frontend: Next.js 14 App Router; Backend: API Routes + Service + Repo; DB: PostgreSQL + MinIO + Redis' },
      { id: 'E2.4', name: 'Sơ đồ luồng dữ liệu chính (DFD)', status: 'ready', type: 'SD', pages: '3–4 trang',
        purpose: 'Mô tả luồng dữ liệu trong các use case chính của hệ thống',
        content: 'Luồng hồ sơ 360°; Luồng phê duyệt workflow; Luồng export báo cáo; Luồng AI Lab' },
    ],
  },
  {
    id: 'E3', name: 'Hồ sơ Dữ liệu & CSDL', shortName: 'Dữ liệu',
    icon: Database,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/40',
    borderColor: 'border-green-200 dark:border-green-800',
    pillClass: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    barColor: '#22c55e',
    description: 'Danh mục CSDL, data dictionary, mô hình ERD và cơ chế liên thông dữ liệu',
    documents: [
      { id: 'E3.1', name: 'Danh mục các CSDL trong hệ thống', status: 'ready', type: 'DM', pages: '3–4 trang',
        purpose: 'Liệt kê đầy đủ 17 CSDL nghiệp vụ và các bảng dữ liệu trong từng module',
        content: '17 module; ~80 bảng; Phân loại: Core / Nghiệp vụ / Master Data; PostgreSQL + MinIO' },
      { id: 'E3.2', name: 'Data Dictionary (các trường dữ liệu chính)', status: 'ready', type: 'DD', pages: '15–20 trang',
        purpose: 'Định nghĩa chuẩn tên trường, kiểu dữ liệu và ràng buộc nghiệp vụ',
        content: 'Tên trường; Kiểu dữ liệu; Ý nghĩa nghiệp vụ; Enum values; Quan hệ giữa các model' },
      { id: 'E3.3', name: 'Mô hình ERD theo miền nghiệp vụ', status: 'ready', type: 'ERD', pages: '5–7 trang',
        purpose: 'Mô tả quan hệ thực thể theo từng miền nghiệp vụ chính',
        content: 'ERD: Đào tạo-Học viên; ERD: Cán bộ 360°; ERD: NCKH; ERD: Đảng viên; ERD: Chính sách' },
      { id: 'E3.4', name: 'Cơ chế liên thông dữ liệu', status: 'ready', type: 'TM', pages: '4–5 trang',
        purpose: 'Mô tả M02 làm nguồn dữ liệu gốc (single source of truth) cho 16 module còn lại',
        content: 'Internal API giữa module; Cache strategy Redis; Data consistency; 360° profile aggregation' },
    ],
  },
  {
    id: 'E4', name: 'Hồ sơ Phân quyền & RBAC', shortName: 'RBAC',
    icon: Users,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/40',
    borderColor: 'border-orange-200 dark:border-orange-800',
    pillClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    barColor: '#f97316',
    description: 'Mô hình RBAC 4 cấp độ, danh mục function code và chính sách phân quyền',
    documents: [
      { id: 'E4.1', name: 'Mô hình RBAC Function-based', status: 'ready', type: 'TM', pages: '6–8 trang',
        purpose: 'Mô tả mô hình phân quyền động dựa trên 88+ mã chức năng kết hợp kiểm soát phạm vi',
        content: 'Function-based (vs Role-based cứng); Scope: SELF/UNIT/DEPARTMENT/ACADEMY; MFA/OTP; Audit Trail' },
      { id: 'E4.2', name: 'Danh mục 71 Function code', status: 'ready', type: 'DM', pages: '8–10 trang',
        purpose: 'Danh sách đầy đủ các mã chức năng, mô tả quyền và module áp dụng',
        content: 'Mã chức năng; Tên quyền; Module; Scope cho phép; Điều kiện đặc biệt (MFA, senior)' },
      { id: 'E4.3', name: 'Chính sách phân quyền (Policy)', status: 'ready', type: 'CS', pages: '4–5 trang',
        purpose: 'Quy định quy trình cấp phát, thu hồi và kiểm tra quyền truy cập',
        content: 'Quy trình cấp quyền; Điều kiện theo chức vụ; Kế thừa quyền; Thời hạn hiệu lực' },
      { id: 'E4.4', name: 'Sơ đồ Scope (self / unit / academy)', status: 'ready', type: 'SD', pages: '2 trang',
        purpose: 'Minh họa trực quan 4 cấp độ phạm vi dữ liệu của hệ thống RBAC',
        content: 'SELF → UNIT → DEPARTMENT → ACADEMY; Ví dụ theo chức danh; Use case thực tế' },
    ],
  },
  {
    id: 'E5', name: 'Hồ sơ An toàn Thông tin', shortName: 'ATTT',
    icon: Shield,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/40',
    borderColor: 'border-red-200 dark:border-red-800',
    pillClass: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    barColor: '#ef4444',
    description: 'Quy chế bảo đảm ATTT, ma trận rủi ro CNTT và kế hoạch ứng cứu sự cố',
    documents: [
      { id: 'E5.1', name: 'Quy chế quản lý, khai thác & bảo đảm ATTT', status: 'ready', type: 'QC', pages: '10–12 trang',
        purpose: 'Quy định toàn diện về quản lý, vận hành và bảo đảm an toàn thông tin',
        content: 'Trách nhiệm các cấp; Chính sách mật khẩu; Kiểm soát truy cập; Giám sát an ninh mạng' },
      { id: 'E5.2', name: 'Ma trận rủi ro CNTT & ATTT', status: 'ready', type: 'MT', pages: '4–6 trang',
        purpose: 'Nhận diện, đánh giá và xếp hạng các rủi ro CNTT theo xác suất và mức độ ảnh hưởng',
        content: '15–20 rủi ro; Mức độ: Thấp / Trung bình / Cao / Nghiêm trọng; Biện pháp giảm thiểu' },
      { id: 'E5.3', name: 'Kế hoạch ứng cứu sự cố ATTT', status: 'ready', type: 'KH', pages: '6–8 trang',
        purpose: 'Quy trình ứng cứu khi xảy ra sự cố an ninh, đảm bảo phục hồi trong thời gian tối thiểu',
        content: '5 bước: Phát hiện → Báo cáo → Phân loại → Xử lý → Phục hồi & Rút kinh nghiệm' },
      { id: 'E5.4', name: 'Phân công trách nhiệm ATTT', status: 'ready', type: 'PC', pages: '2–3 trang',
        purpose: 'Xác định rõ trách nhiệm từng cán bộ trong việc duy trì và bảo vệ ATTT',
        content: 'Phụ trách hệ thống; Phụ trách mạng; Phụ trách dữ liệu; Điều phối ứng cứu sự cố' },
    ],
  },
  {
    id: 'E6', name: 'Hồ sơ Audit Log & Security', shortName: 'Audit Log',
    icon: HardDrive,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    pillClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
    barColor: '#06b6d4',
    description: 'Cơ chế ghi nhật ký kiểm toán, danh mục sự kiện an ninh và chính sách lưu trữ',
    documents: [
      { id: 'E6.1', name: 'Mô tả cơ chế ghi Audit Log', status: 'ready', type: 'TM', pages: '4–5 trang',
        purpose: 'Mô tả cách hệ thống ghi nhận mọi hành vi truy cập và thao tác dữ liệu nhạy cảm',
        content: 'Các sự kiện được log; Cấu trúc log entry; Integrity protection; Export audit report' },
      { id: 'E6.2', name: 'Danh mục sự kiện an ninh (Security Event)', status: 'ready', type: 'DM', pages: '3–4 trang',
        purpose: 'Liệt kê đầy đủ các loại sự kiện an ninh được giám sát trong hệ thống',
        content: 'Login/Logout; MFA failure; Privilege change; Sensitive data access; Export; Modification' },
      { id: 'E6.3', name: 'Mẫu log thực tế (ẩn dữ liệu nhạy cảm)', status: 'ready', type: 'ML', pages: '2–3 trang',
        purpose: 'Minh họa định dạng log thực tế để Hội đồng nghiệm thu kiểm tra tính đầy đủ',
        content: 'Timestamp; User ID (ẩn); Action; Entity; IP Address (ẩn cuối); Session ID; Result' },
      { id: 'E6.4', name: 'Thời gian lưu trữ log', status: 'ready', type: 'CS', pages: '1–2 trang',
        purpose: 'Quy định thời gian lưu trữ và chính sách archiving cho từng loại log',
        content: 'Security log: 5 năm; Access log: 2 năm; Debug log: 90 ngày; Audit trail: Vĩnh viễn' },
    ],
  },
  {
    id: 'E7', name: 'Hồ sơ Kiểm thử & Vận hành', shortName: 'Kiểm thử',
    icon: FlaskConical,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    pillClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    barColor: '#6366f1',
    description: 'Kế hoạch kiểm thử, biên bản kiểm thử chức năng/phân quyền và SOP vận hành',
    documents: [
      { id: 'E7.1', name: 'Kế hoạch kiểm thử hệ thống', status: 'ready', type: 'KH', pages: '6–8 trang',
        purpose: 'Xác định phạm vi, phương pháp và tiêu chí chấp nhận kiểm thử toàn hệ thống',
        content: 'KT chức năng; KT phân quyền; KT tải; KT bảo mật; Tiêu chí đạt/không đạt' },
      { id: 'E7.2', name: 'Biên bản kiểm thử chức năng', status: 'ready', type: 'BB', pages: '15–20 trang',
        purpose: 'Ghi nhận kết quả kiểm thử 88 use case của 17 module trong hệ thống',
        content: '88 Test Cases; Kết quả Pass/Fail; Số lỗi phát hiện/sửa; Ký xác nhận Hội đồng KT' },
      { id: 'E7.3', name: 'Biên bản kiểm thử phân quyền', status: 'ready', type: 'BB', pages: '8–10 trang',
        purpose: 'Xác nhận hệ thống RBAC hoạt động đúng theo 4 cấp độ scope đã thiết kế',
        content: 'Test 71 function codes; Test scope isolation; Test MFA enforcement; Kết quả: 100% pass' },
      { id: 'E7.4', name: 'SOP vận hành hệ thống', status: 'ready', type: 'SOP', pages: '10–12 trang',
        purpose: 'Quy trình vận hành chuẩn: khởi động, giám sát, backup và xử lý sự cố thường ngày',
        content: 'Quy trình hàng ngày; Backup tự động; Giám sát uptime; Escalation matrix; Recovery' },
      { id: 'E7.5', name: 'Hướng dẫn sử dụng cho từng đối tượng', status: 'ready', type: 'HD', pages: '20–25 trang',
        purpose: 'Tài liệu hướng dẫn sử dụng chi tiết theo từng nhóm người dùng',
        content: 'HD Quản trị viên; HD Chỉ huy Khoa/Ban; HD Giảng viên; HD Học viên/Sinh viên' },
    ],
  },
];

const ACCEPTANCE_STEPS = [
  { id: 1, label: 'Chuẩn bị hồ sơ',           sub: '28 tài liệu', done: true },
  { id: 2, label: 'Kiểm tra hình thức',         sub: 'Định dạng & font', done: true },
  { id: 3, label: 'Kiểm tra kỹ thuật',          sub: 'Nội dung & API', done: true },
  { id: 4, label: 'Trình ký Ban Giám đốc',       sub: 'Đang chờ ký', done: false },
  { id: 5, label: 'Nghiệm thu & Bàn giao',       sub: 'Kết thúc dự án', done: false },
];

const TYPE_LABEL: Record<string, string> = {
  QĐ: 'Quyết định', KH: 'Kế hoạch', BB: 'Biên bản', TM: 'Thuyết minh',
  SD: 'Sơ đồ', DD: 'Data Dict', DM: 'Danh mục', ERD: 'Mô hình ERD',
  CS: 'Chính sách', QC: 'Quy chế', MT: 'Ma trận', PC: 'Phân công',
  ML: 'Mẫu log', SOP: 'SOP', HD: 'Hướng dẫn',
};

// ─────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────
export default function AcceptanceDocsPage() {
  const [selectedCatId, setSelectedCatId] = useState('E1');
  const [previewDoc, setPreviewDoc]       = useState<DocItem | null>(null);
  const [previewCat, setPreviewCat]       = useState<DocCategory | null>(null);
  const [loading, setLoading]             = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [search, setSearch]               = useState('');
  const [liveStats, setLiveStats]         = useState<LiveStats | null>(null);
  const [statsLoading, setStatsLoading]   = useState(true);

  const fetchLiveStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/acceptance-docs/stats').catch(() => null);
      if (res?.ok) { const d = await res.json(); setLiveStats(d); }
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLiveStats(); }, [fetchLiveStats]);

  // ── Derived stats ──────────────────────────────────
  const totalDocs  = DOCUMENT_CATEGORIES.reduce((a, c) => a + c.documents.length, 0);
  const readyDocs  = DOCUMENT_CATEGORIES.reduce((a, c) => a + c.documents.filter(d => d.status === 'ready').length, 0);
  const progress   = Math.round((readyDocs / totalDocs) * 100);

  const selectedCat = DOCUMENT_CATEGORIES.find(c => c.id === selectedCatId)!;

  const filteredDocs = useMemo(() => {
    if (!search.trim()) return selectedCat.documents;
    const q = search.toLowerCase();
    return selectedCat.documents.filter(d => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
  }, [selectedCat, search]);

  // Chart data: per category completion
  const chartData = useMemo(() => DOCUMENT_CATEGORIES.map(cat => {
    const ready = cat.documents.filter(d => d.status === 'ready').length;
    return {
      name: cat.shortName,
      ready,
      total: cat.documents.length,
      pct: Math.round((ready / cat.documents.length) * 100),
      fill: cat.barColor,
    };
  }), []);

  // ── Live evidence modules ──────────────────────────
  const liveModules = useMemo(() => {
    if (!liveStats) return [];
    return [
      { label: 'Đảng viên', value: liveStats.party.total, sub: `${liveStats.party.chinhThuc} chính thức`, icon: Users, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/40' },
      { label: 'Giảng viên', value: liveStats.faculty, sub: 'Cán bộ quản lý', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/40' },
      { label: 'Học viên', value: liveStats.students, sub: 'Đang theo học', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
      { label: 'Tài khoản', value: liveStats.users, sub: `${liveStats.units} đơn vị`, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/40' },
      { label: 'Audit Log', value: liveStats.auditLogs.toLocaleString(), sub: 'Bản ghi kiểm toán', icon: Lock, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/40' },
      { label: 'Chính sách', value: liveStats.policies, sub: 'Hồ sơ chính sách', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/40' },
      { label: 'Nghiên cứu', value: liveStats.research, sub: 'Đề tài NCKH', icon: Activity, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/40' },
      { label: 'Server', value: '17', sub: 'Module đang chạy', icon: Server, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
    ];
  }, [liveStats]);

  // ── Handlers ──────────────────────────────────────
  const downloadDocument = async (docId: string, docName: string) => {
    setLoading(docId);
    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId }),
      });
      if (!response.ok) throw new Error('Failed');
      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `${docId}_${docName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success(`Đã tải ${docId}: ${docName}`);
    } catch {
      toast.error('Không thể tải tài liệu. Vui lòng thử lại.');
    } finally {
      setLoading(null);
    }
  };

  const downloadCategory = async () => {
    for (const doc of selectedCat.documents) {
      await downloadDocument(doc.id, doc.name);
      await new Promise(r => setTimeout(r, 800));
    }
  };

  const downloadAll = async () => {
    setDownloadingAll(true);
    try {
      for (const cat of DOCUMENT_CATEGORIES) {
        for (const doc of cat.documents) {
          await downloadDocument(doc.id, doc.name);
          await new Promise(r => setTimeout(r, 1200));
        }
      }
      toast.success('Đã tải xong toàn bộ hồ sơ nghiệm thu!');
    } catch {
      toast.error('Có lỗi khi tải hồ sơ');
    } finally {
      setDownloadingAll(false);
    }
  };

  const printPage = () => window.print();

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6 max-w-[1440px] mx-auto">

      {/* ── Hero Banner ──────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-20 top-8  h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-44 w-44 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-0 bottom-0 opacity-[0.04]">
          <FolderOpen className="h-52 w-52" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <FileCheck className="h-4 w-4" />
              </div>
              <span className="text-indigo-200 text-sm font-medium">Quản trị Hệ thống · HVHC BigData v1.0</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Hồ sơ Nghiệm thu CNTT</h1>
            <p className="text-indigo-100 text-sm mt-1">
              28 tài liệu · Chuẩn CQNN/BQP · Times New Roman 14 · Năm 2026
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span className="bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
                {readyDocs}/{totalDocs} sẵn sàng
              </span>
              <span className="bg-emerald-500/30 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-emerald-100">
                {progress}% hoàn thành
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={printPage}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
            >
              <Printer className="h-4 w-4" /> In
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLiveStats()}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              disabled={downloadingAll}
              onClick={downloadAll}
              className="bg-white text-indigo-700 hover:bg-indigo-50 gap-2"
            >
              {downloadingAll
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang tải...</>
                : <><Package className="h-4 w-4" /> Tải toàn bộ PDF</>}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Ready Banner ─────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          {readyDocs}/{totalDocs} tài liệu đã sẵn sàng nghiệm thu
          <span className="ml-2 font-normal text-emerald-600 dark:text-emerald-400">
            · Cập nhật: 01/04/2026
          </span>
        </p>
        <div className="ml-auto">
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0 font-bold">
            {progress}% Hoàn thành
          </Badge>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng tài liệu',  value: totalDocs,   sub: '7 nhóm hồ sơ',        icon: FileText,     color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/40' },
          { label: 'Sẵn sàng',       value: `${readyDocs}/${totalDocs}`, sub: '100% hoàn thiện', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Tiêu chuẩn',     value: 'BQP',       sub: 'Times New Roman 14',   icon: Star,         color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/40' },
          { label: 'Phiên bản',       value: 'v1.0',      sub: 'Xét duyệt 2026',       icon: CalendarCheck, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/40' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${s.bg} flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{s.value}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.sub}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Live System Evidence ─────────────── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              Dữ liệu thực tế từ hệ thống
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0 text-[11px]">
                LIVE
              </Badge>
            </CardTitle>
            <p className="text-xs text-gray-400">Minh chứng hệ thống đang vận hành</p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {statsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {liveModules.map(m => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className={`p-3 rounded-xl ${m.bg} border border-transparent`}>
                    <Icon className={`h-4 w-4 ${m.color} mb-2`} />
                    <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                      {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
                    </p>
                    <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 leading-tight mt-0.5">{m.label}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{m.sub}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Progress + Chart Row ─────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Progress Overview */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" /> Tiến độ hoàn thiện hồ sơ
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2.5 mb-5 [&>div]:bg-indigo-600" />
            <div className="grid grid-cols-7 gap-1.5">
              {DOCUMENT_CATEGORIES.map(cat => {
                const catReady = cat.documents.filter(d => d.status === 'ready').length;
                const catPct   = Math.round((catReady / cat.documents.length) * 100);
                const Icon     = cat.icon;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => { setSelectedCatId(cat.id); setSearch(''); }}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all text-center ${
                      selectedCatId === cat.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${cat.color}`} />
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{cat.id}</span>
                    <span className={`text-[10px] font-semibold ${catPct === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {catPct}%
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-500" /> Tài liệu theo nhóm hồ sơ
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <RechartsTooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value, name, props) => {
                    if (name === 'ready') {
                      const { total, pct } = props.payload;
                      return [`${value}/${total} (${pct}%)`, 'Sẵn sàng'];
                    }
                    return [value, 'Tổng'];
                  }}
                />
                <Bar dataKey="total"  fill="#e2e8f0" radius={[3, 3, 0, 0]} maxBarSize={28} name="total" />
                <Bar dataKey="ready"  radius={[3, 3, 0, 0]} maxBarSize={28} name="ready">
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Split Panel ──────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* Left: Category List */}
        <aside className="lg:w-72 flex-shrink-0 space-y-1">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2 mb-2">
            Nhóm hồ sơ
          </p>
          {DOCUMENT_CATEGORIES.map(cat => {
            const Icon     = cat.icon;
            const catReady = cat.documents.filter(d => d.status === 'ready').length;
            const isActive = selectedCatId === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => { setSelectedCatId(cat.id); setSearch(''); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className={`p-1.5 rounded-lg flex-shrink-0 ${isActive ? 'bg-white/20' : cat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : cat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : ''}`}>
                    {cat.id}. {cat.shortName}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${isActive ? 'text-indigo-100' : 'text-gray-400 dark:text-gray-500'}`}>
                    {cat.documents.length} tài liệu
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                  }`}>
                    {catReady}/{cat.documents.length}
                  </span>
                  <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                </div>
              </button>
            );
          })}
        </aside>

        {/* Right: Document List */}
        <div className="flex-1 min-w-0">
          <Card className="border-0 shadow-sm">
            {/* Category Header */}
            <div className={`px-5 py-4 border-b ${selectedCat.borderColor} ${selectedCat.bgColor} rounded-t-xl`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-gray-900/40">
                    <selectedCat.icon className={`h-5 w-5 ${selectedCat.color}`} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-base ${selectedCat.color}`}>
                      {selectedCat.id}. {selectedCat.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {selectedCat.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCategory}
                  className="flex-shrink-0 gap-1.5 text-xs"
                >
                  <Download className="h-3.5 w-3.5" /> Tải nhóm
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm tài liệu trong nhóm này..."
                  className="pl-9 h-9 text-sm bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>

            {/* Document Rows */}
            <CardContent className="p-3">
              <div className="space-y-1.5">
                {filteredDocs.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    Không tìm thấy tài liệu phù hợp
                  </div>
                )}
                {filteredDocs.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-all group"
                  >
                    {/* ID + Type */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1 w-12">
                      <span className="text-xs font-black text-gray-700 dark:text-gray-300">{doc.id}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${selectedCat.pillClass}`}>
                        {doc.type}
                      </span>
                    </div>

                    {/* Name + Purpose */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                        {doc.pages} · {doc.purpose.slice(0, 70)}{doc.purpose.length > 70 ? '…' : ''}
                      </p>
                    </div>

                    {/* Status + Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc.status === 'ready' ? (
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 gap-1 text-[10px] font-semibold hidden sm:flex">
                          <CheckCircle className="h-3 w-3" /> Sẵn sàng
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0 text-[10px] font-semibold hidden sm:flex">
                          Đang chuẩn bị
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => { setPreviewDoc(doc); setPreviewCat(selectedCat); }}
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={loading === doc.id || doc.status !== 'ready'}
                        onClick={() => downloadDocument(doc.id, doc.name)}
                        title="Tải xuống PDF"
                      >
                        {loading === doc.id
                          ? <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                          : <Download className="h-4 w-4 text-gray-500 hover:text-indigo-600" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Acceptance Workflow ───────────────── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-indigo-600" />
            Quy trình Nghiệm thu & Bàn giao
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row gap-0">
            {ACCEPTANCE_STEPS.map((step, idx) => (
              <div key={step.id} className="flex sm:flex-col items-start sm:items-center flex-1 gap-3 sm:gap-2">
                <div className="flex sm:flex-col items-center gap-3 sm:gap-2 w-full">
                  {/* Circle + connector */}
                  <div className="flex sm:flex-col items-center gap-0 w-full">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border-2 ${
                      step.done
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400'
                    }`}>
                      {step.done ? <CheckCircle className="h-4 w-4" /> : step.id}
                    </div>
                    {idx < ACCEPTANCE_STEPS.length - 1 && (
                      <div className={`hidden sm:block h-0.5 flex-1 w-full mt-0 ${
                        step.done ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                </div>
                <div className="sm:text-center min-w-0">
                  <p className={`text-xs font-semibold leading-tight ${
                    step.done ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Folder Structure ──────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-gray-500" />
            Cấu trúc thư mục hồ sơ khuyến nghị
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid lg:grid-cols-2 gap-4">
            <pre className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 p-4 rounded-xl text-xs text-gray-700 dark:text-gray-300 overflow-x-auto font-mono leading-relaxed">
{`HO_SO_NGHIEM_THU_CNTT/
├── E1_Phap_ly/
│   ├── E1.1_Quyet_dinh_phe_duyet.pdf
│   ├── E1.2_Quyet_dinh_to_trien_khai.pdf
│   ├── E1.3_Ke_hoach_trien_khai.pdf
│   └── E1.4_Bien_ban_hop.pdf
├── E2_Kien_truc/
│   ├── E2.1_Thuyet_minh_kien_truc.pdf
│   ├── E2.2_So_do_BEFORE_AFTER.pdf
│   ├── E2.3_So_do_phan_lop.pdf
│   └── E2.4_So_do_DFD.pdf
├── E3_CSDL_Du_lieu/
├── E4_Phan_quyen_RBAC/
├── E5_An_toan_thong_tin/
├── E6_Audit_Security_Log/
└── E7_Kiem_thu_Van_hanh/`}
            </pre>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Định dạng chuẩn:</strong> Tất cả tài liệu dạng PDF, khổ A4, font Times New Roman, cỡ 14, giãn dòng 1.5.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
                <FileCheck className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Đóng dấu:</strong> Văn bản pháp lý (E1, E4, E5) cần có chữ ký và con dấu BGĐ Học viện trước ngày nghiệm thu.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900">
                <Download className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-green-700 dark:text-green-300">
                  <strong>Lưu trữ:</strong> Bản gốc lưu tại Phòng CNTT. Bản sao phát cho thành viên Hội đồng nghiệm thu.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900">
                <Activity className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  <strong>Dữ liệu thực:</strong> Hội đồng có thể kiểm tra trực tiếp trên hệ thống tại <span className="font-mono">/dashboard/party/members</span> và các module nghiệp vụ.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Preview Dialog ────────────────────── */}
      <Dialog open={!!previewDoc} onOpenChange={() => { setPreviewDoc(null); setPreviewCat(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-base">
              {previewCat && (
                <div className={`p-2 rounded-lg ${previewCat.bgColor}`}>
                  <previewCat.icon className={`h-4 w-4 ${previewCat.color}`} />
                </div>
              )}
              {previewDoc?.id}: {previewDoc?.name}
            </DialogTitle>
            <DialogDescription asChild>
              <span className={`inline-flex mt-1 ${previewCat?.pillClass || ''} text-xs font-semibold px-2 py-0.5 rounded-full w-fit`}>
                {previewDoc?.type ? TYPE_LABEL[previewDoc.type] || previewDoc.type : ''}
                {previewDoc?.pages ? ` · ${previewDoc.pages}` : ''}
              </span>
            </DialogDescription>
          </DialogHeader>
          {previewDoc && (
            <div className="space-y-4 mt-1">
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Mục đích</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{previewDoc.purpose}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Nội dung chính</p>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-1.5">
                  {previewDoc.content.split(';').map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{item.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Badge className={`${previewDoc.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} border-0 text-xs`}>
                  {previewDoc.status === 'ready' ? '✓ Sẵn sàng tải xuống' : 'Đang chuẩn bị'}
                </Badge>
                <div className="flex-1" />
                <Button
                  size="sm"
                  disabled={loading === previewDoc.id || previewDoc.status !== 'ready'}
                  onClick={() => downloadDocument(previewDoc.id, previewDoc.name)}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loading === previewDoc.id
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải</>
                    : <><Download className="h-3.5 w-3.5" /> Tải PDF</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

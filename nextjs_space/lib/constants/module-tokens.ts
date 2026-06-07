export type ModuleId =
  | 'personnel'
  | 'party'
  | 'education'
  | 'research'
  | 'policy'
  | 'insurance'
  | 'student'
  | 'science'
  | 'admin'
  | 'workflow'
  | 'bigdata'
  | 'notifications'
  | 'default';

export interface ModuleToken {
  id: ModuleId;
  label: string;
  code: string;
  heroGradient: string;
  sidebarGradient: string;
  accentText: string;
  iconBg: string;
}

export const MODULE_TOKENS: Record<ModuleId, ModuleToken> = {
  personnel: {
    id: 'personnel',
    label: 'Quản lý Nhân sự',
    code: 'M02',
    heroGradient: 'from-blue-900 via-blue-800 to-blue-700',
    sidebarGradient: 'from-blue-600 to-blue-700',
    accentText: 'text-blue-200',
    iconBg: 'bg-white/20',
  },
  party: {
    id: 'party',
    label: 'Công tác Đảng',
    code: 'M03',
    heroGradient: 'from-red-800 via-red-700 to-rose-600',
    sidebarGradient: 'from-red-600 to-red-700',
    accentText: 'text-red-200',
    iconBg: 'bg-white/20',
  },
  education: {
    id: 'education',
    label: 'Giáo dục Đào tạo',
    code: 'M10',
    heroGradient: 'from-indigo-900 via-indigo-800 to-blue-800',
    sidebarGradient: 'from-indigo-600 to-blue-600',
    accentText: 'text-indigo-200',
    iconBg: 'bg-white/20',
  },
  research: {
    id: 'research',
    label: 'Nghiên cứu Khoa học',
    code: 'M09',
    heroGradient: 'from-violet-900 via-violet-700 to-purple-700',
    sidebarGradient: 'from-violet-600 to-purple-600',
    accentText: 'text-violet-200',
    iconBg: 'bg-white/20',
  },
  policy: {
    id: 'policy',
    label: 'Chính sách & Chế độ',
    code: 'M05',
    heroGradient: 'from-teal-900 via-teal-800 to-cyan-800',
    sidebarGradient: 'from-teal-600 to-cyan-600',
    accentText: 'text-teal-200',
    iconBg: 'bg-white/20',
  },
  insurance: {
    id: 'insurance',
    label: 'Bảo hiểm Xã hội',
    code: 'M06',
    heroGradient: 'from-emerald-900 via-emerald-800 to-green-800',
    sidebarGradient: 'from-emerald-600 to-green-600',
    accentText: 'text-emerald-200',
    iconBg: 'bg-white/20',
  },
  student: {
    id: 'student',
    label: 'Học viên',
    code: 'M10',
    heroGradient: 'from-indigo-900 via-blue-800 to-cyan-800',
    sidebarGradient: 'from-indigo-500 to-cyan-600',
    accentText: 'text-cyan-200',
    iconBg: 'bg-white/20',
  },
  science: {
    id: 'science',
    label: 'Quản lý Khoa học',
    code: 'M20',
    heroGradient: 'from-purple-900 via-fuchsia-800 to-pink-800',
    sidebarGradient: 'from-purple-600 to-fuchsia-600',
    accentText: 'text-fuchsia-200',
    iconBg: 'bg-white/20',
  },
  admin: {
    id: 'admin',
    label: 'Quản trị Hệ thống',
    code: 'M01',
    heroGradient: 'from-slate-900 via-slate-800 to-zinc-800',
    sidebarGradient: 'from-slate-600 to-zinc-600',
    accentText: 'text-slate-300',
    iconBg: 'bg-white/20',
  },
  workflow: {
    id: 'workflow',
    label: 'Quy trình & Hồ sơ',
    code: 'M13',
    heroGradient: 'from-blue-900 via-blue-800 to-cyan-800',
    sidebarGradient: 'from-blue-600 to-cyan-600',
    accentText: 'text-cyan-200',
    iconBg: 'bg-white/20',
  },
  bigdata: {
    id: 'bigdata',
    label: 'Khai thác Dữ liệu',
    code: 'KTDL',
    heroGradient: 'from-blue-900 via-blue-800 to-sky-700',
    sidebarGradient: 'from-blue-600 to-sky-600',
    accentText: 'text-sky-200',
    iconBg: 'bg-white/20',
  },
  notifications: {
    id: 'notifications',
    label: 'Trung tâm Thông báo',
    code: 'TB',
    heroGradient: 'from-indigo-900 via-indigo-800 to-blue-800',
    sidebarGradient: 'from-indigo-600 to-blue-600',
    accentText: 'text-indigo-200',
    iconBg: 'bg-white/20',
  },
  default: {
    id: 'default',
    label: 'Tổng quan',
    code: '',
    heroGradient: 'from-blue-900 via-blue-800 to-blue-700',
    sidebarGradient: 'from-blue-600 to-blue-700',
    accentText: 'text-blue-200',
    iconBg: 'bg-white/20',
  },
};

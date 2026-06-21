'use client';

/**
 * Hero danh tính — đầu trang Trung tâm cá nhân.
 * Hiển thị ảnh, họ tên, quân hàm/chức vụ/đơn vị, vòng tròn hoàn thiện hồ sơ và
 * các nút hành động nhanh (lọc theo quyền).
 */
import Link from 'next/link';
import { User, Mail, Phone, Building2, Shield, Star, Edit2, FileEdit, Lock, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODULE_TOKENS } from '@/lib/constants/module-tokens';
import type { PersonalIdentity } from '@/lib/types/personal-overview';

interface QuickAction {
  code: string;
  href: string;
  label: string;
  icon: LucideIcon;
}

const QUICK_ACTIONS: QuickAction[] = [
  { code: 'MANAGE_MY_PROFILE',       href: '/dashboard/profile',                     label: 'Hồ sơ của tôi',     icon: Edit2 },
  { code: 'VIEW_OWN_PROFILE_CHANGE', href: '/dashboard/personal/my-profile-changes', label: 'Đề nghị cập nhật',  icon: FileEdit },
  { code: 'MANAGE_MY_SECURITY',      href: '/dashboard/settings/security',           label: 'Bảo mật',           icon: Lock },
];

function completionStroke(pct: number): string {
  if (pct >= 80) return '#34d399'; // emerald-400
  if (pct >= 50) return '#fbbf24'; // amber-400
  return '#f87171'; // red-400
}

function CompletionRing({ pct }: { pct: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference;
  return (
    <div className="relative h-[76px] w-[76px] shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
        <circle
          cx="38" cy="38" r={radius} fill="none" stroke={completionStroke(pct)} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none text-white">{pct}%</span>
        <span className="mt-0.5 text-[9px] uppercase tracking-wide text-blue-200">Hồ sơ</span>
      </div>
    </div>
  );
}

export function IdentityHero({ identity, permissions }: { identity: PersonalIdentity; permissions: string[] }) {
  const has = (code: string) => permissions.includes(code);
  const initials = (identity.name || '?').trim().charAt(0).toUpperCase();
  const managementLabel = identity.managementCategory === 'CAN_BO' ? 'Diện CB quản lý' : identity.managementCategory ? 'Diện Quân lực' : null;

  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-md md:p-6', MODULE_TOKENS.personnel.heroGradient)}>
      <div className="absolute right-4 top-2 select-none opacity-10">
        <Shield className="h-28 w-28" />
      </div>

      <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center">
        {/* Avatar 4×6 (tỉ lệ 2:3) */}
        <div className="relative shrink-0">
          <div className="h-[162px] w-[108px] overflow-hidden rounded-lg border-2 border-white/30 bg-white/10 shadow-lg">
            {identity.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={identity.avatar} alt={identity.name || 'Avatar'} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/10 text-5xl font-bold text-white/90">{initials}</div>
            )}
          </div>
          {identity.isPartyMember && (
            <div title="Đảng viên ĐCSVN" className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 shadow">
              <Star className="h-3 w-3 fill-white text-white" />
            </div>
          )}
        </div>

        {/* Tên + thông tin */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">M02 · Không gian cá nhân</p>
          <h1 className="mt-0.5 truncate text-2xl font-bold md:text-3xl">{identity.name || 'Người dùng'}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {identity.rank && <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-medium ring-1 ring-white/20">{identity.rank}</span>}
            {identity.position && <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium ring-1 ring-white/15">{identity.position}</span>}
            {managementLabel && <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-xs font-medium text-amber-100 ring-1 ring-amber-300/30">{managementLabel}</span>}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-1.5 text-xs text-blue-100 sm:grid-cols-2 lg:grid-cols-4">
            <span className="flex min-w-0 items-center gap-1.5"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{identity.email}</span></span>
            <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" />{identity.phone || '—'}</span>
            <span className="flex min-w-0 items-center gap-1.5"><Building2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{identity.unitName || '—'}</span></span>
            <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 shrink-0" />{identity.militaryId || '—'}</span>
          </div>
        </div>

        {/* Hoàn thiện + hành động nhanh */}
        <div className="flex shrink-0 items-center gap-4 md:flex-col md:items-end">
          <CompletionRing pct={identity.completionPct} />
          <div className="flex flex-wrap gap-2 md:justify-end">
            {QUICK_ACTIONS.filter((a) => has(a.code)).map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.code}
                  href={a.href}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium ring-1 ring-white/20 transition-colors hover:bg-white/25"
                >
                  <Icon className="h-3.5 w-3.5" />{a.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

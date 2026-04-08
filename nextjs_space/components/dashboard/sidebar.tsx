
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';
import {
  LayoutDashboard,
  Users,
  Server,
  Activity,
  AlertCircle,
  FileText,
  Settings,
  Upload,
  Search,
  BarChart3,
  Database,
  Brain,
  Cpu,
  Shield,
  ScrollText,
  Lock,
  CheckCircle,
  Clock,
  GraduationCap,
  FlaskConical,
  FolderOpen,
  Download,
  BookOpen,
  Map,
  UserSquare2,
  FolderKanban,
  LibraryBig,
} from 'lucide-react';

const navigation = [
  {
    name: 'nav.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'nav.dashboards',
    icon: LayoutDashboard,
    children: [
      {
        name: 'nav.commandDashboard',
        href: '/dashboard/command',
        icon: LayoutDashboard,
      },
      {
        name: 'nav.facultyDashboard',
        href: '/dashboard/faculty',
        icon: Users,
      },
      {
        name: 'nav.departmentHeadDashboard',
        href: '/dashboard/department-head',
        icon: GraduationCap,
      },
      {
        name: 'nav.instructorDashboard',
        href: '/dashboard/instructor',
        icon: GraduationCap,
      },
      {
        name: 'nav.studentDashboard',
        href: '/dashboard/student',
        icon: GraduationCap,
      },
      {
        name: 'nav.adminDashboard',
        href: '/dashboard/admin',
        icon: Shield,
      },
    ],
  },
  {
    name: 'nav.datalake',
    href: '/dashboard/datalake',
    icon: Database,
  },
  {
    name: 'nav.training',
    href: '/dashboard/training',
    icon: GraduationCap,
  },
  {
    name: 'nav.research',
    icon: FlaskConical,
    children: [
      {
        name: 'nav.researchOverview',
        href: '/dashboard/research',
        icon: LayoutDashboard,
      },
      {
        name: 'nav.researchProjects',
        href: '/dashboard/research/projects',
        icon: FolderKanban,
      },
      {
        name: 'nav.researchPublications',
        href: '/dashboard/research/publications',
        icon: BookOpen,
      },
      {
        name: 'nav.researchScientists',
        href: '/dashboard/research/scientists',
        icon: UserSquare2,
      },
      {
        name: 'nav.researchCapacityMap',
        href: '/dashboard/research/scientists/capacity-map',
        icon: Map,
      },
      {
        name: 'nav.researchRepository',
        href: '/dashboard/research/repository',
        icon: LibraryBig,
      },
      {
        name: 'nav.researchManagement',
        href: '/dashboard/research/management',
        icon: FolderOpen,
      },
    ],
  },
  {
    name: 'nav.aiTraining',
    href: '/dashboard/ai-training',
    icon: Brain,
  },
  {
    name: 'nav.data',
    icon: Database,
    children: [
      {
        name: 'nav.upload',
        href: '/dashboard/data/upload',
        icon: Upload,
      },
      {
        name: 'nav.query',
        href: '/dashboard/data/query',
        icon: Search,
      },
    ],
  },
  {
    name: 'nav.analytics',
    icon: BarChart3,
    children: [
      {
        name: 'nav.basicAnalytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
      },
      {
        name: 'nav.advancedAnalytics',
        href: '/dashboard/analytics/advanced',
        icon: BarChart3,
      },
    ],
  },
  {
    name: 'nav.reports',
    href: '/dashboard/reports',
    icon: FileText,
  },
  {
    name: 'nav.templates',
    icon: FolderOpen,
    children: [
      {
        name: 'nav.templateLibrary',
        href: '/dashboard/templates',
        icon: FolderOpen,
      },
      {
        name: 'nav.exportJobs',
        href: '/dashboard/templates/export-jobs',
        icon: Download,
      },
      {
        name: 'nav.scheduledExports',
        href: '/dashboard/templates/schedules',
        icon: Clock,
      },
    ],
  },
  {
    name: 'nav.ml',
    icon: Brain,
    children: [
      {
        name: 'nav.models',
        href: '/dashboard/ml/models',
        icon: Brain,
      },
      {
        name: 'nav.training',
        href: '/dashboard/ml/training',
        icon: Cpu,
      },
      {
        name: 'nav.experiments',
        href: '/dashboard/ml/experiments',
        icon: Activity,
      },
      {
        name: 'nav.versions',
        href: '/dashboard/ml/versions',
        icon: CheckCircle,
      },
      {
        name: 'nav.workflows',
        href: '/dashboard/ml/workflows',
        icon: Server,
      },
    ],
  },
  {
    name: 'nav.users',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    name: 'nav.services',
    href: '/dashboard/services',
    icon: Server,
  },
  {
    name: 'nav.monitoring',
    icon: Activity,
    children: [
      {
        name: 'nav.systemMonitoring',
        href: '/dashboard/monitoring',
        icon: Activity,
      },
      {
        name: 'nav.realtimeMonitoring',
        href: '/dashboard/realtime',
        icon: Activity,
      },
    ],
  },
  {
    name: 'nav.alerts',
    href: '/dashboard/alerts',
    icon: AlertCircle,
  },
  {
    name: 'nav.security',
    icon: Shield,
    children: [
      {
        name: 'nav.audit',
        href: '/dashboard/security/audit',
        icon: Shield,
      },
      {
        name: 'nav.permissions',
        href: '/dashboard/security/permissions',
        icon: Lock,
      },
    ],
  },
  {
    name: 'nav.logs',
    href: '/dashboard/logs',
    icon: ScrollText,
  },
  {
    name: 'nav.governance',
    icon: FileText,
    children: [
      {
        name: 'nav.compliance',
        href: '/dashboard/governance/compliance',
        icon: CheckCircle,
      },
      {
        name: 'nav.retention',
        href: '/dashboard/governance/retention',
        icon: Clock,
      },
    ],
  },
  {
    name: 'nav.settings',
    icon: Settings,
    children: [
      {
        name: 'nav.appearance',
        href: '/dashboard/settings/appearance',
        icon: Settings,
      },
      {
        name: 'nav.generalSettings',
        href: '/dashboard/settings',
        icon: Settings,
      },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-64 lg:overflow-y-auto lg:border-r lg:pt-16 lg:bg-card">
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          
          if (item.children) {
            // Render submenu
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground">
                  <Icon className="h-5 w-5" />
                  <span>{t(item.name)}</span>
                </div>
                <div className="ml-6 space-y-1">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    // Exact match for root-level children; prefix match for deeper ones
                    const isActive = pathname === child.href ||
                      (child.href !== '/dashboard/research' && pathname.startsWith(child.href + '/'));

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <ChildIcon className="h-4 w-4" />
                        <span>{t(child.name)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }
          
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href || '#'}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{t(item.name)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { type ModuleId } from '@/lib/constants/module-tokens';

const MODULE_PATH_MAP: { prefix: string; moduleId: ModuleId }[] = [
  { prefix: '/dashboard/personnel', moduleId: 'personnel' },
  { prefix: '/dashboard/party', moduleId: 'party' },
  { prefix: '/dashboard/education', moduleId: 'education' },
  { prefix: '/dashboard/student', moduleId: 'student' },
  { prefix: '/dashboard/research', moduleId: 'research' },
  { prefix: '/dashboard/policy', moduleId: 'policy' },
  { prefix: '/dashboard/insurance', moduleId: 'insurance' },
  { prefix: '/dashboard/emulation', moduleId: 'policy' },
  { prefix: '/dashboard/science', moduleId: 'science' },
  { prefix: '/dashboard/workflow', moduleId: 'workflow' },
  { prefix: '/dashboard/admin', moduleId: 'admin' },
  { prefix: '/dashboard/system', moduleId: 'admin' },
  { prefix: '/dashboard/settings', moduleId: 'admin' },
  { prefix: '/dashboard/users', moduleId: 'admin' },
];

export function useActiveModule(): ModuleId {
  const pathname = usePathname();

  for (const { prefix, moduleId } of MODULE_PATH_MAP) {
    if (pathname.startsWith(prefix)) return moduleId;
  }

  return 'default';
}

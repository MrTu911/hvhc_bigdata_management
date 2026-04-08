/**
 * Page Header Component
 * Tiêu đề trang với breadcrumb và actions
 */

'use client';

import { ReactNode } from 'react';
import { Breadcrumb } from './breadcrumb';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  breadcrumbItems?: { label: string; href?: string }[];
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  breadcrumbItems,
  className
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-2 mb-6', className)}>
      <Breadcrumb items={breadcrumbItems} />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;

"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  className
}: KPICardProps) {
  const variantStyles = {
    default: 'border-t-blue-500',
    success: 'border-t-green-500',
    warning: 'border-t-amber-500',
    danger: 'border-t-red-500',
    info: 'border-t-cyan-500'
  };

  const iconBgStyles = {
    default: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400'
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-6',
        'border-t-4 border border-slate-200 dark:border-slate-700',
        'bg-gradient-to-br from-white via-slate-50/50 to-white',
        'dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900',
        'shadow-lg hover:shadow-xl transition-all duration-300',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            {title}
          </p>
          <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-br from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'p-3 rounded-xl',
            iconBgStyles[variant]
          )}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}

interface DataPanelProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function DataPanel({
  title,
  subtitle,
  children,
  actions,
  className
}: DataPanelProps) {
  return (
    <div className={cn(
      'rounded-xl overflow-hidden',
      'bg-white dark:bg-slate-800',
      'border border-slate-200 dark:border-slate-700',
      'shadow-lg',
      className
    )}>
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const styles = {
    success: 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200 dark:from-green-900/40 dark:to-green-800/20 dark:text-green-300 dark:border-green-700/50',
    warning: 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border-amber-200 dark:from-amber-900/40 dark:to-amber-800/20 dark:text-amber-300 dark:border-amber-700/50',
    danger: 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200 dark:from-red-900/40 dark:to-red-800/20 dark:text-red-300 dark:border-red-700/50',
    info: 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200 dark:from-blue-900/40 dark:to-blue-800/20 dark:text-blue-300 dark:border-blue-700/50',
    neutral: 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border-slate-200 dark:from-slate-700 dark:to-slate-600 dark:text-slate-200 dark:border-slate-500'
  };

  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shadow-sm',
      styles[status],
      className
    )}>
      {label}
    </span>
  );
}

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartPanel({ title, subtitle, children, className }: ChartPanelProps) {
  return (
    <div className={cn(
      'rounded-xl p-6',
      'bg-gradient-to-br from-white via-slate-50/50 to-white',
      'dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900',
      'border border-slate-200 dark:border-slate-700',
      'shadow-lg',
      className
    )}>
      <div className="pb-4 mb-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      <div className="min-h-[300px]">
        {children}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-slate-100 dark:via-slate-300 dark:to-slate-200 bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div className={cn(
      'flex flex-wrap items-center gap-3 p-4 rounded-xl mb-6',
      'bg-slate-50 dark:bg-slate-800/50',
      'border border-slate-200 dark:border-slate-700',
      className
    )}>
      {children}
    </div>
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-6 text-center',
      className
    )}>
      {Icon && (
        <Icon className="w-20 h-20 mb-6 text-slate-300 dark:text-slate-600" />
      )}
      <h3 className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-300">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

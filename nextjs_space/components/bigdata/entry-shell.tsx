'use client';

import Link from 'next/link';
import { ArrowRight, ExternalLink, type LucideIcon } from 'lucide-react';
import { ModuleHero } from '@/components/ui/enhanced-data-card';

export interface EntryLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

interface EntryShellProps {
  supra: string;
  title: string;
  subtitle: string;
  heroIcon: LucideIcon;
  links: EntryLink[];
  /** Optional preview content rendered above the link grid. */
  children?: React.ReactNode;
}

/**
 * Thin "entry-point" page for BigData modules that already exist elsewhere in the
 * app. Renders the section hero + a grid of styled cards linking to the existing
 * battle-tested pages — deliberately NOT a re-implementation (avoids duplicating
 * source of truth per architecture rules).
 */
export function EntryShell({
  supra,
  title,
  subtitle,
  heroIcon,
  links,
  children,
}: EntryShellProps) {
  return (
    <div className="space-y-6">
      <ModuleHero
        moduleId="bigdata"
        supra={supra}
        title={title}
        subtitle={subtitle}
        icon={heroIcon}
      />

      {children}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{link.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                Mở trang <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

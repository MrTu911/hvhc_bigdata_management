'use client';

import {
  ChevronRight,
  Database,
  Download,
  Radio,
  Wand2,
  ShieldCheck,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PipelineNode } from './types';

interface PipelineDagProps {
  nodes: PipelineNode[];
  className?: string;
}

const KIND_ICON: Record<PipelineNode['kind'], LucideIcon> = {
  source: Database,
  extract: Download,
  stream: Radio,
  transform: Wand2,
  quality: ShieldCheck,
  load: Upload,
};

const KIND_ACCENT: Record<PipelineNode['kind'], string> = {
  source: 'text-info',
  extract: 'text-primary',
  stream: 'text-accent',
  transform: 'text-primary',
  quality: 'text-success',
  load: 'text-info',
};

/**
 * Simple horizontal DAG: a flex row of node chips joined by arrows.
 * Phase 1 approximation of the template's SVG pipeline visualizer.
 */
export function PipelineDag({ nodes, className }: PipelineDagProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {nodes.map((node, index) => {
        const Icon = KIND_ICON[node.kind];
        return (
          <div key={node.id} className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                node.highlight
                  ? 'border-primary/40 bg-primary/5 font-medium'
                  : 'border-border bg-card',
              )}
            >
              <Icon className={cn('h-4 w-4', KIND_ACCENT[node.kind])} />
              <span className="text-foreground">{node.label}</span>
            </div>
            {index < nodes.length - 1 && (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </div>
        );
      })}
    </div>
  );
}

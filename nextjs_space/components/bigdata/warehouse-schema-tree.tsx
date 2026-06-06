'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Database, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SchemaNode } from './types';

export interface SchemaSelection {
  schema: string;
  table: string;
}

interface WarehouseSchemaTreeProps {
  schemas: SchemaNode[];
  selected: SchemaSelection;
  onSelect: (selection: SchemaSelection) => void;
}

/** Collapsible schema → table tree for the warehouse browser. */
export function WarehouseSchemaTree({ schemas, selected, onSelect }: WarehouseSchemaTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(schemas.map((s) => [s.schema, true])),
  );

  const toggle = (schema: string) =>
    setExpanded((prev) => ({ ...prev, [schema]: !prev[schema] }));

  return (
    <div className="space-y-1">
      {schemas.map((node) => {
        const isOpen = expanded[node.schema];
        return (
          <div key={node.schema}>
            <button
              type="button"
              onClick={() => toggle(node.schema)}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <Database className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs">{node.schema}</span>
            </button>

            {isOpen && (
              <div className="ml-6 space-y-0.5 border-l border-border pl-2">
                {node.tables.map((table) => {
                  const isActive = selected.schema === node.schema && selected.table === table.name;
                  return (
                    <button
                      key={table.name}
                      type="button"
                      onClick={() => onSelect({ schema: node.schema, table: table.name })}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-xs',
                        isActive
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                      )}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Table2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate font-mono">{table.name}</span>
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{table.rows}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

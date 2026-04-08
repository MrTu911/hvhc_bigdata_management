'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Database, GitBranch, Brain, FileCode, Box, Calendar, Info } from 'lucide-react';
import { DataLineageNode } from '@/lib/data-governance';
import { format } from 'date-fns';

interface LineageDetailsProps {
  node: DataLineageNode | null;
}

export default function LineageDetails({ node }: LineageDetailsProps) {
  if (!node) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Chi tiết Node</CardTitle>
          <CardDescription>Chọn một node để xem chi tiết</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Click vào một node trong graph để xem thông tin chi tiết
          </p>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'dataset':
        return <Database className="h-5 w-5" />;
      case 'process':
        return <GitBranch className="h-5 w-5" />;
      case 'model':
        return <Brain className="h-5 w-5" />;
      case 'source':
        return <FileCode className="h-5 w-5" />;
      case 'output':
        return <Box className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dataset':
        return 'bg-blue-500';
      case 'process':
        return 'bg-green-500';
      case 'model':
        return 'bg-purple-500';
      case 'source':
        return 'bg-orange-500';
      case 'output':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'dataset':
        return 'Dataset';
      case 'process':
        return 'Process';
      case 'model':
        return 'ML Model';
      case 'source':
        return 'Source';
      case 'output':
        return 'Output';
      default:
        return type;
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getTypeColor(node.type)} text-white`}>
            {getIcon(node.type)}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{node.name}</CardTitle>
            <CardDescription>{getTypeName(node.type)}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type Badge */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <div className="mt-1">
            <Badge variant="outline" className="font-mono">
              {node.type.toUpperCase()}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Timestamp */}
        <div>
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Timestamp
          </label>
          <p className="text-sm mt-1">
            {format(new Date(node.timestamp), 'dd/MM/yyyy HH:mm:ss')}
          </p>
        </div>

        <Separator />

        {/* Metadata */}
        {node.metadata && Object.keys(node.metadata).length > 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Metadata</label>
            <div className="mt-2 space-y-2">
              {Object.entries(node.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-sm font-medium">
                    {typeof value === 'object'
                      ? JSON.stringify(value)
                      : value?.toString() || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ID */}
        <Separator />
        <div>
          <label className="text-xs font-medium text-muted-foreground">Node ID</label>
          <p className="text-xs mt-1 font-mono bg-muted p-2 rounded break-all">
            {node.id}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

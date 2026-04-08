
'use client';

/**
 * Model Registry Manager Component
 * Manage ML model versions, deployments, and lifecycle
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Rocket, 
  Archive, 
  Trash2, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ModelVersion {
  id: number;
  modelId: number;
  version: string;
  status: 'REGISTERED' | 'STAGED' | 'PRODUCTION' | 'ARCHIVED' | 'DEPRECATED';
  isProduction: boolean;
  metrics?: any;
  modelSizeMb?: number;
  trainingDurationSeconds?: number;
  promotedAt?: string;
  promotedBy?: string;
  created_at: string;
}

interface ModelRegistryManagerProps {
  modelId: number;
}

export function ModelRegistryManager({ modelId }: ModelRegistryManagerProps) {
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<ModelVersion | null>(null);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [modelId]);

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/ml/registry?modelId=${modelId}`);
      const result = await response.json();

      if (result.success) {
        setVersions(result.data || []);
      } else {
        toast.error('Failed to fetch model versions');
      }
    } catch (error) {
      toast.error('Error fetching model versions');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToProduction = async (versionId: number) => {
    try {
      const response = await fetch('/api/ml/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'promote',
          versionId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Model version promoted to production');
        fetchVersions();
        setShowPromoteDialog(false);
      } else {
        toast.error(result.error || 'Failed to promote model');
      }
    } catch (error) {
      toast.error('Error promoting model version');
    }
  };

  const handleArchiveVersion = async (versionId: number) => {
    try {
      const response = await fetch('/api/ml/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          versionId,
          status: 'ARCHIVED',
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Model version archived');
        fetchVersions();
      } else {
        toast.error(result.error || 'Failed to archive model');
      }
    } catch (error) {
      toast.error('Error archiving model version');
    }
  };

  const handleDeleteVersion = async (versionId: number) => {
    if (!confirm('Are you sure you want to delete this model version? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/ml/registry?versionId=${versionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Model version deleted');
        fetchVersions();
      } else {
        toast.error(result.error || 'Failed to delete model');
      }
    } catch (error) {
      toast.error('Error deleting model version');
    }
  };

  const getStatusBadge = (status: ModelVersion['status'], isProduction: boolean) => {
    if (isProduction) {
      return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />PRODUCTION</Badge>;
    }

    const variants: { [key: string]: any } = {
      REGISTERED: <Badge variant="secondary">REGISTERED</Badge>,
      STAGED: <Badge variant="outline" className="border-blue-500 text-blue-500">STAGED</Badge>,
      ARCHIVED: <Badge variant="outline">ARCHIVED</Badge>,
      DEPRECATED: <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />DEPRECATED</Badge>,
    };

    return variants[status] || <Badge>{status}</Badge>;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatSize = (mb?: number) => {
    if (!mb) return 'N/A';
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading model versions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Version Registry</CardTitle>
        <CardDescription>
          Manage and deploy model versions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Metrics</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Training Time</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version) => (
              <TableRow key={version.id}>
                <TableCell className="font-medium">{version.version}</TableCell>
                <TableCell>{getStatusBadge(version.status, version.isProduction)}</TableCell>
                <TableCell>
                  {version.metrics ? (
                    <div className="text-xs">
                      {Object.entries(version.metrics).slice(0, 2).map(([key, value]: any) => (
                        <div key={key}>
                          {key}: {typeof value === 'number' ? value.toFixed(4) : value}
                        </div>
                      ))}
                    </div>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>{formatSize(version.modelSizeMb)}</TableCell>
                <TableCell>{formatDuration(version.trainingDurationSeconds)}</TableCell>
                <TableCell>
                  {new Date(version.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!version.isProduction && version.status !== 'ARCHIVED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVersion(version);
                          setShowPromoteDialog(true);
                        }}
                      >
                        <Rocket className="h-4 w-4 mr-1" />
                        Promote
                      </Button>
                    )}
                    
                    {!version.isProduction && version.status !== 'ARCHIVED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleArchiveVersion(version.id)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {!version.isProduction && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteVersion(version.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {versions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No model versions registered yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Promote to Production</DialogTitle>
              <DialogDescription>
                Are you sure you want to promote version <strong>{selectedVersion?.version}</strong> to production?
                This will demote the current production version.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPromoteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => selectedVersion && handlePromoteToProduction(selectedVersion.id)}>
                <Rocket className="h-4 w-4 mr-2" />
                Promote to Production
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

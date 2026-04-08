
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bell, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface Warning {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  affectedEntities: number;
  detectedAt: Date;
  acknowledged: boolean;
  aiConfidence: number;
}

interface AIEarlyWarningSystemProps {
  className?: string;
}

export function AIEarlyWarningSystem({ className }: AIEarlyWarningSystemProps) {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unacknowledged'>('unacknowledged');

  useEffect(() => {
    fetchWarnings();
    const interval = setInterval(fetchWarnings, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchWarnings = async () => {
    try {
      const response = await fetch('/api/ai/early-warnings');
      if (response.ok) {
        const data = await response.json();
        setWarnings(data.warnings || []);
      }
    } catch (error) {
      console.error('Error fetching warnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeWarning = async (id: string) => {
    try {
      await fetch(`/api/ai/early-warnings/${id}/acknowledge`, {
        method: 'POST',
      });
      setWarnings(warnings.map(w => 
        w.id === id ? { ...w, acknowledged: true } : w
      ));
    } catch (error) {
      console.error('Error acknowledging warning:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'high':
        return 'bg-orange-100 border-orange-500 text-orange-900';
      case 'medium':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case 'low':
        return 'bg-blue-100 border-blue-500 text-blue-900';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-900';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    };
    return colors[severity as keyof typeof colors] || 'default';
  };

  const filteredWarnings = warnings.filter(w => 
    filter === 'all' || !w.acknowledged
  );

  return (
    <Card className={cn('card-hover', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            AI Early Warning System
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filter === 'unacknowledged' ? 'default' : 'outline'}
              onClick={() => setFilter('unacknowledged')}
            >
              Active
            </Button>
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredWarnings.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <p className="text-muted-foreground">No active warnings</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredWarnings.map((warning) => (
              <div
                key={warning.id}
                className={cn(
                  'p-4 rounded-lg border-l-4 transition-all hover:shadow-md',
                  getSeverityColor(warning.severity),
                  warning.acknowledged && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <Badge variant={getSeverityBadge(warning.severity) as any}>
                        {warning.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {warning.category}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{warning.title}</h4>
                    <p className="text-sm mb-2">{warning.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Affected: {warning.affectedEntities} entities
                      </span>
                      <span>
                        AI Confidence: {Math.round(warning.aiConfidence * 100)}%
                      </span>
                      <span>
                        {new Date(warning.detectedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  {!warning.acknowledged && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeWarning(warning.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Acknowledge
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

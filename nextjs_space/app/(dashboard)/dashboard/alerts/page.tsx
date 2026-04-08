
'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Alert {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceType: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  triggeredAt: Date;
}

export default function AlertsPage() {
  const { t, language } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      if (response.ok) {
        const result = await response.json();
        setAlerts(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    const icons = {
      CRITICAL: XCircle,
      ERROR: AlertCircle,
      WARNING: AlertTriangle,
      INFO: Info,
    };
    return icons[severity as keyof typeof icons] || Info;
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      CRITICAL: 'text-red-600 bg-red-50 dark:bg-red-900/20',
      ERROR: 'text-red-500 bg-red-50 dark:bg-red-900/20',
      WARNING: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
      INFO: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    };
    return colors[severity as keyof typeof colors] || colors.INFO;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      ACKNOWLEDGED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('nav.alerts')}</h2>
        <p className="text-muted-foreground mt-1">
          {alerts?.filter((a) => a.status === 'ACTIVE')?.length ?? 0}{' '}
          {language === 'vi' ? 'cảnh báo đang hoạt động' : 'active alerts'}
        </p>
      </div>

      <div className="space-y-3">
        {alerts?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {language === 'vi' ? 'Không có cảnh báo nào' : 'No alerts'}
              </p>
            </CardContent>
          </Card>
        ) : (
          alerts?.map((alert) => {
            const SeverityIcon = getSeverityIcon(alert?.severity);
            
            return (
              <Card key={alert?.id} className={`border-l-4 ${alert?.severity === 'CRITICAL' ? 'border-l-red-500' : alert?.severity === 'WARNING' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getSeverityColor(alert?.severity)}`}>
                        <SeverityIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{alert?.title}</CardTitle>
                          <Badge className={getStatusBadgeColor(alert?.status)}>
                            {alert?.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert?.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Service: {alert?.serviceName}</span>
                          <span>•</span>
                          <span>{format(new Date(alert?.triggeredAt), 'PPpp')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

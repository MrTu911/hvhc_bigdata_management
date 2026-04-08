
'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Server, Database, Cloud, Activity, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface Service {
  id: string;
  name: string;
  type: string;
  status: string;
  host: string;
  port: number;
  url?: string;
  version?: string;
  uptime?: number;
  lastChecked?: Date;
}

const serviceIcons: Record<string, any> = {
  POSTGRESQL: Database,
  CLICKHOUSE: Database,
  MINIO: Cloud,
  AIRFLOW: Activity,
  PROMETHEUS: Activity,
  SUPERSET: Activity,
  KAFKA: Server,
  HADOOP: Server,
  SPARK: Server,
  GRAFANA: Activity,
  ZOOKEEPER: Server,
};

export default function ServicesPage() {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const result = await response.json();
        setServices(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshHealth = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/services/health');
      if (response.ok) {
        const result = await response.json();
        setServices(result.data || []);
      }
    } catch (error) {
      console.error('Failed to refresh health:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      HEALTHY: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      DEGRADED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      DOWN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      UNKNOWN: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[status as keyof typeof colors] || colors.UNKNOWN;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('nav.services')}</h2>
          <p className="text-muted-foreground mt-1">
            {services?.filter((s) => s.status === 'HEALTHY')?.length ?? 0} / {services?.length ?? 0} healthy
          </p>
        </div>
        <Button onClick={handleRefreshHealth} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Health
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services?.map((service) => {
          const IconComponent = serviceIcons[service?.type] || Server;
          
          return (
            <Card key={service?.id} className="card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{service?.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {service?.type}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(service?.status)}>
                    {t(`status.${service?.status}`)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Host:</span>{' '}
                  <span className="font-mono text-xs">{service?.host}:{service?.port}</span>
                </div>
                {service?.version && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Version:</span>{' '}
                    <span className="font-mono text-xs">{service.version}</span>
                  </div>
                )}
                {service?.uptime !== null && service?.uptime !== undefined && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Uptime:</span>{' '}
                    <span className="font-semibold">{service.uptime.toFixed(1)}%</span>
                  </div>
                )}
                {service?.lastChecked && (
                  <div className="text-xs text-muted-foreground">
                    Last checked: {format(new Date(service.lastChecked), 'HH:mm:ss')}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

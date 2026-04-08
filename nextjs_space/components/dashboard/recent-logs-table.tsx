
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/providers/language-provider';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

interface Log {
  id: string;
  level: string;
  category: string;
  action: string;
  description: string;
  userName?: string;
  userEmail?: string;
  createdAt: Date;
}

interface RecentLogsTableProps {
  logs: Log[];
}

const levelColors = {
  INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  WARNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CRITICAL: 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300',
  DEBUG: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export function RecentLogsTable({ logs }: RecentLogsTableProps) {
  const { t, language } = useLanguage();

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle>{t('dashboard.recentLogs')}</CardTitle>
        <CardDescription>
          {language === 'vi' ? 'Hoạt động hệ thống gần đây' : 'Recent system activities'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {logs?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {language === 'vi' ? 'Không có nhật ký nào' : 'No logs available'}
            </p>
          ) : (
            logs?.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={levelColors[log.level as keyof typeof levelColors]}>
                      {log.level}
                    </Badge>
                    <span className="text-sm font-medium">{log.action}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {log.description}
                  </p>
                  {log.userName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.userName} ({log.userEmail})
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                  {format(new Date(log.createdAt), 'HH:mm:ss', {
                    locale: language === 'vi' ? vi : enUS,
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

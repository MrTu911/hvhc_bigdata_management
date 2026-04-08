
'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

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

const levelColors = {
  INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  WARNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CRITICAL: 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300',
  DEBUG: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function LogsPage() {
  const { t, language } = useLanguage();
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      if (response.ok) {
        const result = await response.json();
        setLogs(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) =>
    log?.action?.toLowerCase()?.includes(search?.toLowerCase() || '') ||
    log?.description?.toLowerCase()?.includes(search?.toLowerCase() || '') ||
    log?.userName?.toLowerCase()?.includes(search?.toLowerCase() || '')
  );

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
        <h2 className="text-3xl font-bold tracking-tight">{t('nav.logs')}</h2>
        <p className="text-muted-foreground mt-1">
          {filteredLogs?.length ?? 0} {language === 'vi' ? 'bản ghi' : 'entries'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'vi' ? 'Tìm kiếm nhật ký...' : 'Search logs...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredLogs?.map((log) => (
              <div
                key={log?.id}
                className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={levelColors[log?.level as keyof typeof levelColors]}>
                      {log?.level}
                    </Badge>
                    <Badge variant="outline">{log?.category}</Badge>
                    <span className="text-sm font-medium">{log?.action}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {log?.description}
                  </p>
                  {log?.userName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.userName} ({log.userEmail})
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                  {format(new Date(log?.createdAt), 'PPpp')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

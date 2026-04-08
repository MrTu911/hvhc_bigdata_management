'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, Download, History, Clock, Database, Table } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QueryResult {
  columns: string[];
  rows: any[][];
  executionTime: number;
  rowCount: number;
}

interface QueryHistory {
  id: string;
  query: string;
  database: string;
  executedAt: string;
  executionTime: number;
  status: 'success' | 'error';
}

export default function DataQueryPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [database, setDatabase] = useState('postgresql');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<QueryHistory[]>([]);

  const translations = {
    vi: {
      pageTitle: 'Truy vấn dữ liệu',
      pageDescription: 'Thực hiện truy vấn SQL trên các cơ sở dữ liệu',
      queryEditor: 'Trình soạn truy vấn',
      database: 'Cơ sở dữ liệu',
      selectDatabase: 'Chọn database',
      postgresql: 'PostgreSQL (Chính)',
      clickhouse: 'ClickHouse (Analytics)',
      enterQuery: 'Nhập câu truy vấn SQL...',
      execute: 'Thực thi',
      executing: 'Đang thực thi...',
      results: 'Kết quả',
      history: 'Lịch sử',
      savedQueries: 'Truy vấn đã lưu',
      rowsReturned: 'dòng',
      executionTime: 'Thời gian thực thi',
      noResults: 'Chưa có kết quả',
      runQuery: 'Chạy truy vấn để xem kết quả',
      exportCSV: 'Xuất CSV',
      exportJSON: 'Xuất JSON',
      clearHistory: 'Xóa lịch sử',
      exampleQueries: 'Truy vấn mẫu',
      selectAll: 'SELECT * FROM users LIMIT 10;',
      countRecords: 'SELECT COUNT(*) FROM datasets;',
      joinQuery: 'SELECT u.name, COUNT(d.id) as dataset_count FROM users u LEFT JOIN datasets d ON u.id = d.user_id GROUP BY u.name;'
    },
    en: {
      pageTitle: 'Data Query',
      pageDescription: 'Execute SQL queries on databases',
      queryEditor: 'Query Editor',
      database: 'Database',
      selectDatabase: 'Select database',
      postgresql: 'PostgreSQL (Main)',
      clickhouse: 'ClickHouse (Analytics)',
      enterQuery: 'Enter SQL query...',
      execute: 'Execute',
      executing: 'Executing...',
      results: 'Results',
      history: 'History',
      savedQueries: 'Saved Queries',
      rowsReturned: 'rows',
      executionTime: 'Execution time',
      noResults: 'No results yet',
      runQuery: 'Run a query to see results',
      exportCSV: 'Export CSV',
      exportJSON: 'Export JSON',
      clearHistory: 'Clear History',
      exampleQueries: 'Example Queries',
      selectAll: 'SELECT * FROM users LIMIT 10;',
      countRecords: 'SELECT COUNT(*) FROM datasets;',
      joinQuery: 'SELECT u.name, COUNT(d.id) as dataset_count FROM users u LEFT JOIN datasets d ON u.id = d.user_id GROUP BY u.name;'
    }
  };

  const lang = language === 'en' ? 'en' : 'vi';
  const tr = translations[lang];

  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a query',
        variant: 'destructive'
      });
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const response = await fetch('/api/data/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, database })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data.data);
        
        const newHistoryItem: QueryHistory = {
          id: Date.now().toString(),
          query,
          database,
          executedAt: new Date().toISOString(),
          executionTime: data.data.executionTime,
          status: 'success'
        };
        setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
        
        toast({
          title: 'Success',
          description: `Query executed in ${data.data.executionTime}ms`
        });
      } else {
        throw new Error(data.error || 'Query failed');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExportCSV = () => {
    if (!result) return;
    
    const csv = [
      result.columns.join(','),
      ...result.rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-result-${Date.now()}.csv`;
    a.click();
  };

  const handleExportJSON = () => {
    if (!result) return;
    
    const json = result.rows.map(row => {
      const obj: any = {};
      result.columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
    
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-result-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{tr.pageTitle}</h1>
        <p className="text-muted-foreground mt-2">{tr.pageDescription}</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{tr.queryEditor}</CardTitle>
            <CardDescription>
              {lang === 'vi' ? 'Viết và thực thi câu truy vấn SQL' : 'Write and execute SQL queries'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="database">{tr.database}</Label>
              <Select value={database} onValueChange={setDatabase}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgresql">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      {tr.postgresql}
                    </div>
                  </SelectItem>
                  <SelectItem value="clickhouse">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4" />
                      {tr.clickhouse}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="query">SQL Query</Label>
              <Textarea
                id="query"
                placeholder={tr.enterQuery}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleExecuteQuery}
                disabled={isExecuting}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                {isExecuting ? tr.executing : tr.execute}
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{tr.exampleQueries}</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(tr.selectAll)}
                >
                  SELECT * LIMIT 10
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(tr.countRecords)}
                >
                  COUNT Records
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(tr.joinQuery)}
                >
                  JOIN Query
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="results" className="w-full">
          <TabsList>
            <TabsTrigger value="results">{tr.results}</TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              {tr.history}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{tr.results}</CardTitle>
                    {result && (
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <Badge variant="secondary">
                          {result.rowCount} {tr.rowsReturned}
                        </Badge>
                        <span className="text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {tr.executionTime}: {result.executionTime}ms
                        </span>
                      </CardDescription>
                    )}
                  </div>
                  {result && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        {tr.exportCSV}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportJSON}>
                        <Download className="h-4 w-4 mr-2" />
                        {tr.exportJSON}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="p-4 border border-red-500 rounded-lg bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100">
                    <p className="font-medium">Error</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                )}

                {!result && !error && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{tr.noResults}</p>
                    <p className="text-sm mt-1">{tr.runQuery}</p>
                  </div>
                )}

                {result && !error && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          {result.columns.map((col, i) => (
                            <th key={i} className="text-left p-2 font-medium text-sm bg-muted">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((row, i) => (
                          <tr key={i} className="border-b hover:bg-muted/50">
                            {row.map((cell, j) => (
                              <td key={j} className="p-2 text-sm">
                                {cell === null ? (
                                  <span className="text-muted-foreground italic">NULL</span>
                                ) : (
                                  String(cell)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{tr.history}</CardTitle>
                  {history.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistory([])}
                    >
                      {tr.clearHistory}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{lang === 'vi' ? 'Chưa có lịch sử truy vấn' : 'No query history yet'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setQuery(item.query);
                          setDatabase(item.database);
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant={item.status === 'success' ? 'default' : 'destructive'}>
                            {item.database}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.executedAt).toLocaleString()}
                          </span>
                        </div>
                        <pre className="text-sm font-mono bg-muted p-2 rounded overflow-x-auto">
                          {item.query}
                        </pre>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {item.executionTime}ms
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

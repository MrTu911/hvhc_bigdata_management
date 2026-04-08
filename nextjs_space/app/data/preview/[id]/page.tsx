
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BarChart3,
  Settings,
  Download,
  ArrowLeft,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface DataStats {
  totalRows: number;
  totalColumns: number;
  columns: ColumnStats[];
  nullPercentage: number;
  duplicateRows: number;
  qualityScore: number;
  errors: string[];
  warnings: string[];
}

interface ColumnStats {
  name: string;
  index: number;
  type: string;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  sampleValues: any[];
  min?: any;
  max?: any;
}

export default function DataPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [dataset, setDataset] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [stats, setStats] = useState<DataStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      loadPreview();
    }
  }, [session, params.id]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/data/preview/${params.id}?limit=100`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load preview');
      }

      setDataset(result.dataset);
      setPreview(result.preview.data);
      setStats(result.preview.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadPreview();
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-600">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-600">Good</Badge>;
    return <Badge className="bg-red-600">Needs Cleaning</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dataset preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{dataset?.title || dataset?.filename}</h1>
            <p className="text-muted-foreground">
              Uploaded by {dataset?.uploadedBy} on {new Date(dataset?.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => router.push(`/data/edit/${params.id}`)}>
            <Settings className="mr-2 h-4 w-4" />
            Clean & Edit
          </Button>
        </div>
      </div>

      {/* Quality Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Data Quality Overview</span>
              {getQualityBadge(stats.qualityScore)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Quality Score</p>
                <p className={`text-2xl font-bold ${getQualityColor(stats.qualityScore)}`}>
                  {stats.qualityScore.toFixed(1)}/100
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold">{stats.totalRows.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Columns</p>
                <p className="text-2xl font-bold">{stats.totalColumns}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Null Values</p>
                <p className="text-2xl font-bold">{stats.nullPercentage.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duplicates</p>
                <p className="text-2xl font-bold">{stats.duplicateRows}</p>
              </div>
            </div>

            {/* Warnings and Errors */}
            {stats.warnings.length > 0 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Data Quality Warnings:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {stats.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {stats.errors.length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Data Errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {stats.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="preview">
            <FileText className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="schema">
            <BarChart3 className="mr-2 h-4 w-4" />
            Schema
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="mr-2 h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>
                Showing first 100 rows of {stats?.totalRows.toLocaleString()} total rows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {preview && preview[0] && Object.keys(preview[0]).map((key) => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview?.slice(0, 20).map((row: any, idx: number) => (
                      <TableRow key={idx}>
                        {Object.values(row).map((value: any, cellIdx: number) => (
                          <TableCell key={cellIdx}>
                            {value === null || value === undefined || value === '' ? (
                              <span className="text-muted-foreground italic">null</span>
                            ) : (
                              String(value)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {preview && preview.length > 20 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  ... and {preview.length - 20} more rows in preview
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schema Tab */}
        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Column Schema</CardTitle>
              <CardDescription>
                Detected data types and statistics for each column
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Null %</TableHead>
                    <TableHead>Unique Values</TableHead>
                    <TableHead>Sample Values</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.columns.map((col) => (
                    <TableRow key={col.index}>
                      <TableCell className="font-medium">{col.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{col.type.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={col.nullPercentage > 10 ? 'text-red-600' : ''}>
                          {col.nullPercentage.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>{col.uniqueCount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {col.sampleValues.slice(0, 3).join(', ')}
                        {col.sampleValues.length > 3 && '...'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {stats?.columns.map((col) => (
              <Card key={col.index}>
                <CardHeader>
                  <CardTitle className="text-lg">{col.name}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline">{col.type.toUpperCase()}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Unique values:</span>
                    <span className="font-medium">{col.uniqueCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Null count:</span>
                    <span className="font-medium">{col.nullCount} ({col.nullPercentage.toFixed(1)}%)</span>
                  </div>
                  {col.min !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Min:</span>
                      <span className="font-medium">{col.min}</span>
                    </div>
                  )}
                  {col.max !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Max:</span>
                      <span className="font-medium">{col.max}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Sample values:</span>
                    <div className="flex flex-wrap gap-1">
                      {col.sampleValues.map((val, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {String(val)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

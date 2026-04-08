
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Sparkles,
  Save,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface DataStats {
  totalRows: number;
  totalColumns: number;
  nullPercentage: number;
  duplicateRows: number;
  qualityScore: number;
  warnings: string[];
}

export default function DataEditPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [dataset, setDataset] = useState<any>(null);
  const [stats, setStats] = useState<DataStats | null>(null);
  const [error, setError] = useState('');

  // Cleaning options
  const [removeNulls, setRemoveNulls] = useState(false);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [fillNulls, setFillNulls] = useState(false);
  const [fillValue, setFillValue] = useState('');
  const [createVersion, setCreateVersion] = useState(true);

  useEffect(() => {
    if (session) {
      loadStats();
    }
  }, [session, params.id]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');

      // Load dataset info and stats
      const [datasetResponse, statsResponse] = await Promise.all([
        fetch(`/api/data/preview/${params.id}?limit=1`),
        fetch(`/api/data/stats/${params.id}`)
      ]);

      const datasetResult = await datasetResponse.json();
      const statsResult = await statsResponse.json();

      if (!datasetResult.success || !statsResult.success) {
        throw new Error('Failed to load dataset information');
      }

      setDataset(datasetResult.dataset);
      setStats(statsResult.stats);

      // Set default options based on data quality
      if (statsResult.stats.duplicateRows > 0) {
        setRemoveDuplicates(true);
      }
      if (statsResult.stats.nullPercentage > 10) {
        setRemoveNulls(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClean = async () => {
    if (!removeNulls && !removeDuplicates && !fillNulls) {
      toast.error('Please select at least one cleaning option');
      return;
    }

    try {
      setProcessing(true);

      const response = await fetch(`/api/data/clean/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          removeNulls,
          removeDuplicates,
          fillNulls,
          fillValue,
          createVersion
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to clean dataset');
      }

      toast.success(`Dataset cleaned successfully! Quality improved by ${result.changes.qualityImprovement}%`);
      
      // Reload stats
      await loadStats();

      // Optionally navigate to preview
      setTimeout(() => {
        router.push(`/data/preview/${params.id}`);
      }, 1500);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const estimateImprovement = () => {
    if (!stats) return 0;

    let improvement = 0;
    
    if (removeDuplicates && stats.duplicateRows > 0) {
      improvement += 10;
    }
    
    if (removeNulls && stats.nullPercentage > 0) {
      improvement += stats.nullPercentage * 0.5;
    }
    
    if (fillNulls) {
      improvement += stats.nullPercentage * 0.3;
    }

    return Math.min(improvement, 100 - stats.qualityScore);
  };

  const estimatedQuality = stats ? Math.min(100, stats.qualityScore + estimateImprovement()) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dataset information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
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
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Clean & Edit Dataset</h1>
          <p className="text-muted-foreground">{dataset?.title || dataset?.filename}</p>
        </div>
      </div>

      {/* Current Quality */}
      <Card>
        <CardHeader>
          <CardTitle>Current Data Quality</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Quality Score</p>
              <p className="text-2xl font-bold">{stats?.qualityScore.toFixed(1)}/100</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Rows</p>
              <p className="text-2xl font-bold">{stats?.totalRows.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Null Values</p>
              <p className="text-2xl font-bold">{stats?.nullPercentage.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duplicates</p>
              <p className="text-2xl font-bold">{stats?.duplicateRows}</p>
            </div>
          </div>

          {stats && stats.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Issues detected:</p>
                <ul className="list-disc list-inside space-y-1">
                  {stats.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cleaning Options */}
      <Card>
        <CardHeader>
          <CardTitle>Cleaning Options</CardTitle>
          <CardDescription>
            Select the operations you want to perform on this dataset
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Remove Nulls */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="removeNulls"
              checked={removeNulls}
              onCheckedChange={(checked) => setRemoveNulls(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="removeNulls" className="text-base font-medium cursor-pointer">
                Remove rows with null values
              </Label>
              <p className="text-sm text-muted-foreground">
                Removes rows that contain any null, undefined, or empty values
              </p>
              {stats && stats.nullPercentage > 0 && (
                <p className="text-sm text-yellow-600">
                  This will remove approximately {Math.round((stats.nullPercentage / 100) * stats.totalRows)} rows
                </p>
              )}
            </div>
          </div>

          {/* Remove Duplicates */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="removeDuplicates"
              checked={removeDuplicates}
              onCheckedChange={(checked) => setRemoveDuplicates(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="removeDuplicates" className="text-base font-medium cursor-pointer">
                Remove duplicate rows
              </Label>
              <p className="text-sm text-muted-foreground">
                Removes rows that are exact duplicates of other rows
              </p>
              {stats && stats.duplicateRows > 0 && (
                <p className="text-sm text-yellow-600">
                  {stats.duplicateRows} duplicate rows will be removed
                </p>
              )}
            </div>
          </div>

          {/* Fill Nulls */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="fillNulls"
              checked={fillNulls}
              onCheckedChange={(checked) => setFillNulls(checked as boolean)}
            />
            <div className="space-y-2 flex-1">
              <Label htmlFor="fillNulls" className="text-base font-medium cursor-pointer">
                Fill null values with default value
              </Label>
              <p className="text-sm text-muted-foreground">
                Replaces null values with a specified default value
              </p>
              {fillNulls && (
                <Input
                  placeholder="Enter default value (e.g., 0, N/A, Unknown)"
                  value={fillValue}
                  onChange={(e) => setFillValue(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
          </div>

          {/* Create Version */}
          <div className="flex items-start space-x-3 pt-4 border-t">
            <Checkbox
              id="createVersion"
              checked={createVersion}
              onCheckedChange={(checked) => setCreateVersion(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="createVersion" className="text-base font-medium cursor-pointer">
                Create new version (recommended)
              </Label>
              <p className="text-sm text-muted-foreground">
                Saves the cleaned data as a new version and keeps the original intact
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estimated Improvement */}
      {(removeNulls || removeDuplicates || fillNulls) && stats && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Sparkles className="h-5 w-5" />
              Estimated Improvement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Quality</span>
                <span className="font-medium">{stats.qualityScore.toFixed(1)}/100</span>
              </div>
              <Progress value={stats.qualityScore} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Estimated After Cleaning</span>
                <span className="font-medium text-green-700">{estimatedQuality.toFixed(1)}/100</span>
              </div>
              <Progress value={estimatedQuality} className="h-2 bg-green-200" />
            </div>

            <p className="text-sm text-muted-foreground">
              Expected improvement: <span className="font-medium text-green-700">+{estimateImprovement().toFixed(1)} points</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleClean}
          disabled={processing || (!removeNulls && !removeDuplicates && !fillNulls)}
          className="flex-1"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Clean Dataset
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push(`/data/preview/${params.id}`)}
          disabled={processing}
          size="lg"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

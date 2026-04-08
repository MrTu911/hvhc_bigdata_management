'use client';

import { useState, useEffect } from 'react';
import { Cpu, Plus, Play, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

interface TrainingJob {
  id: string;
  jobName: string;
  status: string;
  progress: number;
  currentEpoch?: number;
  totalEpochs?: number;
  duration?: number;
  model: {
    name: string;
    modelType: string;
  };
  createdAt: string;
}

const statusColors: Record<string, string> = {
  QUEUED: 'bg-gray-500',
  RUNNING: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
  FAILED: 'bg-red-500',
  CANCELLED: 'bg-orange-500',
};

export default function TrainingJobsPage() {
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/ml/training');
      const data = await response.json();
      if (data.success) {
        setJobs(data.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Cpu className="h-8 w-8 text-purple-600" />
            Training Jobs
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và theo dõi tiến trình huấn luyện mô hình
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo job huấn luyện
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tổng số jobs</CardDescription>
            <CardTitle className="text-3xl">{jobs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Đang chạy</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {jobs.filter((j) => j.status === 'RUNNING').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Hoàn thành</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {jobs.filter((j) => j.status === 'COMPLETED').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Thất bại</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {jobs.filter((j) => j.status === 'FAILED').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Training Jobs</CardTitle>
          <CardDescription>Theo dõi tiến trình và kết quả huấn luyện</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Đang tải...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <Cpu className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Chưa có training job nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Epoch</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.jobName}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{job.model.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.model.modelType}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[job.status]} text-white`}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {job.status === 'RUNNING' ? (
                          <div className="space-y-1 min-w-[120px]">
                            <Progress value={job.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {job.progress}%
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {job.currentEpoch && job.totalEpochs
                          ? `${job.currentEpoch}/${job.totalEpochs}`
                          : '-'}
                      </TableCell>
                      <TableCell>{formatDuration(job.duration)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

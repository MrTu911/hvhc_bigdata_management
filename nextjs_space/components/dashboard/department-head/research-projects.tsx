
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, DollarSign } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  budget: number | null;
  startDate: Date;
  endDate: Date | null;
  daysRemaining: number | null;
  lead: {
    id: string | undefined;
    name: string | undefined;
  };
  membersCount: number;
}

interface ResearchProjectsProps {
  projects: Project[];
  stats: {
    total: number;
    active: number;
    completed: number;
    totalBudget: number;
    averageProgress: number;
  };
}

export function ResearchProjects({ projects, stats }: ResearchProjectsProps) {
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      ACTIVE: { label: 'Đang thực hiện', variant: 'default' },
      IN_PROGRESS: { label: 'Đang thực hiện', variant: 'default' },
      COMPLETED: { label: 'Hoàn thành', variant: 'secondary' },
      PENDING: { label: 'Chờ phê duyệt', variant: 'outline' },
      CANCELLED: { label: 'Đã hủy', variant: 'destructive' }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatBudget = (budget: number | null) => {
    if (!budget) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(budget);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng dự án</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đang thực hiện</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tiến độ TB</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageProgress)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Không có dự án nghiên cứu
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tiến độ</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{project.lead?.name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">
                        {project.membersCount} thành viên
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{formatBudget(project.budget)}</div>
                      <div className="text-xs text-muted-foreground">Kinh phí</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">
                        {project.daysRemaining !== null 
                          ? `${project.daysRemaining} ngày`
                          : 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">Thời gian còn lại</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

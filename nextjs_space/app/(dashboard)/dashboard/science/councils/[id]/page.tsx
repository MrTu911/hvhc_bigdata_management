'use client';

/**
 * Science Council Detail
 * /dashboard/science/councils/[id]
 *
 * Hiển thị thông tin hội đồng, danh sách thành viên, và các cuộc họp.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Users, Calendar, ExternalLink, ChevronLeft, Building2,
} from 'lucide-react';

interface CouncilMember {
  id: string;
  role: string;
  vote: string | null;
  user: { id: string; name: string; rank?: string };
}

interface CouncilMeeting {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  location?: string;
}

interface Council {
  id: string;
  name: string;
  type: string;
  result: string | null;
  project?: { id: string; title: string };
  members: CouncilMember[];
  meetings?: CouncilMeeting[];
}

const RESULT_CONFIG: Record<string, { label: string; variant: string }> = {
  PASS:   { label: 'Thông qua',     variant: 'default'      },
  FAIL:   { label: 'Không thông qua', variant: 'destructive'  },
  REVISE: { label: 'Cần chỉnh sửa', variant: 'secondary'    },
};

const ROLE_LABEL: Record<string, string> = {
  CHAIRMAN: 'Chủ tịch',
  SECRETARY: 'Thư ký',
  MEMBER: 'Thành viên',
  REVIEWER: 'Phản biện',
};

export default function CouncilDetailPage() {
  const params = useParams<{ id: string }>();
  const [council, setCouncil] = useState<Council | null>(null);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    fetch(`/api/science/councils/${params.id}`)
      .then(r => r.json())
      .then(data => { if (data.success) setCouncil(data.data); })
      .catch(() => toast.error('Không thể tải thông tin hội đồng'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="p-6 text-center text-muted-foreground">Đang tải...</div>;
  if (!council) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground">Không tìm thấy hội đồng</p>
      <Link href="/dashboard/science/councils">
        <Button variant="outline" className="mt-4"><ChevronLeft className="h-4 w-4 mr-1" />Quay lại</Button>
      </Link>
    </div>
  );

  const resultCfg = council.result ? RESULT_CONFIG[council.result] : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/science/councils">
            <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{council.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{council.type}</Badge>
              {resultCfg && <Badge variant={resultCfg.variant as any}>{resultCfg.label}</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Project link */}
      {council.project && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Đề tài:</span>
              <Link href={`/dashboard/science/projects/${council.project.id}`}
                className="font-medium hover:underline text-blue-600">
                {council.project.title}
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-1" />Thành viên ({council.members?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <Calendar className="h-4 w-4 mr-1" />Cuộc họp
          </TabsTrigger>
        </TabsList>

        {/* Members tab */}
        <TabsContent value="members" className="space-y-3 mt-4">
          {(council.members ?? []).length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Chưa có thành viên</p>
          ) : (
            council.members.map(m => (
              <Card key={m.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{m.user.name}</div>
                      <div className="text-sm text-muted-foreground">{ROLE_LABEL[m.role] ?? m.role}</div>
                    </div>
                    {m.vote && (
                      <Badge variant={
                        m.vote === 'PASS' ? 'default' : m.vote === 'FAIL' ? 'destructive' : 'secondary'
                      }>
                        {m.vote}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Meetings tab */}
        <TabsContent value="meetings" className="space-y-3 mt-4">
          {(council.meetings ?? []).length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Chưa có cuộc họp nào</p>
          ) : (
            (council.meetings ?? []).map(meeting => (
              <Card key={meeting.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{meeting.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(meeting.scheduledAt).toLocaleString('vi-VN')}
                        {meeting.location && ` • ${meeting.location}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{meeting.status}</Badge>
                      <Link href={`/dashboard/science/councils/${params.id}/meetings/${meeting.id}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

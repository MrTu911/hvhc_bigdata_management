'use client';

/**
 * Council Meeting Detail
 * /dashboard/science/councils/[id]/meetings/[meetId]
 *
 * Hiển thị chi tiết cuộc họp hội đồng: votes, biên bản.
 * Nếu user là thành viên hội đồng và chưa vote → hiển thị form vote.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronLeft, CheckCircle2, XCircle, Minus } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  location?: string;
  agenda?: string;
  minutes?: string;
}

interface VoteSummary {
  total: number;
  voted: number;
  voteCounts: { PASS: number; FAIL: number; REVISE: number; PENDING: number };
  suggestedResult: 'PASS' | 'FAIL' | null;
  voteDetails: {
    memberId: string;
    userId: string;
    userName: string;
    role: string;
    vote: string | null;
  }[];
}

const VOTE_ICONS: Record<string, React.ReactNode> = {
  PASS: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  FAIL: <XCircle className="h-4 w-4 text-red-500" />,
  REVISE: <Minus className="h-4 w-4 text-amber-500" />,
};

export default function CouncilMeetingDetailPage() {
  const params = useParams<{ id: string; meetId: string }>();
  const [meeting, setMeeting]     = useState<Meeting | null>(null);
  const [voteSummary, setVoteSummary] = useState<VoteSummary | null>(null);
  const [myVote, setMyVote]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/science/councils/${params.id}/meetings/${params.meetId}`).then(r => r.json()),
      fetch(`/api/science/councils/${params.id}?include=votes`).then(r => r.json()),
    ]).then(([meetData, voteData]) => {
      if (meetData.success) setMeeting(meetData.data);
      if (voteData.success?.voteSummary) setVoteSummary(voteData.data.voteSummary);
    }).catch(() => toast.error('Không thể tải thông tin cuộc họp'))
      .finally(() => setLoading(false));
  }, [params.id, params.meetId]);

  async function handleVote() {
    if (!myVote) { toast.error('Vui lòng chọn kết quả bầu'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/science/councils/${params.id}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: myVote, meetingId: params.meetId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Đã ghi nhận phiếu bầu');
      // Reload vote summary
      const voteData = await fetch(`/api/science/councils/${params.id}?include=votes`).then(r => r.json());
      if (voteData.success) setVoteSummary(voteData.data.voteSummary);
    } catch (e: any) {
      toast.error(e.message || 'Bầu phiếu thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-6 text-center text-muted-foreground">Đang tải...</div>;
  if (!meeting) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground">Không tìm thấy cuộc họp</p>
      <Link href={`/dashboard/science/councils/${params.id}`}>
        <Button variant="outline" className="mt-4"><ChevronLeft className="h-4 w-4 mr-1" />Quay lại</Button>
      </Link>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/science/councils/${params.id}`}>
          <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{meeting.title}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(meeting.scheduledAt).toLocaleString('vi-VN')}
            {meeting.location && ` • ${meeting.location}`}
          </p>
        </div>
        <Badge variant="outline">{meeting.status}</Badge>
      </div>

      {/* Agenda / Minutes */}
      {meeting.agenda && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Chương trình họp</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{meeting.agenda}</p></CardContent>
        </Card>
      )}
      {meeting.minutes && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Biên bản</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{meeting.minutes}</p></CardContent>
        </Card>
      )}

      {/* Vote summary */}
      {voteSummary && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Kết quả bầu phiếu ({voteSummary.voted}/{voteSummary.total})
              </CardTitle>
              {voteSummary.suggestedResult && (
                <Badge variant={voteSummary.suggestedResult === 'PASS' ? 'default' : 'destructive'}>
                  Gợi ý: {voteSummary.suggestedResult === 'PASS' ? 'Thông qua' : 'Không thông qua'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4 text-sm">
              <span className="text-green-600 font-medium">PASS: {voteSummary.voteCounts.PASS}</span>
              <span className="text-red-500 font-medium">FAIL: {voteSummary.voteCounts.FAIL}</span>
              <span className="text-amber-500 font-medium">REVISE: {voteSummary.voteCounts.REVISE}</span>
              <span className="text-muted-foreground">Chưa bầu: {voteSummary.voteCounts.PENDING}</span>
            </div>
            <div className="space-y-2">
              {voteSummary.voteDetails.map(d => (
                <div key={d.memberId} className="flex items-center justify-between py-1">
                  <div>
                    <span className="font-medium text-sm">{d.userName}</span>
                    <span className="text-xs text-muted-foreground ml-2">{d.role}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {d.vote ? VOTE_ICONS[d.vote] : <Minus className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-sm">{d.vote ?? 'Chưa bầu'}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit vote (nếu user có thể vote) */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Bỏ phiếu</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Select value={myVote} onValueChange={setMyVote}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Chọn kết quả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PASS">PASS — Thông qua</SelectItem>
                <SelectItem value="FAIL">FAIL — Không thông qua</SelectItem>
                <SelectItem value="REVISE">REVISE — Cần chỉnh sửa</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleVote} disabled={submitting || !myVote}>
              {submitting ? 'Đang gửi...' : 'Bỏ phiếu'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

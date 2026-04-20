'use client';

/**
 * /dashboard/personal/my-graduation
 * Xem trạng thái xét tốt nghiệp — Tầng 2, Học viên/Sinh viên.
 */

import { useEffect, useState } from 'react';
import { GraduationCap, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GraduationAuditItem {
  id: string;
  auditDate: string;
  totalCreditsEarned: number | null;
  gpa: number | null;
  conductEligible: boolean;
  thesisEligible: boolean;
  languageEligible: boolean;
  graduationEligible: boolean;
  failureReasonsJson: unknown;
  status: string;
  decisionNo: string | null;
  approvedAt: string | null;
}

interface DiplomaItem {
  id: string;
  diplomaNo: string | null;
  diplomaType: string;
  classification: string | null;
  issuedAt: string | null;
}

interface GradData {
  hocVien: { id: string; maHocVien: string; diemTrungBinh: number; currentStatus: string } | null;
  audits: GraduationAuditItem[];
  diploma: DiplomaItem | null;
}

function EligibleIcon({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle className="h-4 w-4 text-green-500" />
    : <XCircle className="h-4 w-4 text-red-400" />;
}

export default function MyGraduationPage() {
  const [data, setData] = useState<GradData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/personal/my-graduation')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else setError(res.error ?? 'Không thể tải dữ liệu');
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Đang tải...</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;
  if (!data?.hocVien) {
    return <div className="p-6 text-muted-foreground">Không tìm thấy hồ sơ học viên.</div>;
  }

  const latestAudit = data.audits[0];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6" /> Xét tốt nghiệp
        </h1>
        <p className="text-muted-foreground mt-1">Mã học viên: {data.hocVien.maHocVien}</p>
      </div>

      {/* Bằng tốt nghiệp nếu đã có */}
      {data.diploma && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-green-700">
              <GraduationCap className="h-5 w-5" /> Đã cấp bằng tốt nghiệp
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Loại bằng: <strong>{data.diploma.diplomaType}</strong></div>
            {data.diploma.classification && <div>Xếp loại: <strong>{data.diploma.classification}</strong></div>}
            {data.diploma.diplomaNo && <div>Số bằng: {data.diploma.diplomaNo}</div>}
            {data.diploma.issuedAt && (
              <div>Ngày cấp: {new Date(data.diploma.issuedAt).toLocaleDateString('vi-VN')}</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Kết quả xét tốt nghiệp gần nhất */}
      {latestAudit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Kết quả xét gần nhất</span>
              <Badge variant={latestAudit.graduationEligible ? 'default' : 'destructive'}>
                {latestAudit.graduationEligible ? 'Đủ điều kiện' : 'Chưa đủ'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold">{latestAudit.gpa?.toFixed(2) ?? '—'}</div>
                <div className="text-xs text-muted-foreground">GPA</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{latestAudit.totalCreditsEarned ?? '—'}</div>
                <div className="text-xs text-muted-foreground">Tín chỉ tích lũy</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-2"><EligibleIcon ok={latestAudit.conductEligible} /> Rèn luyện</div>
              <div className="flex items-center gap-2"><EligibleIcon ok={latestAudit.thesisEligible} /> Luận văn</div>
              <div className="flex items-center gap-2"><EligibleIcon ok={latestAudit.languageEligible} /> Ngoại ngữ</div>
            </div>
            {latestAudit.decisionNo && (
              <div className="text-sm text-muted-foreground">Số QĐ: {latestAudit.decisionNo}</div>
            )}
          </CardContent>
        </Card>
      )}

      {data.audits.length === 0 && !data.diploma && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Chưa có kết quả xét tốt nghiệp nào.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransferStatusBadge } from '@/components/party/transfer/transfer-status-badge';

interface TabsProps {
  profile: any;
}

function JsonList({ items }: { items: any[] }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <pre key={idx} className="overflow-x-auto rounded-md border bg-muted/30 p-2 text-xs">
          {JSON.stringify(item, null, 2)}
        </pre>
      ))}
    </div>
  );
}

function ReviewList({ items }: { items: any[] }) {
  if (!items?.length) return <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>;
  return (
    <div className="space-y-2">
      {items.map((x, idx) => {
        const grade = String(x.grade || x.evaluationGrade || '').toUpperCase();
        return (
          <div key={x.id || idx} className="rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium">Năm {x.reviewYear || x.evaluationYear || '-'}</div>
              <Badge variant="secondary">{grade || '-'}</Badge>
            </div>
            <p className="mt-1 text-muted-foreground">{x.comments || x.evaluationNotes || 'Không có nhận xét'}</p>
          </div>
        );
      })}
    </div>
  );
}

function AwardDisciplineList({ items, kind }: { items: any[]; kind: 'award' | 'discipline' }) {
  if (!items?.length) return <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>;
  return (
    <div className="space-y-2">
      {items.map((x, idx) => (
        <div key={x.id || idx} className="rounded-md border p-3 text-sm">
          <div className="font-medium">
            {kind === 'award' ? x.title || 'Khen thưởng' : x.severity || 'Kỷ luật'}
          </div>
          <p className="text-muted-foreground mt-1">
            QĐ: {x.decisionNo || '-'} · Ngày: {x.decisionDate ? new Date(x.decisionDate).toLocaleDateString('vi-VN') : '-'}
          </p>
          {kind === 'discipline' ? <p className="mt-1">Lý do: {x.reason || '-'}</p> : <p className="mt-1">Ghi chú: {x.note || '-'}</p>}
        </div>
      ))}
    </div>
  );
}

function TransferList({ items }: { items: any[] }) {
  if (!items?.length) return <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>;
  return (
    <div className="space-y-2">
      {items.map((x, idx) => (
        <div key={x.id || idx} className="rounded-md border p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium">{x.transferType || x.historyType || 'Chuyển sinh hoạt'}</div>
            <TransferStatusBadge status={x.confirmStatus} />
          </div>
          <p className="text-muted-foreground mt-1">
            Từ: {x.fromPartyOrgName || x.fromOrganization || '-'} → Đến: {x.toPartyOrgName || x.toOrganization || '-'}
          </p>
          <p className="mt-1">Ngày chuyển: {x.transferDate || x.effectiveDate ? new Date(x.transferDate || x.effectiveDate).toLocaleDateString('vi-VN') : '-'}</p>
        </div>
      ))}
    </div>
  );
}

export function PartyMemberProfileTabs({ profile }: TabsProps) {
  const sections = profile?.sections || {};
  const user = profile?.user || {};
  const personnel = profile?.personnel || {};
  const partyMember = profile?.partyMember || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hồ sơ đảng viên 360° (2A-LLĐV)</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ly-lich" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 md:grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="ly-lich">Lý lịch bản thân</TabsTrigger>
            <TabsTrigger value="thong-tin-dang">Thông tin Đảng</TabsTrigger>
            <TabsTrigger value="qua-trinh">Quá trình hoạt động</TabsTrigger>
            <TabsTrigger value="danh-gia">Đánh giá các năm</TabsTrigger>
            <TabsTrigger value="sinh-hoat">Sinh hoạt Đảng</TabsTrigger>
            <TabsTrigger value="dang-phi">Đảng phí</TabsTrigger>
            <TabsTrigger value="kt-kl">Khen thưởng/Kỷ luật</TabsTrigger>
            <TabsTrigger value="chuyen-sh">Chuyển sinh hoạt</TabsTrigger>
            <TabsTrigger value="kiem-tra">Kiểm tra/Giám sát</TabsTrigger>
          </TabsList>

          <TabsContent value="ly-lich" className="space-y-2">
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <p><b>Họ tên:</b> {user.name || personnel.fullName || '-'}</p>
              <p><b>Email:</b> {user.email || '-'}</p>
              <p><b>Mã quân nhân:</b> {user.militaryId || '-'}</p>
              <p><b>Cấp bậc / chức vụ:</b> {user.rank || '-'} / {user.position || '-'}</p>
            </div>
          </TabsContent>

          <TabsContent value="thong-tin-dang" className="space-y-2">
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <p><b>Số thẻ:</b> {partyMember.partyCardNumber || '-'}</p>
              <p><b>Trạng thái:</b> {partyMember.status || '-'}</p>
              <p><b>Ngày dự bị:</b> {partyMember.joinDate ? new Date(partyMember.joinDate).toLocaleDateString('vi-VN') : '-'}</p>
              <p><b>Ngày chính thức:</b> {partyMember.officialDate ? new Date(partyMember.officialDate).toLocaleDateString('vi-VN') : '-'}</p>
            </div>
          </TabsContent>

          <TabsContent value="qua-trinh">
            <p className="text-sm text-muted-foreground mb-2">Nguồn chuẩn: CareerHistory (M02). Hiện hiển thị tối thiểu qua profile tổng hợp.</p>
            <JsonList items={[]} />
          </TabsContent>

          <TabsContent value="danh-gia">
            <ReviewList items={sections.annualReviews || []} />
          </TabsContent>

          <TabsContent value="sinh-hoat">
            <JsonList items={sections.meetingAttendances || []} />
          </TabsContent>

          <TabsContent value="dang-phi">
            <JsonList items={sections.feePayments || []} />
          </TabsContent>

          <TabsContent value="kt-kl" className="space-y-3">
            <div>
              <h4 className="mb-2 text-sm font-semibold">Khen thưởng</h4>
              <AwardDisciplineList items={sections.awards || []} kind="award" />
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold">Kỷ luật</h4>
              <AwardDisciplineList items={sections.disciplines || []} kind="discipline" />
            </div>
          </TabsContent>

          <TabsContent value="chuyen-sh">
            <TransferList items={sections.transfers || []} />
          </TabsContent>

          <TabsContent value="kiem-tra">
            <JsonList items={sections.inspections || []} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

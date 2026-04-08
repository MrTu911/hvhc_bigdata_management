import { Card, CardContent } from '@/components/ui/card';

type Summary = {
  currentGPA: number | null;
  totalCreditsEarned: number;
  conductScore: number | null;
  conductGrade: string | null;
  enrollmentCount: number;
};

export function StudentSummaryCard({ summary }: { summary: Summary }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">GPA</p>
          <p className="text-2xl font-bold text-primary">{summary.currentGPA?.toFixed(2) ?? '—'}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Tín chỉ tích lũy</p>
          <p className="text-2xl font-bold">{summary.totalCreditsEarned}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Điểm rèn luyện (gần nhất)</p>
          <p className="text-2xl font-bold">{summary.conductScore ?? '—'}</p>
          {summary.conductGrade && (
            <p className="text-xs text-muted-foreground">{summary.conductGrade}</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Số học phần đăng ký</p>
          <p className="text-2xl font-bold">{summary.enrollmentCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}

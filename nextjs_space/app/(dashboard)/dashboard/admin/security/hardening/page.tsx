/**
 * M01 – UC-08: Security Hardening Dashboard
 * Trang tổng quan trạng thái bảo mật hệ thống
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  ShieldX,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Key,
  Lock,
  Activity,
  Clock,
  Info,
} from 'lucide-react';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────────────────

interface SecretCheck {
  key: string;
  label: string;
  critical: boolean;
  set: boolean;
  masked: string;
  note: string | null;
}

interface Feature {
  id: string;
  label: string;
  status: 'active' | 'partial' | 'missing';
  detail: string;
}

interface RateLimitConfig {
  name: string;
  windowMinutes: number;
  maxRequests: number;
}

interface HardeningData {
  generatedAt: string;
  environment: string;
  summary: {
    score: number;
    criticalIssues: number;
    warnings: number;
    ok: boolean;
  };
  secrets: SecretCheck[];
  features: Feature[];
  rateLimitConfigs: RateLimitConfig[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function FeatureStatusBadge({ status }: { status: Feature['status'] }) {
  if (status === 'active')
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Active
      </Badge>
    );
  if (status === 'partial')
    return (
      <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
        <AlertTriangle className="w-3 h-3" />
        Partial
      </Badge>
    );
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="w-3 h-3" />
      Missing
    </Badge>
  );
}

function SecretStatusIcon({ set, critical }: { set: boolean; critical: boolean }) {
  if (set) return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  if (critical) return <XCircle className="w-4 h-4 text-red-600" />;
  return <AlertTriangle className="w-4 h-4 text-amber-500" />;
}

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';
  const bgColor =
    score >= 80 ? 'bg-green-100' : score >= 50 ? 'bg-amber-100' : 'bg-red-100';

  return (
    <div className={`flex flex-col items-center justify-center rounded-full w-24 h-24 ${bgColor}`}>
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <span className={`text-xs font-medium ${color}`}>/ 100</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HardeningDashboardPage() {
  const [data, setData] = useState<HardeningData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/security/hardening');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error ?? 'Không tải được dữ liệu');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Quay lại
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Security Hardening Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Trạng thái cấu hình bảo mật hệ thống (UC-08)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : data ? (
          <>
            <Card>
              <CardContent className="pt-4 pb-3 flex items-center gap-4">
                <ScoreGauge score={data.summary.score} />
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Security Score</div>
                  <div className="text-xs mt-1 text-muted-foreground">
                    {data.summary.ok ? 'Tất cả OK' : 'Cần xử lý'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={data.summary.criticalIssues > 0 ? 'border-red-300 bg-red-50/30' : ''}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <ShieldX className="w-4 h-4" />
                  <span className="text-xs font-medium">Critical</span>
                </div>
                <div className="text-3xl font-bold text-red-700">
                  {data.summary.criticalIssues}
                </div>
                <div className="text-xs text-muted-foreground mt-1">vấn đề nghiêm trọng</div>
              </CardContent>
            </Card>

            <Card className={data.summary.warnings > 0 ? 'border-amber-300 bg-amber-50/30' : ''}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-xs font-medium">Cảnh báo</span>
                </div>
                <div className="text-3xl font-bold text-amber-700">{data.summary.warnings}</div>
                <div className="text-xs text-muted-foreground mt-1">cần xem xét</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-medium">Môi trường</span>
                </div>
                <div className="text-lg font-bold capitalize">{data.environment}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(data.generatedAt).toLocaleTimeString('vi-VN')}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Features */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Trạng thái tính năng bảo mật
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tính năng</TableHead>
                  <TableHead className="w-28">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      </TableRow>
                    ))
                  : data?.features.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>
                          <div className="font-medium text-sm">{f.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{f.detail}</div>
                        </TableCell>
                        <TableCell>
                          <FeatureStatusBadge status={f.status} />
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Secrets / Env */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              Cấu hình Env / Secret
            </CardTitle>
            <CardDescription className="text-xs">
              Giá trị thực bị che — chỉ hiển thị trạng thái set/unset
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Giá trị (masked)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      </TableRow>
                    ))
                  : data?.secrets.map((s) => (
                      <TableRow
                        key={s.key}
                        className={
                          !s.set && s.critical
                            ? 'bg-red-50/50 dark:bg-red-900/10'
                            : !s.set
                            ? 'bg-amber-50/50 dark:bg-amber-900/10'
                            : ''
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <SecretStatusIcon set={s.set} critical={s.critical} />
                            <div>
                              <div className="font-mono text-xs font-medium">{s.key}</div>
                              <div className="text-xs text-muted-foreground">{s.label}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">{s.masked}</div>
                          {s.note && (
                            <div className="flex items-start gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400">
                              <Info className="w-3 h-3 shrink-0 mt-0.5" />
                              {s.note}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limit Config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Cấu hình Rate Limiting
          </CardTitle>
          <CardDescription className="text-xs">
            {data && !isLoading
              ? (process.env.REDIS_URL
                  ? 'Backend: Redis (multi-instance safe)'
                  : 'Backend: In-memory — chỉ an toàn với single instance')
              : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data?.rateLimitConfigs.map((cfg) => (
                <div
                  key={cfg.name}
                  className="rounded-lg border bg-muted/30 p-3 space-y-1"
                >
                  <div className="font-mono text-xs font-semibold text-primary">{cfg.name}</div>
                  <div className="text-xl font-bold">{cfg.maxRequests}</div>
                  <div className="text-xs text-muted-foreground">
                    req / {cfg.windowMinutes} phút
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Headers Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Security Headers đang được set
          </CardTitle>
          <CardDescription className="text-xs">
            Được áp dụng tự động bởi middleware.ts trên toàn bộ response
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {[
              { header: 'X-Frame-Options', value: 'DENY', desc: 'Chống clickjacking' },
              { header: 'X-Content-Type-Options', value: 'nosniff', desc: 'Chống MIME sniffing' },
              { header: 'Referrer-Policy', value: 'strict-origin-when-cross-origin', desc: 'Kiểm soát referrer header' },
              { header: 'Permissions-Policy', value: 'camera=(), mic=(), geo=()...', desc: 'Tắt API browser nhạy cảm' },
              { header: 'Content-Security-Policy', value: "default-src 'self'...", desc: 'Whitelist nguồn script/style' },
              { header: 'Strict-Transport-Security', value: 'max-age=31536000 (production)', desc: 'Buộc HTTPS 1 năm' },
            ].map((h) => (
              <div
                key={h.header}
                className="flex items-start gap-3 p-2 rounded-lg bg-muted/30"
              >
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-mono text-xs font-medium">{h.header}</div>
                  <div className="text-xs text-muted-foreground">{h.value}</div>
                  <div className="text-xs text-muted-foreground italic">{h.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

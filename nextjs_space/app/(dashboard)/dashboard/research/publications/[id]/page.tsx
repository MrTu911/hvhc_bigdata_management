'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Trash2,
  Loader2,
  Globe,
  BookOpen,
  FlaskConical,
  Award,
  FileText,
  BookMarked,
  Users,
  Calendar,
  Hash,
  Link2,
  Star,
  Quote,
  Paperclip,
} from 'lucide-react';
import { ScienceAttachmentPanel } from '@/components/science/ScienceAttachmentPanel';

// ─── Constants ────────────────────────────────────────────────────────────────

const PUB_TYPE_LABELS: Record<string, string> = {
  BAI_BAO_QUOC_TE: 'Bài báo quốc tế',
  BAI_BAO_TRONG_NUOC: 'Bài báo trong nước',
  SACH_CHUYEN_KHAO: 'Sách chuyên khảo',
  GIAO_TRINH: 'Giáo trình',
  SANG_KIEN: 'Sáng kiến',
  PATENT: 'Bằng sáng chế',
  BAO_CAO_KH: 'Báo cáo KH',
  LUAN_VAN: 'Luận văn',
  LUAN_AN: 'Luận án',
};

const PUB_TYPE_COLORS: Record<string, string> = {
  BAI_BAO_QUOC_TE: 'bg-blue-100 text-blue-700 border-blue-200',
  BAI_BAO_TRONG_NUOC: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  SACH_CHUYEN_KHAO: 'bg-amber-100 text-amber-700 border-amber-200',
  GIAO_TRINH: 'bg-orange-100 text-orange-700 border-orange-200',
  SANG_KIEN: 'bg-green-100 text-green-700 border-green-200',
  PATENT: 'bg-purple-100 text-purple-700 border-purple-200',
  BAO_CAO_KH: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  LUAN_VAN: 'bg-rose-100 text-rose-700 border-rose-200',
  LUAN_AN: 'bg-pink-100 text-pink-700 border-pink-200',
};

const PUB_TYPE_ICONS: Record<string, React.ElementType> = {
  BAI_BAO_QUOC_TE: Globe,
  BAI_BAO_TRONG_NUOC: FileText,
  SACH_CHUYEN_KHAO: BookMarked,
  GIAO_TRINH: BookOpen,
  SANG_KIEN: FlaskConical,
  PATENT: Award,
  BAO_CAO_KH: FileText,
  LUAN_VAN: BookOpen,
  LUAN_AN: BookOpen,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicationDetail {
  id: string;
  title: string;
  titleEn?: string | null;
  pubType: string;
  publishedYear: number;
  publishedAt?: string | null;
  authorsText?: string | null;
  abstract?: string | null;
  keywords: string[];
  doi?: string | null;
  issn?: string | null;
  isbn?: string | null;
  journal?: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  publisher?: string | null;
  isISI: boolean;
  isScopus: boolean;
  scopusQ?: string | null;
  impactFactor?: number | null;
  ranking?: string | null;
  citationCount: number;
  conferenceName?: string | null;
  proceedingName?: string | null;
  patentNumber?: string | null;
  patentGrantDate?: string | null;
  decisionNumber?: string | null;
  advisorName?: string | null;
  defenseScore?: number | null;
  storageLocation?: string | null;
  fullTextUrl?: string | null;
  coAuthors?: string | null;
  status: string;
  unitId?: string | null;
  author: { id: string; name: string; rank?: string | null; militaryId?: string | null };
  project?: { id: string; projectCode: string; title: string } | null;
  publicationAuthors?: Array<{
    id: string;
    authorName: string;
    authorOrder: number;
    affiliation?: string | null;
    isInternal: boolean;
    user?: { id: string; name: string } | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

// ─── Helper components ────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-3">
      <span className="text-sm text-muted-foreground min-w-40 shrink-0">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [pub, setPub] = useState<PublicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/research/publications/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPub(d.data);
        else toast.error(d.error ?? 'Không tải được chi tiết');
      })
      .catch(() => toast.error('Lỗi kết nối'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/research/publications/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Xóa thất bại');
      toast.success('Đã xóa công bố');
      router.push('/dashboard/research/publications');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pub) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Không tìm thấy công bố</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>
    );
  }

  const TypeIcon = PUB_TYPE_ICONS[pub.pubType] ?? FileText;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/research/publications')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kho công bố
          </Button>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/research/publications/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Sửa
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Xóa
          </Button>
        </div>
      </div>

      {/* Title card */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg ${PUB_TYPE_COLORS[pub.pubType] ?? 'bg-muted'}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <Badge
                variant="outline"
                className={`text-xs mb-2 ${PUB_TYPE_COLORS[pub.pubType] ?? ''}`}
              >
                {PUB_TYPE_LABELS[pub.pubType] ?? pub.pubType}
              </Badge>
              <h1 className="text-xl font-bold leading-snug">{pub.title}</h1>
              {pub.titleEn && (
                <p className="text-sm text-muted-foreground italic mt-1">{pub.titleEn}</p>
              )}
            </div>
          </div>

          {/* Key metrics */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t pt-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {pub.publishedYear}
            </span>
            {pub.authorsText && (
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {pub.authorsText}
              </span>
            )}
            {pub.doi && (
              <a
                href={`https://doi.org/${pub.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-500 hover:underline"
              >
                <Hash className="h-4 w-4" />
                {pub.doi}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {pub.fullTextUrl && (
              <a
                href={pub.fullTextUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-500 hover:underline"
              >
                <Link2 className="h-4 w-4" />
                Toàn văn
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* ISI / Scopus badges */}
          {(pub.isISI || pub.isScopus || pub.scopusQ || pub.impactFactor != null || pub.citationCount > 0) && (
            <div className="flex flex-wrap gap-2">
              {pub.isISI && (
                <Badge className="bg-blue-600 text-white">ISI</Badge>
              )}
              {pub.isScopus && (
                <Badge className="bg-indigo-600 text-white">Scopus</Badge>
              )}
              {pub.scopusQ && (
                <Badge variant="outline" className="border-violet-400 text-violet-700">
                  {pub.scopusQ}
                </Badge>
              )}
              {pub.impactFactor != null && (
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3 w-3" />
                  IF {pub.impactFactor}
                </Badge>
              )}
              {pub.citationCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Quote className="h-3 w-3" />
                  {pub.citationCount} trích dẫn
                </Badge>
              )}
            </div>
          )}

          {/* Keywords */}
          {pub.keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pub.keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Detail info */}
        <div className="md:col-span-2 space-y-6">
          {/* Abstract */}
          {pub.abstract && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tóm tắt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{pub.abstract}</p>
              </CardContent>
            </Card>
          )}

          {/* Publication details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Chi tiết xuất bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Tạp chí / NXB" value={pub.journal} />
              <InfoRow label="Hội nghị" value={pub.conferenceName} />
              <InfoRow label="Proceeding" value={pub.proceedingName} />
              <InfoRow label="Tập / Số / Trang" value={
                [pub.volume && `Tập ${pub.volume}`, pub.issue && `Số ${pub.issue}`, pub.pages && `Tr. ${pub.pages}`]
                  .filter(Boolean).join(' · ') || null
              } />
              <InfoRow label="Nhà xuất bản" value={pub.publisher} />
              <InfoRow label="ISSN" value={pub.issn} />
              <InfoRow label="ISBN" value={pub.isbn} />
              {pub.patentNumber && <>
                <Separator />
                <InfoRow label="Số bằng sáng chế" value={pub.patentNumber} />
                <InfoRow label="Ngày cấp bằng" value={pub.patentGrantDate
                  ? new Date(pub.patentGrantDate).toLocaleDateString('vi-VN')
                  : null
                } />
              </>}
              {pub.decisionNumber && (
                <InfoRow label="Số quyết định" value={pub.decisionNumber} />
              )}
              {pub.advisorName && <>
                <Separator />
                <InfoRow label="Người hướng dẫn" value={pub.advisorName} />
                <InfoRow label="Điểm bảo vệ" value={pub.defenseScore} />
                <InfoRow label="Kho lưu trữ" value={pub.storageLocation} />
              </>}
            </CardContent>
          </Card>

          {/* Authors table (if normalized) */}
          {pub.publicationAuthors && pub.publicationAuthors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Danh sách tác giả</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pub.publicationAuthors
                    .sort((a, b) => a.authorOrder - b.authorOrder)
                    .map((a) => (
                      <div key={a.id} className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground w-6 text-center">{a.authorOrder}.</span>
                        <span className="font-medium">{a.authorName}</span>
                        {a.isInternal && (
                          <Badge variant="outline" className="text-[10px]">Nội bộ</Badge>
                        )}
                        {a.affiliation && (
                          <span className="text-muted-foreground text-xs">({a.affiliation})</span>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Meta */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Thông tin kê khai</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Người kê khai</p>
                <p className="text-sm font-medium mt-0.5">
                  {pub.author.rank ? `${pub.author.rank} ` : ''}{pub.author.name}
                </p>
                {pub.author.militaryId && (
                  <p className="text-xs text-muted-foreground">{pub.author.militaryId}</p>
                )}
              </div>
              {pub.project && (
                <div>
                  <p className="text-xs text-muted-foreground">Đề tài liên kết</p>
                  <Link
                    href={`/dashboard/research/projects/${pub.project.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline mt-0.5 block"
                  >
                    {pub.project.projectCode}
                  </Link>
                  <p className="text-xs text-muted-foreground line-clamp-2">{pub.project.title}</p>
                </div>
              )}
              <Separator />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Tạo: {new Date(pub.createdAt).toLocaleDateString('vi-VN')}</p>
                <p>Cập nhật: {new Date(pub.updatedAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Ranking / Impact */}
          {(pub.ranking || pub.impactFactor != null || pub.citationCount > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Chỉ số khoa học</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Phân hạng" value={pub.scopusQ ?? pub.ranking} />
                <InfoRow label="Impact Factor" value={pub.impactFactor} />
                <InfoRow label="Số trích dẫn" value={pub.citationCount > 0 ? pub.citationCount : null} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tài liệu minh chứng */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Paperclip className="h-4 w-4" /> Tài liệu minh chứng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScienceAttachmentPanel
            entityType="PUBLICATION"
            entityId={id}
            allowUpload={false}
            allowDelete={false}
          />
        </CardContent>
      </Card>

      {/* Delete confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa công bố <strong>"{pub.title}"</strong>?
            Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

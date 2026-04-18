'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen, ArrowLeft, Shield, ShieldAlert, ShieldCheck,
  User, ExternalLink, Trash2, Pencil, Paperclip,
} from 'lucide-react';
import { ScienceAttachmentPanel } from '@/components/science/ScienceAttachmentPanel';

// ─── Constants ─────────────────────────────────────────────────────────────────

const WORK_TYPE_LABELS: Record<string, string> = {
  TEXTBOOK:   'Giáo trình',
  BOOK:       'Sách chuyên khảo',
  MONOGRAPH:  'Chuyên đề',
  REFERENCE:  'Tài liệu tham khảo',
  CURRICULUM: 'Chương trình',
};

const WORK_TYPE_COLOR: Record<string, string> = {
  TEXTBOOK:   'bg-blue-100 text-blue-700',
  BOOK:       'bg-violet-100 text-violet-700',
  MONOGRAPH:  'bg-indigo-100 text-indigo-700',
  REFERENCE:  'bg-teal-100 text-teal-700',
  CURRICULUM: 'bg-emerald-100 text-emerald-700',
};

const AUTHOR_ROLE_LABELS: Record<string, string> = {
  LEAD:      'Tác giả chính',
  CO_AUTHOR: 'Đồng tác giả',
  EDITOR:    'Biên tập',
  REVIEWER:  'Phản biện',
};

const SENSITIVITY_CONFIG: Record<string, { label: string; cls: string; Icon: typeof Shield }> = {
  NORMAL:       { label: 'Thường',   cls: 'bg-gray-100 text-gray-600',   Icon: Shield },
  CONFIDENTIAL: { label: 'Bảo mật', cls: 'bg-amber-100 text-amber-700', Icon: ShieldAlert },
  SECRET:       { label: 'MẬT',     cls: 'bg-red-100 text-red-700',     Icon: ShieldCheck },
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface WorkAuthor {
  id:          string;
  authorName:  string;
  role:        string;
  orderNum:    number;
  affiliation: string | null;
  scientistId: string | null;
}

interface ScientificWork {
  id:          string;
  code:        string;
  type:        string;
  title:       string;
  subtitle:    string | null;
  isbn:        string | null;
  issn:        string | null;
  doi:         string | null;
  journalName: string | null;
  year:        number;
  edition:     number;
  sensitivity: string;
  createdAt:   string;
  updatedAt:   string;
  authors:     WorkAuthor[];
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SensitivityBadge({ level }: { level: string }) {
  const cfg = SENSITIVITY_CONFIG[level] ?? SENSITIVITY_CONFIG.NORMAL;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [work, setWork]       = useState<ScientificWork | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/science/works/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Không tìm thấy công trình');
        const json = await res.json();
        setWork(json.data);
      })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Xóa công trình này? Hành động không thể hoàn tác.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/science/works/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Xóa thất bại');
      }
      toast.success('Đã xóa công trình');
      router.push('/dashboard/science/works');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400 text-sm">Đang tải...</div>;
  }

  if (!work) {
    return (
      <div className="p-8 text-center">
        <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Không tìm thấy công trình</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard/science/works"><ArrowLeft size={14} className="mr-1" /> Quay lại</Link>
        </Button>
      </div>
    );
  }

  const typeCls = WORK_TYPE_COLOR[work.type] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb / back */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/science/works" className="hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft size={14} /> Công trình KH
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{work.code}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeCls}`}>
              {WORK_TYPE_LABELS[work.type] ?? work.type}
            </span>
            <SensitivityBadge level={work.sensitivity} />
            <span className="text-xs text-gray-400 font-mono">{work.code}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{work.title}</h1>
          {work.subtitle && (
            <p className="text-gray-500 text-sm">{work.subtitle}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/science/works/${id}/edit`}>
              <Pencil size={14} className="mr-1" /> Sửa
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50"
            disabled={deleting}
            onClick={handleDelete}
          >
            <Trash2 size={14} className="mr-1" />
            {deleting ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Thông tin xuất bản</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            <Field label="Năm xuất bản" value={work.year} />
            <Field label="Lần xuất bản" value={`Lần ${work.edition}`} />
            {work.journalName && <Field label="Tạp chí / Nhà XB" value={work.journalName} />}
            {work.doi && (
              <div>
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">DOI</dt>
                <dd className="mt-0.5">
                  <a
                    href={`https://doi.org/${work.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline font-mono flex items-center gap-1"
                  >
                    {work.doi} <ExternalLink size={11} />
                  </a>
                </dd>
              </div>
            )}
            {work.isbn && <Field label="ISBN" value={<span className="font-mono">{work.isbn}</span>} />}
            {work.issn && <Field label="ISSN" value={<span className="font-mono">{work.issn}</span>} />}
            <Field
              label="Cập nhật"
              value={new Date(work.updatedAt).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
              })}
            />
          </dl>
        </CardContent>
      </Card>

      {/* Authors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User size={16} className="text-gray-500" />
            Tác giả ({work.authors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {work.authors.length === 0 ? (
            <p className="text-sm text-gray-400">Chưa có thông tin tác giả.</p>
          ) : (
            <ol className="space-y-3">
              {work.authors.map((author, idx) => (
                <li key={author.id} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{author.authorName}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {AUTHOR_ROLE_LABELS[author.role] ?? author.role}
                      </span>
                      {author.affiliation && (
                        <span className="text-xs text-gray-400">{author.affiliation}</span>
                      )}
                      {author.scientistId && (
                        <Link
                          href={`/dashboard/science/resources/scientists/${author.scientistId}`}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Xem hồ sơ
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Tài liệu đính kèm (bản thảo, giấy chấp nhận, bằng sáng kiến...) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4" /> Tài liệu đính kèm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScienceAttachmentPanel
            entityType="PUBLICATION"
            entityId={id}
            allowUpload
            allowDelete
          />
        </CardContent>
      </Card>
    </div>
  );
}

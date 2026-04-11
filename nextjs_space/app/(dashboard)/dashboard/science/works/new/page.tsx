'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, BookOpen, Download, Plus, Trash2, AlertTriangle, CheckCircle2, Loader2,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const WORK_TYPES = [
  { value: 'TEXTBOOK',   label: 'Giáo trình' },
  { value: 'BOOK',       label: 'Sách chuyên khảo' },
  { value: 'MONOGRAPH',  label: 'Chuyên đề' },
  { value: 'REFERENCE',  label: 'Tài liệu tham khảo' },
  { value: 'CURRICULUM', label: 'Chương trình' },
];

const AUTHOR_ROLES = [
  { value: 'LEAD',      label: 'Tác giả chính' },
  { value: 'CO_AUTHOR', label: 'Đồng tác giả' },
  { value: 'EDITOR',    label: 'Biên tập' },
  { value: 'REVIEWER',  label: 'Phản biện' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AuthorRow {
  authorName:  string;
  role:        string;
  affiliation: string;
}

interface DuplicateMatch {
  id:         string;
  code:       string;
  title:      string;
  doi:        string | null;
  year:       number;
  similarity: number;
}

// ─── Author Rows ───────────────────────────────────────────────────────────────

function AuthorRows({
  authors,
  onChange,
}: {
  authors: AuthorRow[];
  onChange: (rows: AuthorRow[]) => void;
}) {
  const add = () =>
    onChange([...authors, { authorName: '', role: 'CO_AUTHOR', affiliation: '' }]);

  const remove = (idx: number) =>
    onChange(authors.filter((_, i) => i !== idx));

  const update = (idx: number, field: keyof AuthorRow, value: string) => {
    const next = [...authors];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {authors.map((a, idx) => (
        <div key={idx} className="flex gap-2 items-start">
          <span className="text-xs text-gray-400 mt-2.5 w-5 flex-shrink-0">{idx + 1}.</span>
          <Input
            placeholder="Họ và tên tác giả"
            value={a.authorName}
            onChange={(e) => update(idx, 'authorName', e.target.value)}
            className="flex-1"
          />
          <Select value={a.role} onValueChange={(v) => update(idx, 'role', v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {AUTHOR_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Đơn vị / Cơ quan"
            value={a.affiliation}
            onChange={(e) => update(idx, 'affiliation', e.target.value)}
            className="w-44"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-500 mt-0.5"
            disabled={authors.length <= 1}
            onClick={() => remove(idx)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus size={14} className="mr-1" /> Thêm tác giả
      </Button>
    </div>
  );
}

// ─── CrossRef Import Panel ─────────────────────────────────────────────────────

function CrossrefImportPanel({ onImported }: { onImported: (data: any) => void }) {
  const [doi, setDoi]     = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ success: boolean; message: string } | null>(null);

  const doImport = async () => {
    const trimmed = doi.trim();
    if (!trimmed) { toast.error('Nhập DOI trước'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/science/works/import-crossref', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doi: trimmed }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setResult({ success: false, message: json.error ?? 'Import thất bại' });
        return;
      }
      setResult({ success: true, message: `Đã import: ${json.data?.title}` });
      onImported(json.data);
    } catch {
      setResult({ success: false, message: 'Lỗi kết nối CrossRef' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
          <Download size={15} /> Import metadata từ CrossRef / DOI
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="VD: 10.1016/j.example.2024.01.001"
            value={doi}
            onChange={(e) => setDoi(e.target.value)}
            className="font-mono text-sm"
          />
          <Button onClick={doImport} disabled={loading} size="sm" className="flex-shrink-0">
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Import'}
          </Button>
        </div>
        {result && (
          <div className={`flex items-start gap-2 text-sm rounded-lg p-2 ${result.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
            {result.success
              ? <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" />
              : <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />}
            <span>{result.message}</span>
          </div>
        )}
        <p className="text-xs text-blue-600">
          Import sẽ tự điền tiêu đề, tác giả, loại công trình, năm và DOI vào form bên dưới.
          Bạn có thể chỉnh sửa trước khi lưu.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Duplicate Check Panel ─────────────────────────────────────────────────────

function DuplicateCheckPanel({ title }: { title: string }) {
  const [checking, setChecking] = useState(false);
  const [matches, setMatches]   = useState<DuplicateMatch[] | null>(null);

  const check = async () => {
    if (!title.trim() || title.trim().length < 5) {
      toast.error('Nhập tiêu đề trước (ít nhất 5 ký tự)');
      return;
    }
    setChecking(true);
    setMatches(null);
    try {
      const res = await fetch('/api/science/works/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      const json = await res.json();
      setMatches(json.data?.matches ?? []);
    } catch {
      toast.error('Kiểm tra trùng lặp thất bại');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-amber-800 flex items-center gap-2">
          <AlertTriangle size={15} /> Kiểm tra trùng lặp
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <Button onClick={check} disabled={checking} variant="outline" size="sm" className="border-amber-400 text-amber-800">
          {checking ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
          {checking ? 'Đang kiểm tra...' : 'Kiểm tra ngay'}
        </Button>
        {matches !== null && matches.length === 0 && (
          <p className="text-sm text-emerald-700 flex items-center gap-1">
            <CheckCircle2 size={14} /> Không phát hiện trùng lặp.
          </p>
        )}
        {matches && matches.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-700">
              Phát hiện {matches.length} công trình tương tự:
            </p>
            {matches.map((m) => (
              <div key={m.id} className="bg-white rounded border border-red-200 p-2 text-xs">
                <div className="font-medium text-gray-900">{m.title}</div>
                <div className="text-gray-400 flex gap-3 mt-0.5">
                  <span>{m.code}</span>
                  <span>Năm {m.year}</span>
                  <span className="font-semibold text-red-600">
                    Độ tương đồng: {(m.similarity * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-amber-700">
          Sử dụng so sánh tên tiêu đề. Phase 5 sẽ nâng cấp bằng vector embedding.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewWorkPage() {
  const router = useRouter();

  const [title,       setTitle]       = useState('');
  const [subtitle,    setSubtitle]    = useState('');
  const [type,        setType]        = useState('TEXTBOOK');
  const [year,        setYear]        = useState(CURRENT_YEAR);
  const [edition,     setEdition]     = useState(1);
  const [doi,         setDoi]         = useState('');
  const [isbn,        setIsbn]        = useState('');
  const [issn,        setIssn]        = useState('');
  const [journalName, setJournalName] = useState('');
  const [sensitivity, setSensitivity] = useState('NORMAL');
  const [authors,     setAuthors]     = useState<AuthorRow[]>([
    { authorName: '', role: 'LEAD', affiliation: '' },
  ]);
  const [saving, setSaving] = useState(false);

  // Fill form from CrossRef import
  const handleImported = (data: any) => {
    if (!data) return;
    setTitle(data.title ?? '');
    setSubtitle(data.subtitle ?? '');
    setType(data.type ?? 'BOOK');
    setYear(data.year ?? CURRENT_YEAR);
    setDoi(data.doi ?? '');
    setIsbn(data.isbn ?? '');
    setIssn(data.issn ?? '');
    setJournalName(data.journalName ?? '');
    if (Array.isArray(data.authors) && data.authors.length > 0) {
      setAuthors(
        data.authors.map((a: any, idx: number) => ({
          authorName:  a.authorName ?? '',
          role:        idx === 0 ? 'LEAD' : 'CO_AUTHOR',
          affiliation: a.affiliation ?? '',
        }))
      );
    }
    toast.success('Đã điền metadata từ CrossRef vào form');
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Tiêu đề không được trống'); return; }
    if (authors.some((a) => !a.authorName.trim())) {
      toast.error('Tên tác giả không được trống');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/science/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       title.trim(),
          subtitle:    subtitle.trim() || undefined,
          type,
          year,
          edition,
          doi:         doi.trim() || undefined,
          isbn:        isbn.trim() || undefined,
          issn:        issn.trim() || undefined,
          journalName: journalName.trim() || undefined,
          sensitivity,
          authors: authors.map((a, idx) => ({
            authorName:  a.authorName.trim(),
            role:        a.role,
            orderNum:    idx + 1,
            affiliation: a.affiliation.trim() || undefined,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Lưu thất bại');

      toast.success('Đã thêm công trình thành công');
      router.push(`/dashboard/science/works/${json.data.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/science/works" className="hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft size={14} /> Công trình KH
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Thêm mới</span>
      </div>

      <div className="flex items-center gap-2">
        <BookOpen size={22} className="text-violet-600" />
        <h1 className="text-xl font-bold text-gray-900">Thêm công trình khoa học</h1>
      </div>

      {/* CrossRef import */}
      <CrossrefImportPanel onImported={handleImported} />

      {/* Main form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Thông tin công trình</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên sách / giáo trình / chuyên đề..."
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề phụ</label>
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Tùy chọn"
            />
          </div>

          {/* Type + Year + Edition row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại <span className="text-red-500">*</span>
              </label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Năm xuất bản <span className="text-red-500">*</span>
              </label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lần xuất bản</label>
              <Input
                type="number"
                min={1}
                value={edition}
                onChange={(e) => setEdition(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>

          {/* DOI + ISBN + ISSN */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DOI</label>
              <Input
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                placeholder="10.xxxx/..."
                className="font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
              <Input
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-..."
                className="font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ISSN</label>
              <Input
                value={issn}
                onChange={(e) => setIssn(e.target.value)}
                placeholder="XXXX-XXXX"
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Journal / Publisher */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tạp chí / Nhà xuất bản</label>
            <Input
              value={journalName}
              onChange={(e) => setJournalName(e.target.value)}
              placeholder="Tên tạp chí hoặc nhà xuất bản"
            />
          </div>

          {/* Sensitivity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phân loại bảo mật</label>
            <Select value={sensitivity} onValueChange={setSensitivity}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NORMAL">Thường</SelectItem>
                <SelectItem value="CONFIDENTIAL">Bảo mật</SelectItem>
                <SelectItem value="SECRET">MẬT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Authors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Danh sách tác giả <span className="text-red-500">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AuthorRows authors={authors} onChange={setAuthors} />
        </CardContent>
      </Card>

      {/* Duplicate check */}
      <DuplicateCheckPanel title={title} />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
          {saving ? 'Đang lưu...' : 'Lưu công trình'}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/science/works">Hủy</Link>
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X, Loader2, BookOpen } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const PUB_TYPE_OPTIONS = [
  { value: 'BAI_BAO_QUOC_TE', label: 'Bài báo quốc tế (ISI/Scopus)', group: 'Bài báo' },
  { value: 'BAI_BAO_TRONG_NUOC', label: 'Bài báo trong nước', group: 'Bài báo' },
  { value: 'SACH_CHUYEN_KHAO', label: 'Sách chuyên khảo', group: 'Sách' },
  { value: 'GIAO_TRINH', label: 'Giáo trình', group: 'Sách' },
  { value: 'SANG_KIEN', label: 'Sáng kiến kinh nghiệm', group: 'Sáng kiến' },
  { value: 'PATENT', label: 'Bằng sáng chế / Giải pháp hữu ích', group: 'Sáng kiến' },
  { value: 'BAO_CAO_KH', label: 'Báo cáo KH hội nghị / hội thảo', group: 'Báo cáo' },
  { value: 'LUAN_VAN', label: 'Luận văn thạc sĩ', group: 'Luận văn / Luận án' },
  { value: 'LUAN_AN', label: 'Luận án tiến sĩ', group: 'Luận văn / Luận án' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

// ─── Which fields to show per type ────────────────────────────────────────────

const TYPE_FIELDS: Record<string, string[]> = {
  BAI_BAO_QUOC_TE: ['doi', 'issn', 'journal', 'volume', 'issue', 'pages', 'isi', 'scopus', 'scopusQ', 'impactFactor', 'ranking', 'citationCount', 'fullTextUrl'],
  BAI_BAO_TRONG_NUOC: ['issn', 'journal', 'volume', 'issue', 'pages', 'fullTextUrl'],
  SACH_CHUYEN_KHAO: ['isbn', 'publisher', 'fullTextUrl'],
  GIAO_TRINH: ['isbn', 'publisher', 'decisionNumber', 'fullTextUrl'],
  SANG_KIEN: ['decisionNumber', 'fullTextUrl'],
  PATENT: ['patentNumber', 'patentGrantDate'],
  BAO_CAO_KH: ['conferenceName', 'proceedingName', 'isbn', 'issn', 'pages', 'fullTextUrl'],
  LUAN_VAN: ['advisorName', 'defenseScore', 'storageLocation', 'fullTextUrl'],
  LUAN_AN: ['advisorName', 'defenseScore', 'storageLocation', 'fullTextUrl'],
};

function has(type: string, field: string): boolean {
  return (TYPE_FIELDS[type] ?? []).includes(field);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewPublicationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');

  const [form, setForm] = useState({
    title: '',
    titleEn: '',
    pubType: '',
    publishedYear: String(CURRENT_YEAR),
    authorsText: '',
    abstract: '',
    keywords: [] as string[],
    doi: '',
    issn: '',
    isbn: '',
    journal: '',
    volume: '',
    issue: '',
    pages: '',
    publisher: '',
    publishedAt: '',
    isISI: false,
    isScopus: false,
    scopusQ: '',
    impactFactor: '',
    ranking: '',
    citationCount: '',
    conferenceName: '',
    proceedingName: '',
    patentNumber: '',
    patentGrantDate: '',
    decisionNumber: '',
    advisorName: '',
    defenseScore: '',
    storageLocation: '',
    fullTextUrl: '',
    projectId: '',
  });

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !form.keywords.includes(kw)) {
      set('keywords', [...form.keywords, kw]);
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) =>
    set('keywords', form.keywords.filter((k) => k !== kw));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pubType) { toast.error('Chọn loại công bố'); return; }
    if (!form.title.trim()) { toast.error('Nhập tiêu đề'); return; }
    if (!form.publishedYear) { toast.error('Chọn năm công bố'); return; }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        titleEn: form.titleEn || null,
        pubType: form.pubType,
        publishedYear: Number(form.publishedYear),
        authorsText: form.authorsText || null,
        abstract: form.abstract || null,
        keywords: form.keywords,
        isISI: form.isISI,
        isScopus: form.isScopus,
        citationCount: form.citationCount ? Number(form.citationCount) : 0,
        projectId: form.projectId || null,
        fullTextUrl: form.fullTextUrl || null,
      };

      // Type-specific fields
      if (has(form.pubType, 'doi')) payload.doi = form.doi || null;
      if (has(form.pubType, 'issn')) payload.issn = form.issn || null;
      if (has(form.pubType, 'isbn')) payload.isbn = form.isbn || null;
      if (has(form.pubType, 'journal')) payload.journal = form.journal || null;
      if (has(form.pubType, 'volume')) payload.volume = form.volume || null;
      if (has(form.pubType, 'issue')) payload.issue = form.issue || null;
      if (has(form.pubType, 'pages')) payload.pages = form.pages || null;
      if (has(form.pubType, 'publisher') || form.pubType === 'SACH_CHUYEN_KHAO' || form.pubType === 'GIAO_TRINH')
        payload.publisher = form.publisher || null;
      if (has(form.pubType, 'scopusQ')) payload.scopusQ = form.scopusQ || null;
      if (has(form.pubType, 'impactFactor')) payload.impactFactor = form.impactFactor ? Number(form.impactFactor) : null;
      if (has(form.pubType, 'ranking')) payload.ranking = form.ranking || null;
      if (has(form.pubType, 'conferenceName')) payload.conferenceName = form.conferenceName || null;
      if (has(form.pubType, 'proceedingName')) payload.proceedingName = form.proceedingName || null;
      if (has(form.pubType, 'patentNumber')) payload.patentNumber = form.patentNumber || null;
      if (has(form.pubType, 'patentGrantDate')) payload.patentGrantDate = form.patentGrantDate || null;
      if (has(form.pubType, 'decisionNumber')) payload.decisionNumber = form.decisionNumber || null;
      if (has(form.pubType, 'advisorName')) payload.advisorName = form.advisorName || null;
      if (has(form.pubType, 'defenseScore')) payload.defenseScore = form.defenseScore ? Number(form.defenseScore) : null;
      if (has(form.pubType, 'storageLocation')) payload.storageLocation = form.storageLocation || null;

      const res = await fetch('/api/research/publications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Tạo thất bại');
      toast.success('Thêm công bố thành công');
      router.push(`/dashboard/research/publications/${data.data.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Lỗi khi tạo công bố');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-xl font-bold">Thêm công bố khoa học</h1>
          <p className="text-sm text-muted-foreground">Điền thông tin theo loại công bố</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Cơ bản */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Thông tin cơ bản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Loại công bố <span className="text-destructive">*</span></Label>
                <Select value={form.pubType} onValueChange={(v) => set('pubType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PUB_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label>Tiêu đề <span className="text-destructive">*</span></Label>
                <Input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Tên công trình, bài báo, sách..."
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label>Tiêu đề tiếng Anh</Label>
                <Input
                  value={form.titleEn}
                  onChange={(e) => set('titleEn', e.target.value)}
                  placeholder="English title (optional)"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Năm công bố <span className="text-destructive">*</span></Label>
                <Select value={form.publishedYear} onValueChange={(v) => set('publishedYear', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Mã đề tài liên kết</Label>
                <Input
                  value={form.projectId}
                  onChange={(e) => set('projectId', e.target.value)}
                  placeholder="ID đề tài NCKH (nếu có)"
                />
              </div>
            </div>

            {/* Authors */}
            <div className="space-y-1.5">
              <Label>Danh sách tác giả</Label>
              <Input
                value={form.authorsText}
                onChange={(e) => set('authorsText', e.target.value)}
                placeholder="Nguyễn Văn A, Trần Thị B, ..."
              />
            </div>

            {/* Keywords */}
            <div className="space-y-1.5">
              <Label>Từ khóa</Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                  placeholder="Nhập từ khóa và Enter"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addKeyword}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="gap-1">
                      {kw}
                      <button type="button" onClick={() => removeKeyword(kw)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Abstract */}
            <div className="space-y-1.5">
              <Label>Tóm tắt</Label>
              <Textarea
                rows={4}
                value={form.abstract}
                onChange={(e) => set('abstract', e.target.value)}
                placeholder="Tóm tắt nội dung công bố..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Type-specific fields */}
        {form.pubType && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {has(form.pubType, 'doi') && (
                  <div className="space-y-1.5">
                    <Label>DOI</Label>
                    <Input value={form.doi} onChange={(e) => set('doi', e.target.value)} placeholder="10.xxxx/..." />
                  </div>
                )}
                {has(form.pubType, 'issn') && (
                  <div className="space-y-1.5">
                    <Label>ISSN</Label>
                    <Input value={form.issn} onChange={(e) => set('issn', e.target.value)} placeholder="1234-5678" />
                  </div>
                )}
                {has(form.pubType, 'isbn') && (
                  <div className="space-y-1.5">
                    <Label>ISBN</Label>
                    <Input value={form.isbn} onChange={(e) => set('isbn', e.target.value)} placeholder="978-..." />
                  </div>
                )}
                {has(form.pubType, 'journal') && (
                  <div className="col-span-2 space-y-1.5">
                    <Label>Tên tạp chí</Label>
                    <Input value={form.journal} onChange={(e) => set('journal', e.target.value)} placeholder="Journal of ..." />
                  </div>
                )}
                {has(form.pubType, 'conferenceName') && (
                  <div className="col-span-2 space-y-1.5">
                    <Label>Tên hội nghị / hội thảo</Label>
                    <Input value={form.conferenceName} onChange={(e) => set('conferenceName', e.target.value)} />
                  </div>
                )}
                {has(form.pubType, 'proceedingName') && (
                  <div className="col-span-2 space-y-1.5">
                    <Label>Tên Proceeding</Label>
                    <Input value={form.proceedingName} onChange={(e) => set('proceedingName', e.target.value)} />
                  </div>
                )}
                {(has(form.pubType, 'volume') || has(form.pubType, 'issue')) && (
                  <>
                    {has(form.pubType, 'volume') && (
                      <div className="space-y-1.5">
                        <Label>Tập (Volume)</Label>
                        <Input value={form.volume} onChange={(e) => set('volume', e.target.value)} />
                      </div>
                    )}
                    {has(form.pubType, 'issue') && (
                      <div className="space-y-1.5">
                        <Label>Số (Issue)</Label>
                        <Input value={form.issue} onChange={(e) => set('issue', e.target.value)} />
                      </div>
                    )}
                  </>
                )}
                {has(form.pubType, 'pages') && (
                  <div className="space-y-1.5">
                    <Label>Trang</Label>
                    <Input value={form.pages} onChange={(e) => set('pages', e.target.value)} placeholder="1-10" />
                  </div>
                )}
                {(has(form.pubType, 'publisher') || form.pubType === 'SACH_CHUYEN_KHAO' || form.pubType === 'GIAO_TRINH') && (
                  <div className="space-y-1.5">
                    <Label>Nhà xuất bản</Label>
                    <Input value={form.publisher} onChange={(e) => set('publisher', e.target.value)} />
                  </div>
                )}
                {has(form.pubType, 'decisionNumber') && (
                  <div className="space-y-1.5">
                    <Label>Số quyết định công nhận</Label>
                    <Input value={form.decisionNumber} onChange={(e) => set('decisionNumber', e.target.value)} />
                  </div>
                )}
                {has(form.pubType, 'patentNumber') && (
                  <div className="space-y-1.5">
                    <Label>Số bằng sáng chế</Label>
                    <Input value={form.patentNumber} onChange={(e) => set('patentNumber', e.target.value)} />
                  </div>
                )}
                {has(form.pubType, 'patentGrantDate') && (
                  <div className="space-y-1.5">
                    <Label>Ngày cấp bằng</Label>
                    <Input type="date" value={form.patentGrantDate} onChange={(e) => set('patentGrantDate', e.target.value)} />
                  </div>
                )}
                {has(form.pubType, 'advisorName') && (
                  <div className="col-span-2 space-y-1.5">
                    <Label>Người hướng dẫn</Label>
                    <Input value={form.advisorName} onChange={(e) => set('advisorName', e.target.value)} />
                  </div>
                )}
                {has(form.pubType, 'defenseScore') && (
                  <div className="space-y-1.5">
                    <Label>Điểm bảo vệ (0–10)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={form.defenseScore}
                      onChange={(e) => set('defenseScore', e.target.value)}
                    />
                  </div>
                )}
                {has(form.pubType, 'storageLocation') && (
                  <div className="space-y-1.5">
                    <Label>Vị trí lưu trữ</Label>
                    <Input value={form.storageLocation} onChange={(e) => set('storageLocation', e.target.value)} placeholder="Thư viện, kho..." />
                  </div>
                )}
              </div>

              {/* ISI/Scopus section */}
              {has(form.pubType, 'isi') && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isISI"
                      checked={form.isISI}
                      onCheckedChange={(v) => set('isISI', !!v)}
                    />
                    <Label htmlFor="isISI">Được xếp hạng ISI</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isScopus"
                      checked={form.isScopus}
                      onCheckedChange={(v) => set('isScopus', !!v)}
                    />
                    <Label htmlFor="isScopus">Được xếp hạng Scopus</Label>
                  </div>
                  {has(form.pubType, 'scopusQ') && (
                    <div className="space-y-1.5">
                      <Label>Phân hạng (Q1/Q2/Q3/Q4)</Label>
                      <Select value={form.scopusQ} onValueChange={(v) => set('scopusQ', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Không xếp hạng</SelectItem>
                          <SelectItem value="Q1">Q1</SelectItem>
                          <SelectItem value="Q2">Q2</SelectItem>
                          <SelectItem value="Q3">Q3</SelectItem>
                          <SelectItem value="Q4">Q4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {has(form.pubType, 'impactFactor') && (
                    <div className="space-y-1.5">
                      <Label>Impact Factor</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.001}
                        value={form.impactFactor}
                        onChange={(e) => set('impactFactor', e.target.value)}
                        placeholder="Ví dụ: 3.142"
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>Số trích dẫn</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.citationCount}
                      onChange={(e) => set('citationCount', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* URL */}
              {has(form.pubType, 'fullTextUrl') && (
                <div className="space-y-1.5 pt-2 border-t">
                  <Label>URL toàn văn</Label>
                  <Input
                    type="url"
                    value={form.fullTextUrl}
                    onChange={(e) => set('fullTextUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Hủy
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lưu công bố
          </Button>
        </div>
      </form>
    </div>
  );
}

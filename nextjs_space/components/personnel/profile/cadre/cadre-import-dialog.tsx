'use client';

/**
 * Dialog nhập hồ sơ cán bộ điện tử (99 trường) từ file Excel mẫu — tự phục vụ (SELF).
 *
 * Luồng: Tải mẫu → tải file lên → XEM TRƯỚC (analyze, không ghi) → Xác nhận (confirm, ghi).
 * Chỉ hiển thị khi đang ở chế độ tự phục vụ và có quyền sửa.
 */
import { useRef, useState } from 'react';
import { Download, Upload, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

type ImportMode = 'append' | 'replace';

interface ExtendedPreviewItem {
  label: string;
  value: string;
}
interface SectionPreview {
  slug: string;
  title: string;
  newCount: number;
  rows: Record<string, string>[];
}
interface AnalyzeData {
  extended: Record<string, unknown>;
  sections: Record<string, Record<string, unknown>[]>;
  extendedPreview: ExtendedPreviewItem[];
  sectionsPreview: SectionPreview[];
  warnings: string[];
}

type Step = 'upload' | 'preview';

interface CadreImportDialogProps {
  /** Base URL của nhóm route cadre-import (vd: /api/profile/cadre-import hoặc /api/personnel/{id}/cadre-import). */
  apiBase: string;
  onImported?: () => void;
}

export function CadreImportDialog({ apiBase, onImported }: CadreImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [analyzing, setAnalyzing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeData | null>(null);
  const [fileName, setFileName] = useState('');
  const [mode, setMode] = useState<ImportMode>('append');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep('upload');
    setAnalysis(null);
    setFileName('');
    setMode('append');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function downloadTemplate() {
    setDownloading(true);
    try {
      const res = await fetch(`${apiBase}/template?prefill=1`);
      if (!res.ok) throw new Error('Không tải được mẫu');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau_ho_so_can_bo_99_truong.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi tải mẫu');
    } finally {
      setDownloading(false);
    }
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${apiBase}/analyze`, { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi phân tích file');
      setAnalysis(json.data as AnalyzeData);
      setStep('preview');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi phân tích file');
    } finally {
      setAnalyzing(false);
    }
  }

  async function confirmImport() {
    if (!analysis) return;
    setConfirming(true);
    try {
      const res = await fetch(`${apiBase}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extended: analysis.extended, sections: analysis.sections, mode }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi nhập dữ liệu');
      const sections = (json.data.sections ?? []) as { created: number; deleted: number }[];
      const created = sections.reduce((sum, s) => sum + s.created, 0);
      const deleted = sections.reduce((sum, s) => sum + s.deleted, 0);
      const delText = deleted > 0 ? `, thay thế ${deleted} bản ghi cũ` : '';
      const errs: string[] = json.data.errors ?? [];
      if (errs.length > 0) {
        toast.warning(`Đã nhập một phần: ${created} bản ghi danh sách${delText}. ${errs.length} lỗi.`);
      } else {
        toast.success(`Nhập hồ sơ thành công${created > 0 ? ` (+${created} bản ghi danh sách${delText})` : ''}.`);
      }
      handleOpenChange(false);
      onImported?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi nhập dữ liệu');
    } finally {
      setConfirming(false);
    }
  }

  const totalNewRecords = analysis?.sectionsPreview.reduce((s, sec) => s + sec.newCount, 0) ?? 0;
  const hasData =
    !!analysis && (analysis.extendedPreview.length > 0 || totalNewRecords > 0);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4 mr-1.5" />
        Nhập từ file Excel
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Nhập hồ sơ cán bộ điện tử từ Excel
            </DialogTitle>
            <DialogDescription>
              Tải file mẫu, điền dữ liệu rồi tải lên. Hệ thống tự điền vào các trường tương ứng.
            </DialogDescription>
          </DialogHeader>

          {step === 'upload' && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="text-sm font-medium">Bước 1 — Tải file mẫu</div>
                <p className="text-xs text-muted-foreground">
                  File mẫu đã điền sẵn thông tin hiện có của bạn (trừ trường nhạy cảm) để chỉnh sửa.
                </p>
                <Button variant="secondary" size="sm" onClick={downloadTemplate} disabled={downloading}>
                  {downloading ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-1.5" />
                  )}
                  Tải file mẫu (.xlsx)
                </Button>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="text-sm font-medium">Bước 2 — Tải file đã điền lên</div>
                <p className="text-xs text-muted-foreground">
                  Trường đơn: ghi đè dữ liệu. Bảng danh sách: thêm mới các dòng đã nhập.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={onFileSelected}
                />
                <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={analyzing}>
                  {analyzing ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1.5" />
                  )}
                  Chọn file Excel
                </Button>
                {fileName && <span className="ml-2 text-xs text-muted-foreground">{fileName}</span>}
              </div>
            </div>
          )}

          {step === 'preview' && analysis && (
            <ScrollArea className="flex-1 pr-3">
              <div className="space-y-4 py-1">
                {totalNewRecords > 0 && (
                  <div className="rounded-lg border p-3 space-y-2">
                    <div className="text-sm font-medium">Chế độ bảng danh sách</div>
                    <div className="flex flex-col gap-1.5">
                      <label className="flex items-start gap-2 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="import-mode"
                          checked={mode === 'append'}
                          onChange={() => setMode('append')}
                          className="mt-0.5"
                        />
                        <span>
                          <strong>Thêm mới</strong> — giữ nguyên dữ liệu danh sách hiện có, chỉ thêm các dòng trong file.
                        </span>
                      </label>
                      <label className="flex items-start gap-2 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="import-mode"
                          checked={mode === 'replace'}
                          onChange={() => setMode('replace')}
                          className="mt-0.5"
                        />
                        <span>
                          <strong>Thay thế</strong> — xóa (mềm) dữ liệu cũ của các nhóm có trong file, rồi nạp lại từ file.
                        </span>
                      </label>
                    </div>
                    {mode === 'replace' && (
                      <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900 py-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Dữ liệu cũ của các nhóm: {analysis.sectionsPreview.map((s) => s.title).join(', ')} sẽ bị xóa mềm trước khi nạp.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {analysis.warnings.length > 0 && (
                  <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1">{analysis.warnings.length} cảnh báo</div>
                      <ul className="list-disc pl-4 space-y-0.5 text-xs max-h-32 overflow-y-auto">
                        {analysis.warnings.slice(0, 30).map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {!hasData && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      Không tìm thấy dữ liệu hợp lệ trong file. Kiểm tra lại đã điền đúng mẫu chưa.
                    </AlertDescription>
                  </Alert>
                )}

                {analysis.extendedPreview.length > 0 && (
                  <div className="rounded-lg border">
                    <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
                      <span className="text-sm font-medium">Trường đơn (ghi đè)</span>
                      <Badge variant="secondary">{analysis.extendedPreview.length} trường</Badge>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y">
                      {analysis.extendedPreview.map((item, i) => (
                        <div key={i} className="flex gap-2 px-3 py-1.5 text-xs">
                          <span className="w-44 shrink-0 text-muted-foreground">{item.label}</span>
                          <span className="font-medium break-words">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.sectionsPreview.map((sec) => (
                  <div key={sec.slug} className="rounded-lg border">
                    <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
                      <span className="text-sm font-medium">{sec.title}</span>
                      <Badge variant="secondary">+{sec.newCount} bản ghi</Badge>
                    </div>
                    <div className="max-h-40 overflow-y-auto px-3 py-2 space-y-1">
                      {sec.rows.slice(0, 10).map((row, i) => (
                        <div key={i} className="text-xs text-muted-foreground truncate">
                          {Object.values(row).filter(Boolean).join(' • ')}
                        </div>
                      ))}
                      {sec.rows.length > 10 && (
                        <div className="text-xs italic text-muted-foreground">… và {sec.rows.length - 10} dòng nữa</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="border-t pt-3">
            {step === 'preview' ? (
              <>
                <Button variant="outline" onClick={reset} disabled={confirming}>
                  Chọn lại file
                </Button>
                <Button onClick={confirmImport} disabled={confirming || !hasData}>
                  {confirming ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  )}
                  Xác nhận nhập
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Đóng
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

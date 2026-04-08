'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  FileText, Search, Download, Eye, Cpu, RefreshCw,
  FileSpreadsheet, FileImage, Archive, BarChart3, Tag,
} from 'lucide-react';

const FILE_TYPE_LABELS: Record<string, string> = {
  RESEARCH_PAPER: 'Bài báo KH',
  DATASET: 'Dữ liệu',
  MODEL: 'Mô hình',
  REPORT: 'Báo cáo',
  PRESENTATION: 'Trình bày',
  OTHER: 'Khác',
};

const CLASS_COLORS: Record<string, string> = {
  PUBLIC: 'bg-green-100 text-green-700',
  INTERNAL: 'bg-blue-100 text-blue-700',
  CONFIDENTIAL: 'bg-yellow-100 text-yellow-700',
  SECRET: 'bg-orange-100 text-orange-700',
  TOP_SECRET: 'bg-red-100 text-red-700',
};

const CLASS_LABELS: Record<string, string> = {
  PUBLIC: 'Công khai',
  INTERNAL: 'Nội bộ',
  CONFIDENTIAL: 'Bí mật',
  SECRET: 'Tối mật',
  TOP_SECRET: 'Tuyệt mật',
};

function FileIcon({ type }: { type: string }) {
  switch (type) {
    case 'DATASET': return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    case 'RESEARCH_PAPER': return <FileText className="h-5 w-5 text-blue-600" />;
    case 'PRESENTATION': return <FileImage className="h-5 w-5 text-purple-600" />;
    default: return <Archive className="h-5 w-5 text-gray-500" />;
  }
}

interface Doc {
  id: string; title?: string; fileName: string; fileType: string;
  fileSize: number; fileSizeKB: number; department?: string;
  classification: string; status: string;
  tags: string[]; keywords: string[]; uploadedBy: string;
  uploadedAt: string; downloadCount: number; viewCount: number;
  fileTypeName?: string; description?: string;
}

interface RegistryResponse {
  documents: Doc[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  stats: { total: number; byType: Record<string, number> };
}

interface SearchResponse {
  results: (Doc & { relevanceScore: number })[];
  total: number;
  query: string;
  pagination: { page: number; limit: number; totalPages: number };
}

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('registry');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [stats, setStats] = useState<{ total: number; byType: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Doc & { relevanceScore: number })[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);

  // OCR state
  const [ocrDocId, setOcrDocId] = useState('');
  const [ocrResult, setOcrResult] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);

  const fetchDocs = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p), limit: '20',
        ...(filterType && { fileType: filterType }),
        ...(filterClass && { classification: filterClass }),
        ...(filterDept && { department: filterDept }),
      });
      const res = await fetch(`/api/documents/registry?${params}`);
      if (!res.ok) throw new Error();
      const data: RegistryResponse = await res.json();
      setDocs(data.documents);
      setStats(data.stats);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
      setPage(p);
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (p = 1) => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchPage(p);
    try {
      const params = new URLSearchParams({ q: searchQuery, page: String(p) });
      const res = await fetch(`/api/documents/search?${params}`);
      if (!res.ok) throw new Error();
      const data: SearchResponse = await res.json();
      setSearchResults(data.results);
      setSearchTotal(data.total);
      setSearchTotalPages(data.pagination.totalPages);
    } catch {
      toast({ title: 'Lỗi', description: 'Tìm kiếm thất bại', variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const handleOCR = async () => {
    if (!ocrDocId.trim()) return;
    setOcrLoading(true);
    try {
      const res = await fetch('/api/documents/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: ocrDocId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOcrResult(data.extractedText);
      toast({ title: 'OCR hoàn tất', description: `Đã nhận dạng ${data.wordsIndexed} từ` });
    } catch (e: any) {
      toast({ title: 'Lỗi OCR', description: e.message, variant: 'destructive' });
    } finally {
      setOcrLoading(false);
    }
  };

  useEffect(() => { fetchDocs(1); }, [filterType, filterClass, filterDept]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-teal-600" />
            Kho văn bản số
          </h1>
          <p className="text-muted-foreground mt-1">Quản lý, tìm kiếm toàn văn và nhận dạng văn bản</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchDocs(1)}>
          <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-teal-600">{stats.total}</p>
              <p className="text-xs text-muted-foreground mt-1">Tổng văn bản</p>
            </CardContent>
          </Card>
          {Object.entries(stats.byType).slice(0, 3).map(([type, count]) => (
            <Card key={type}>
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-1"><FileIcon type={type} /></div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{FILE_TYPE_LABELS[type] || type}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="registry">Danh sách văn bản</TabsTrigger>
          <TabsTrigger value="search">Tìm kiếm toàn văn</TabsTrigger>
          <TabsTrigger value="ocr">Nhận dạng (OCR)</TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: REGISTRY ===== */}
        <TabsContent value="registry" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Select value={filterType || 'ALL'} onValueChange={v => setFilterType(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Loại văn bản" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả loại</SelectItem>
                {Object.entries(FILE_TYPE_LABELS).map(([k, v]) =>
                  <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterClass || 'ALL'} onValueChange={v => setFilterClass(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Phân loại" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                {Object.entries(CLASS_LABELS).map(([k, v]) =>
                  <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Đơn vị/khoa..." value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchDocs(1)}
              className="w-44" />
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 text-center text-muted-foreground">Đang tải...</div>
              ) : docs.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">Không có văn bản nào</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Tên văn bản</th>
                        <th className="px-4 py-3 text-left font-medium">Loại</th>
                        <th className="px-4 py-3 text-left font-medium">Đơn vị</th>
                        <th className="px-4 py-3 text-center font-medium">Phân loại</th>
                        <th className="px-4 py-3 text-right font-medium">Kích thước</th>
                        <th className="px-4 py-3 text-center font-medium">Lượt xem</th>
                        <th className="px-4 py-3 text-left font-medium">Ngày tải</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {docs.map(doc => (
                        <tr key={doc.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileIcon type={doc.fileType} />
                              <div>
                                <p className="font-medium line-clamp-1">{doc.title || doc.fileName}</p>
                                {doc.tags.length > 0 && (
                                  <div className="flex gap-1 mt-0.5">
                                    {doc.tags.slice(0, 3).map(t => (
                                      <span key={t} className="text-xs text-muted-foreground flex items-center gap-0.5">
                                        <Tag className="h-2.5 w-2.5" />{t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">
                              {doc.fileTypeName || FILE_TYPE_LABELS[doc.fileType] || doc.fileType}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{doc.department || '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={`text-xs ${CLASS_COLORS[doc.classification] || 'bg-gray-100'}`}>
                              {CLASS_LABELS[doc.classification] || doc.classification}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                            {doc.fileSizeKB > 1024
                              ? `${(doc.fileSizeKB / 1024).toFixed(1)} MB`
                              : `${doc.fileSizeKB} KB`}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            <span className="flex items-center justify-center gap-1 text-muted-foreground">
                              <Eye className="h-3 w-3" />{doc.viewCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(doc.uploadedAt).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchDocs(page - 1)}>Trước</Button>
              <span className="flex items-center text-sm px-2">Trang {page} / {totalPages} ({total} văn bản)</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchDocs(page + 1)}>Sau</Button>
            </div>
          )}
        </TabsContent>

        {/* ===== TAB 2: FULL-TEXT SEARCH ===== */}
        <TabsContent value="search" className="space-y-4 mt-4">
          <div className="flex gap-3">
            <Input
              placeholder="Tìm kiếm toàn văn: tiêu đề, nội dung, từ khóa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(1)}
              className="flex-1"
            />
            <Button onClick={() => handleSearch(1)} disabled={searching}>
              <Search className="h-4 w-4 mr-2" />
              {searching ? 'Đang tìm...' : 'Tìm kiếm'}
            </Button>
          </div>

          {searchResults.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Tìm thấy <strong>{searchTotal}</strong> kết quả cho "<strong>{searchQuery}</strong>"
              </p>
              <div className="space-y-3">
                {searchResults.map(r => (
                  <Card key={r.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-0.5"><FileIcon type={r.fileType} /></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{r.title || r.fileName}</p>
                              <Badge variant="outline" className="text-xs">
                                {FILE_TYPE_LABELS[r.fileType] || r.fileType}
                              </Badge>
                              <Badge className={`text-xs ${CLASS_COLORS[r.classification] || ''}`}>
                                {CLASS_LABELS[r.classification] || r.classification}
                              </Badge>
                              <span className="text-xs text-teal-600 font-mono">
                                Điểm: {r.relevanceScore}
                              </span>
                            </div>
                            {r.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {r.department && <span>{r.department}</span>}
                              <span>{new Date(r.uploadedAt).toLocaleDateString('vi-VN')}</span>
                              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{r.viewCount}</span>
                              <span className="flex items-center gap-1"><Download className="h-3 w-3" />{r.downloadCount}</span>
                            </div>
                            {r.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {r.keywords.slice(0, 5).map(k => (
                                  <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {searchTotalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={searchPage <= 1} onClick={() => handleSearch(searchPage - 1)}>Trước</Button>
                  <span className="flex items-center text-sm px-2">Trang {searchPage} / {searchTotalPages}</span>
                  <Button variant="outline" size="sm" disabled={searchPage >= searchTotalPages} onClick={() => handleSearch(searchPage + 1)}>Sau</Button>
                </div>
              )}
            </>
          ) : searchQuery && !searching ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Không tìm thấy kết quả cho "<strong>{searchQuery}</strong>"</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Nhập từ khóa để tìm kiếm toàn văn</p>
                <p className="text-xs mt-1">Tìm trong tiêu đề, mô tả, từ khóa, thẻ và nội dung OCR</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== TAB 3: OCR ===== */}
        <TabsContent value="ocr" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="h-4 w-4 text-teal-600" /> Nhận dạng văn bản (OCR)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Nhận dạng văn bản tự động từ ảnh/scan. Kết quả sẽ được lưu vào từ khóa để tìm kiếm toàn văn.
              </p>
              <div>
                <label className="text-xs font-medium">ID Văn bản</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Nhập Document ID..."
                    value={ocrDocId}
                    onChange={e => setOcrDocId(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleOCR} disabled={ocrLoading || !ocrDocId.trim()}>
                    <Cpu className="h-4 w-4 mr-2" />
                    {ocrLoading ? 'Đang xử lý...' : 'Nhận dạng'}
                  </Button>
                </div>
              </div>
              {ocrResult && (
                <div className="border rounded p-4 bg-muted/30">
                  <p className="text-xs font-medium mb-2 text-teal-600">Văn bản đã nhận dạng:</p>
                  <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground max-h-60 overflow-y-auto">
                    {ocrResult}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

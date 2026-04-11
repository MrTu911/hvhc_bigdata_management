'use client';

import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BrainCircuit, MessageSquare, FileText, TrendingUp, AlertTriangle,
  Send, Loader2, ChevronRight, BarChart2, Search as SearchIcon,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'chat' | 'summarize' | 'trends' | 'duplicate';

interface ChatMessage { role: 'user' | 'assistant'; content: string }

interface TrendsData {
  byField:            { field: string; count: number }[];
  byYear:             { year: number | null; count: number }[];
  topKeywords:        { keyword: string; count: number }[];
  publicationsByYear: { year: number | null; count: number }[];
}

interface DuplicateMatch {
  id: string; code: string; title: string;
  doi: string | null; year: number; similarity: number;
}

// ─── Tab nav ──────────────────────────────────────────────────────────────────

const TABS: { value: Tab; label: string; icon: typeof BrainCircuit }[] = [
  { value: 'chat',      label: 'AI Chat',          icon: MessageSquare },
  { value: 'summarize', label: 'Tóm tắt văn bản',  icon: FileText },
  { value: 'trends',    label: 'Xu hướng NC',       icon: TrendingUp },
  { value: 'duplicate', label: 'Kiểm tra trùng',    icon: AlertTriangle },
];

const FIELD_COLORS = [
  '#6d28d9','#2563eb','#0891b2','#059669','#ca8a04',
  '#dc2626','#7c3aed','#db2777','#ea580c','#16a34a',
];

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  const sessionId = useRef(`session-${Date.now()}`);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      const res = await fetch('/api/science/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId.current, messages: next }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Lỗi AI');
      setMessages((prev) => [...prev, { role: 'assistant', content: json.data.reply }]);
    } catch (e: any) {
      toast.error(e.message);
      setMessages((prev) => prev.slice(0, -1)); // rollback user msg
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[560px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
            <BrainCircuit size={40} />
            <p className="text-sm">Hỏi bất kỳ câu hỏi nào về đề tài, nhà khoa học, công trình HVHC...</p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {['Tóm tắt các đề tài đang thực hiện', 'Nhà khoa học có chuyên môn AI', 'Xu hướng nghiên cứu 2024'].map((q) => (
                <button key={q} onClick={() => setInput(q)}
                  className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 hover:bg-violet-50 hover:border-violet-200 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-violet-600 text-white rounded-br-sm'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
              <Loader2 size={16} className="animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-3">
        <Input
          placeholder="Nhập câu hỏi về NCKH HVHC..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          disabled={sending}
          className="flex-1"
        />
        <Button onClick={send} disabled={sending || !input.trim()} size="sm" className="px-4">
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </Button>
      </div>
      <p className="text-xs text-gray-400 mt-1.5">
        AI chỉ dùng dữ liệu APPROVED — không truy xuất tài liệu mật.
      </p>
    </div>
  );
}

// ─── Summarize Panel ──────────────────────────────────────────────────────────

function SummarizePanel() {
  const [text,      setText]      = useState('');
  const [summary,   setSummary]   = useState('');
  const [maxLength, setMaxLength] = useState(300);
  const [loading,   setLoading]   = useState(false);

  const run = async () => {
    if (!text.trim() || text.length < 20) { toast.error('Nhập ít nhất 20 ký tự'); return; }
    setLoading(true);
    setSummary('');
    try {
      const res = await fetch('/api/science/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), maxLength }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Lỗi tóm tắt');
      setSummary(json.data.summary);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Văn bản cần tóm tắt <span className="text-gray-400 font-normal">(tối đa 8000 ký tự)</span>
        </label>
        <textarea
          className="w-full h-44 border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="Dán nội dung đề tài, báo cáo, abstract... vào đây"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 8000))}
        />
        <p className="text-xs text-gray-400 mt-0.5 text-right">{text.length} / 8000</p>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Độ dài tóm tắt (từ)</label>
          <select
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            value={maxLength}
            onChange={(e) => setMaxLength(Number(e.target.value))}
          >
            <option value={150}>Ngắn (~150 từ)</option>
            <option value={300}>Trung bình (~300 từ)</option>
            <option value={500}>Dài (~500 từ)</option>
          </select>
        </div>
        <Button onClick={run} disabled={loading || text.length < 20} className="mt-4">
          {loading ? <Loader2 size={15} className="animate-spin mr-1" /> : null}
          {loading ? 'Đang tóm tắt...' : 'Tóm tắt'}
        </Button>
      </div>
      {summary && (
        <Card className="border-violet-200 bg-violet-50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-violet-800">Kết quả tóm tắt</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Trends Panel ─────────────────────────────────────────────────────────────

function TrendsPanel() {
  const [data,    setData]    = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded,  setLoaded]  = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/science/ai/trends');
      if (!res.ok) throw new Error('Tải dữ liệu thất bại');
      const json = await res.json();
      setData(json.data);
      setLoaded(true);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading && !loaded) {
    return <div className="py-16 text-center text-gray-400 text-sm">Đang tải xu hướng...</div>;
  }
  if (!data) return null;

  const byYearFilled = data.byYear
    .filter((r) => r.year !== null)
    .map((r) => ({ year: String(r.year), count: r.count }));

  const pubsByYearFilled = data.publicationsByYear
    .filter((r) => r.year !== null)
    .map((r) => ({ year: String(r.year), count: r.count }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Projects by field */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <BarChart2 size={15} className="text-violet-500" /> Đề tài theo lĩnh vực
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.byField.slice(0, 8)} layout="vertical" margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="field" type="category" tick={{ fontSize: 10 }} width={100} />
              <Tooltip formatter={(v: any) => [`${v} đề tài`, '']} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.byField.slice(0, 8).map((_, i) => (
                  <Cell key={i} fill={FIELD_COLORS[i % FIELD_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Projects by year */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <TrendingUp size={15} className="text-blue-500" /> Đề tài theo năm
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byYearFilled} margin={{ right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v} đề tài`, '']} />
              <Bar dataKey="count" fill="#6d28d9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Publications by year */}
      {pubsByYearFilled.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <TrendingUp size={15} className="text-sky-500" /> Công bố khoa học theo năm
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={pubsByYearFilled} margin={{ right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v} công bố`, '']} />
              <Bar dataKey="count" fill="#0891b2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top keywords */}
      {data.topKeywords.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Từ khóa nghiên cứu phổ biến</h3>
          <div className="flex flex-wrap gap-2">
            {data.topKeywords.map(({ keyword, count }) => (
              <span
                key={keyword}
                className="inline-flex items-center gap-1 bg-violet-50 border border-violet-100 text-violet-700 rounded-full px-2.5 py-0.5 text-xs"
              >
                {keyword}
                <span className="bg-violet-200 text-violet-800 rounded-full px-1 text-[10px] font-bold">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400">Dữ liệu từ đề tài APPROVED/IN_PROGRESS/COMPLETED.</p>
    </div>
  );
}

// ─── Duplicate Check Panel ────────────────────────────────────────────────────

function DuplicatePanel() {
  const [title,    setTitle]    = useState('');
  const [matches,  setMatches]  = useState<DuplicateMatch[] | null>(null);
  const [loading,  setLoading]  = useState(false);

  const check = async () => {
    if (title.trim().length < 5) { toast.error('Nhập tiêu đề ít nhất 5 ký tự'); return; }
    setLoading(true);
    setMatches(null);
    try {
      const res = await fetch('/api/science/works/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Lỗi kiểm tra');
      setMatches(json.data.matches ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const pct = (s: number) => `${(s * 100).toFixed(0)}%`;
  const similarityColor = (s: number) =>
    s >= 0.9 ? 'text-red-600 bg-red-50 border-red-200'
    : s >= 0.8 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-gray-600 bg-gray-50 border-gray-200';

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Kiểm tra tiêu đề công trình khoa học có trùng với bản ghi đã có trong hệ thống không.
        Ngưỡng mặc định 80%. Phase 5 sẽ nâng cấp bằng vector embedding.
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="Nhập tiêu đề công trình cần kiểm tra..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') check(); }}
          className="flex-1"
        />
        <Button onClick={check} disabled={loading || title.length < 5}>
          {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : <SearchIcon size={14} className="mr-1" />}
          Kiểm tra
        </Button>
      </div>

      {matches !== null && (
        <div className="space-y-2">
          {matches.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
              <span className="text-lg">✓</span> Không phát hiện trùng lặp với ngưỡng 80%.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <AlertTriangle size={15} /> Phát hiện {matches.length} công trình tương tự.
              </div>
              {matches.map((m) => (
                <div key={m.id} className={`border rounded-lg p-3 text-sm ${similarityColor(m.similarity)}`}>
                  <div className="font-medium">{m.title}</div>
                  <div className="flex gap-3 mt-1 text-xs opacity-80">
                    <span>{m.code}</span>
                    <span>Năm {m.year}</span>
                    {m.doi && <span className="font-mono">{m.doi}</span>}
                    <span className="font-bold">Tương đồng: {pct(m.similarity)}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AiToolsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BrainCircuit size={24} className="text-violet-600" />
          AI Tools — Khoa học
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Chatbot RAG, tóm tắt văn bản, xu hướng nghiên cứu, kiểm tra trùng lặp
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.value
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6 pb-6">
          {activeTab === 'chat'      && <ChatPanel />}
          {activeTab === 'summarize' && <SummarizePanel />}
          {activeTab === 'trends'    && <TrendsPanel />}
          {activeTab === 'duplicate' && <DuplicatePanel />}
        </CardContent>
      </Card>
    </div>
  );
}

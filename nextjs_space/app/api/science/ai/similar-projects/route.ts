/**
 * POST /api/science/ai/similar-projects
 *
 * Phát hiện trùng lặp đề tài / tìm đề tài tương tự dựa trên
 * từ khóa, tiêu đề, lĩnh vực và loại nghiên cứu.
 *
 * Dùng để:
 *  - Cảnh báo PI khi đề xuất có thể trùng với đề tài đã có
 *  - Hội đồng thẩm định tìm nghiên cứu liên quan
 *  - AI chatbot tra cứu tiền đề
 *
 * Algorithm: weighted token overlap on title + keywords + abstract (no ML)
 *
 * Body:
 *   proposalId  — string (optional, lấy dữ liệu tự động)
 *   projectId   — string (optional, tương tự)
 *   title       — string (optional, override)
 *   keywords    — string[] (optional, override)
 *   field       — string (optional, override)
 *   abstract    — string (optional, thêm nếu có)
 *   threshold   — number (0-1, ngưỡng similarity, default 0.15)
 *   limit       — number (default: 8, max: 20)
 *   includeStatuses — string[] (default: all non-DRAFT)
 *
 * RBAC: SCIENCE.AI_USE
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SCIENCE } from '@/lib/rbac/function-codes';

// ─── Validation ───────────────────────────────────────────────────────────────

const bodySchema = z.object({
  proposalId:     z.string().optional(),
  projectId:      z.string().optional(),
  title:          z.string().max(500).optional(),
  keywords:       z.array(z.string()).optional(),
  field:          z.string().optional(),
  abstract:       z.string().max(5000).optional(),
  threshold:      z.number().min(0).max(1).default(0.15),
  limit:          z.number().int().min(1).max(20).default(8),
  includeStatuses: z.array(z.string()).optional(),
});

// ─── Tokenization ─────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'và', 'của', 'trong', 'về', 'các', 'có', 'là', 'được', 'với', 'cho', 'theo',
  'một', 'từ', 'để', 'trên', 'khi', 'này', 'đến', 'tại', 'ra', 'hay', 'hoặc',
  'the', 'a', 'an', 'of', 'in', 'for', 'to', 'and', 'or', 'is', 'are', 'was',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\wÀ-ỹ\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function buildTokenSet(title: string, keywords: string[], abstract?: string): Map<string, number> {
  const freq = new Map<string, number>();
  const add = (tokens: string[], weight: number) => {
    for (const t of tokens) {
      freq.set(t, (freq.get(t) ?? 0) + weight);
    }
  };
  add(tokenize(title), 3);           // title tokens: weight 3
  for (const kw of keywords) {
    add(tokenize(kw), 2);            // explicit keywords: weight 2
  }
  if (abstract) add(tokenize(abstract), 1); // abstract: weight 1
  return freq;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [token, wa] of a) {
    const wb = b.get(token) ?? 0;
    dot += wa * wb;
    normA += wa * wa;
  }
  for (const [, w] of b) normB += w * w;
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.AI_USE);
  if (!auth.allowed) return auth.response!;

  let raw: unknown;
  try { raw = await req.json(); }
  catch { return NextResponse.json({ success: false, data: null, error: 'Body phải là JSON' }, { status: 400 }); }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ success: false, data: null, error: parsed.error.flatten() }, { status: 422 });
  }
  const {
    proposalId, projectId,
    title: titleOverride, keywords: kwOverride, field: fieldOverride, abstract: absOverride,
    threshold, limit,
    includeStatuses,
  } = parsed.data;

  // ── Resolve source data ──
  let srcTitle: string = titleOverride ?? '';
  let srcKeywords: string[] = kwOverride ?? [];
  let srcField: string | undefined = fieldOverride;
  let srcAbstract: string | undefined = absOverride;
  let excludeId: string | undefined;

  if (proposalId) {
    const prop = await prisma.nckhProposal.findUnique({
      where: { id: proposalId },
      select: { title: true, keywords: true, field: true, abstract: true },
    });
    if (!prop) return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy đề xuất' }, { status: 404 });
    if (!srcTitle) srcTitle = prop.title;
    if (srcKeywords.length === 0) srcKeywords = prop.keywords;
    if (!srcField) srcField = prop.field;
    if (!srcAbstract) srcAbstract = prop.abstract ?? undefined;
    excludeId = proposalId; // don't match against itself
  }

  if (projectId) {
    const proj = await prisma.nckhProject.findUnique({
      where: { id: projectId },
      select: { title: true, keywords: true, field: true, abstract: true },
    });
    if (!proj) return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy đề tài' }, { status: 404 });
    if (!srcTitle) srcTitle = proj.title;
    if (srcKeywords.length === 0) srcKeywords = proj.keywords;
    if (!srcField) srcField = proj.field;
    if (!srcAbstract) srcAbstract = proj.abstract ?? undefined;
    excludeId = projectId;
  }

  if (!srcTitle && srcKeywords.length === 0) {
    return NextResponse.json({ success: false, data: null, error: 'Cần ít nhất title hoặc keywords' }, { status: 422 });
  }

  const srcTokens = buildTokenSet(srcTitle, srcKeywords, srcAbstract);

  // ── Load candidate projects ──
  const allowedStatuses = includeStatuses ?? ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED'];

  const candidates = await prisma.nckhProject.findMany({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      status: { in: allowedStatuses },
    },
    select: {
      id: true,
      projectCode: true,
      title: true,
      keywords: true,
      field: true,
      abstract: true,
      status: true,
      researchType: true,
      startDate: true,
      endDate: true,
      principalInvestigator: { select: { id: true, name: true } },
    },
  });

  // Also search proposals if no projectId specified
  const proposalCandidates = await prisma.nckhProposal.findMany({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      status: { in: ['SUBMITTED', 'REVIEWING', 'APPROVED'] },
    },
    select: {
      id: true,
      title: true,
      keywords: true,
      field: true,
      abstract: true,
      status: true,
      researchType: true,
      pi: { select: { id: true, name: true } },
    },
  });

  // ── Score projects ──
  const results: Array<{
    type: 'PROJECT' | 'PROPOSAL';
    id: string;
    code?: string;
    title: string;
    field: string | null;
    status: string;
    pi: { id: string; name: string } | null;
    similarity: number;
    fieldMatch: boolean;
  }> = [];

  for (const c of candidates) {
    const cTokens = buildTokenSet(c.title, c.keywords, c.abstract ?? undefined);
    const sim = cosineSimilarity(srcTokens, cTokens);
    // Field bonus: bump similarity by 20% if same field
    const fieldMatch = !!(srcField && c.field && c.field === srcField);
    const adjustedSim = fieldMatch ? Math.min(1, sim * 1.2) : sim;
    if (adjustedSim >= threshold) {
      results.push({
        type: 'PROJECT',
        id: c.id,
        code: c.projectCode,
        title: c.title,
        field: c.field,
        status: c.status,
        pi: c.principalInvestigator,
        similarity: Math.round(adjustedSim * 1000) / 1000,
        fieldMatch,
      });
    }
  }

  for (const p of proposalCandidates) {
    const pTokens = buildTokenSet(p.title, p.keywords, p.abstract ?? undefined);
    const sim = cosineSimilarity(srcTokens, pTokens);
    const fieldMatch = !!(srcField && p.field && p.field === srcField);
    const adjustedSim = fieldMatch ? Math.min(1, sim * 1.2) : sim;
    if (adjustedSim >= threshold) {
      results.push({
        type: 'PROPOSAL',
        id: p.id,
        code: undefined,
        title: p.title,
        field: p.field,
        status: p.status,
        pi: p.pi,
        similarity: Math.round(adjustedSim * 1000) / 1000,
        fieldMatch,
      });
    }
  }

  results.sort((a, b) => b.similarity - a.similarity);
  const topResults = results.slice(0, limit);

  const warningLevel =
    topResults.some((r) => r.similarity >= 0.7) ? 'HIGH' :
    topResults.some((r) => r.similarity >= 0.4) ? 'MEDIUM' :
    topResults.length > 0 ? 'LOW' : 'NONE';

  return NextResponse.json({
    success: true,
    data: {
      results: topResults,
      warningLevel,
      meta: { threshold, totalCandidates: candidates.length + proposalCandidates.length },
    },
    error: null,
  });
}

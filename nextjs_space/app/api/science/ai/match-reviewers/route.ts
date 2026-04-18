/**
 * POST /api/science/ai/match-reviewers
 *
 * Gợi ý danh sách nhà khoa học phù hợp để làm hội đồng thẩm định/nghiệm thu
 * dựa trên lĩnh vực, từ khóa, cấp độ nghiên cứu của đề tài/đề xuất.
 *
 * Algorithm: TF-IDF keyword overlap + field match scoring (no external ML service)
 *
 * Body:
 *   projectId   — string (optional, dùng để lấy field/keywords tự động)
 *   proposalId  — string (optional, tương tự)
 *   field       — string (optional, override nếu không có projectId/proposalId)
 *   keywords    — string[] (optional, override)
 *   excludeIds  — string[] (optional, loại trừ userId — thường là thành viên đề tài)
 *   limit       — number (default: 10, max: 30)
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
  projectId:  z.string().optional(),
  proposalId: z.string().optional(),
  field:      z.string().optional(),
  keywords:   z.array(z.string()).optional(),
  excludeIds: z.array(z.string()).optional(),
  limit:      z.number().int().min(1).max(30).default(10),
});

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function normalizeToken(s: string): string {
  return s.toLowerCase().trim();
}

function tokenOverlapScore(setA: string[], setB: string[]): number {
  if (setA.length === 0 || setB.length === 0) return 0;
  const normA = new Set(setA.map(normalizeToken));
  const normB = setB.map(normalizeToken);
  const matches = normB.filter((t) => normA.has(t)).length;
  // Jaccard-like: intersection / union
  const union = normA.size + normB.length - matches;
  return union > 0 ? matches / union : 0;
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
  const { projectId, proposalId, field: fieldOverride, keywords: kwOverride, excludeIds = [], limit } = parsed.data;

  // ── Resolve field + keywords from project/proposal ──
  let targetField: string | undefined = fieldOverride;
  let targetKeywords: string[] = kwOverride ?? [];
  let targetMemberUserIds: string[] = [...excludeIds];

  if (projectId) {
    const proj = await prisma.nckhProject.findUnique({
      where: { id: projectId },
      select: {
        field: true, keywords: true,
        principalInvestigatorId: true,
        members: { select: { userId: true } },
      },
    });
    if (!proj) return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy đề tài' }, { status: 404 });
    if (!targetField) targetField = proj.field;
    if (targetKeywords.length === 0) targetKeywords = proj.keywords;
    // Exclude PI and members from results
    targetMemberUserIds = [
      ...new Set([
        ...targetMemberUserIds,
        proj.principalInvestigatorId,
        ...proj.members.map((m) => m.userId),
      ]),
    ];
  }

  if (proposalId) {
    const prop = await prisma.nckhProposal.findUnique({
      where: { id: proposalId },
      select: { field: true, keywords: true, piId: true },
    });
    if (!prop) return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy đề xuất' }, { status: 404 });
    if (!targetField) targetField = prop.field;
    if (targetKeywords.length === 0) targetKeywords = prop.keywords;
    if (prop.piId && !targetMemberUserIds.includes(prop.piId)) {
      targetMemberUserIds.push(prop.piId);
    }
  }

  // ── Load scientist profiles (basic fields for matching) ──
  const scientists = await prisma.nckhScientistProfile.findMany({
    where: {
      user: { id: { notIn: targetMemberUserIds.length > 0 ? targetMemberUserIds : undefined } },
    },
    select: {
      id: true,
      primaryField: true,
      secondaryFields: true,
      researchKeywords: true,
      specialization: true,
      hIndex: true,
      totalPublications: true,
      academicRank: true,
      degree: true,
      sensitivityLevel: true,
      user: {
        select: {
          id: true, name: true, rank: true, email: true,
          unitRelation: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  // ── Score each scientist ──
  const scored = scientists.map((s) => {
    let score = 0;

    // 1. Primary field exact match (+5)
    if (targetField && s.primaryField && normalizeToken(s.primaryField) === normalizeToken(targetField)) {
      score += 5;
    }
    // 2. Secondary fields contain target field (+2)
    if (targetField && s.secondaryFields.some((f) => normalizeToken(f) === normalizeToken(targetField!))) {
      score += 2;
    }
    // 3. Keyword overlap (0-3 scaled)
    const kwScore = tokenOverlapScore(targetKeywords, s.researchKeywords);
    score += kwScore * 3;

    // 4. Academic rank bonus (senior reviewers preferred)
    const rankBonus: Record<string, number> = { GS: 2, PGS: 1.5, GVCC: 1, GVC: 0.5 };
    if (s.academicRank) score += rankBonus[s.academicRank] ?? 0;

    // 5. h-index signal (log-scaled, capped at +1)
    if (s.hIndex && s.hIndex > 0) score += Math.min(1, Math.log10(s.hIndex + 1));

    return { scientist: s, score: Math.round(score * 100) / 100 };
  });

  // Sort by score desc, take top N
  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, limit).map(({ scientist: s, score }) => ({
    scientistId: s.id,
    userId: s.user.id,
    name: s.user.name,
    rank: s.user.rank,
    degree: s.degree,
    academicRank: s.academicRank,
    primaryField: s.primaryField,
    researchKeywords: s.researchKeywords,
    hIndex: s.hIndex,
    totalPublications: s.totalPublications,
    unit: s.user.unitRelation,
    matchScore: score,
    matchReasons: buildMatchReasons(s, targetField, targetKeywords),
  }));

  return NextResponse.json({ success: true, data: { results, meta: { targetField, targetKeywords, excludedCount: targetMemberUserIds.length } }, error: null });
}

function buildMatchReasons(
  s: { primaryField: string | null; secondaryFields: string[]; researchKeywords: string[]; academicRank: string | null },
  targetField: string | undefined,
  targetKeywords: string[],
): string[] {
  const reasons: string[] = [];
  if (targetField && s.primaryField && normalizeToken(s.primaryField) === normalizeToken(targetField)) {
    reasons.push(`Lĩnh vực chính phù hợp: ${s.primaryField}`);
  }
  if (targetField && s.secondaryFields.some((f) => normalizeToken(f) === normalizeToken(targetField!))) {
    reasons.push(`Lĩnh vực phụ phù hợp: ${targetField}`);
  }
  const matchedKw = targetKeywords.filter((kw) =>
    s.researchKeywords.some((sk) => normalizeToken(sk) === normalizeToken(kw))
  );
  if (matchedKw.length > 0) {
    reasons.push(`Từ khóa trùng: ${matchedKw.slice(0, 3).join(', ')}`);
  }
  if (s.academicRank && ['GS', 'PGS'].includes(s.academicRank)) {
    reasons.push(`Chức danh khoa học: ${s.academicRank}`);
  }
  return reasons;
}

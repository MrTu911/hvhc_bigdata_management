/**
 * API: AI Duplicate Check - Phát hiện trùng lặp hồ sơ
 * Path: /api/ai/duplicate-check
 * Checks for duplicate personnel, research topics, awards
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI, RESEARCH } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

// Normalize Vietnamese text for comparison
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate string similarity (Jaccard coefficient on word sets)
function calculateSimilarity(a: string, b: string): number {
  const setA = new Set(normalize(a).split(' ').filter(Boolean));
  const setB = new Set(normalize(b).split(' ').filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return parseFloat((intersection.size / union.size).toFixed(3));
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, AI.ANALYZE_TRENDS);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;
    const body = await request.json();

    const { domain, targetId, similarityThreshold = 0.6 } = body;
    // domain: 'personnel' | 'research' | 'awards'

    const results: Array<{
      id1: string; id2: string; name1: string; name2: string;
      similarity: number; matchedFields: string[]; domain: string;
    }> = [];

    if (!domain || domain === 'personnel') {
      // Kiểm tra trùng lặp nhân sự theo tên + ngày sinh
      const users = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, dateOfBirth: true, militaryId: true, email: true },
        take: 500,
      });

      for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
          const u1 = users[i], u2 = users[j];
          const matchedFields: string[] = [];

          const nameSim = u1.name && u2.name ? calculateSimilarity(u1.name, u2.name) : 0;
          if (nameSim >= similarityThreshold) matchedFields.push('name');

          if (u1.dateOfBirth && u2.dateOfBirth &&
            new Date(u1.dateOfBirth).getTime() === new Date(u2.dateOfBirth).getTime()) {
            matchedFields.push('dateOfBirth');
          }

          const overallSim = matchedFields.includes('dateOfBirth') ? Math.min(1, nameSim + 0.3) : nameSim;

          if (overallSim >= similarityThreshold && matchedFields.length > 0) {
            // Skip if targetId specified and neither matches
            if (targetId && u1.id !== targetId && u2.id !== targetId) continue;

            results.push({
              id1: u1.id, id2: u2.id,
              name1: u1.name || '', name2: u2.name || '',
              similarity: overallSim,
              matchedFields,
              domain: 'personnel',
            });
          }
        }
      }
    }

    if (!domain || domain === 'research') {
      // Kiểm tra đề tài NCKH trùng lặp
      const projects = await prisma.researchProject.findMany({
        select: { id: true, projectName: true, description: true, status: true },
        where: { status: { not: 'CANCELLED' } },
        take: 200,
      }).then(r => r.map(p => ({ id: p.id, title: p.projectName, description: p.description, status: p.status })))
        .catch(async () => {
          // Try scientificResearch model
          return prisma.scientificResearch.findMany({
            select: { id: true, title: true },
            take: 200,
          }).then(r => r.map(x => ({ id: x.id, title: x.title, description: '', status: 'ACTIVE' }))).catch(() => []);
        });

      for (let i = 0; i < projects.length; i++) {
        for (let j = i + 1; j < projects.length; j++) {
          const p1 = projects[i], p2 = projects[j];
          if (!p1.title || !p2.title) continue;

          const titleSim = calculateSimilarity(p1.title, p2.title);
          if (titleSim >= similarityThreshold) {
            if (targetId && p1.id !== targetId && p2.id !== targetId) continue;
            results.push({
              id1: p1.id, id2: p2.id,
              name1: p1.title, name2: p2.title,
              similarity: titleSim,
              matchedFields: ['title'],
              domain: 'research',
            });
          }
        }
      }
    }

    if (!domain || domain === 'awards') {
      // Kiểm tra khen thưởng cùng người, cùng nội dung
      const awards = await prisma.policyRecord.findMany({
        where: { deletedAt: null, recordType: { in: ['REWARD', 'EMULATION'] } },
        select: { id: true, userId: true, title: true, decisionDate: true, level: true },
        take: 500,
      });

      // Group by userId first
      const byUser = awards.reduce((acc, a) => {
        if (!acc[a.userId]) acc[a.userId] = [];
        acc[a.userId].push(a);
        return acc;
      }, {} as Record<string, typeof awards>);

      for (const [, userAwards] of Object.entries(byUser)) {
        for (let i = 0; i < userAwards.length; i++) {
          for (let j = i + 1; j < userAwards.length; j++) {
            const a1 = userAwards[i], a2 = userAwards[j];
            if (!a1.title || !a2.title) continue;

            const titleSim = calculateSimilarity(a1.title, a2.title);
            const matchedFields: string[] = [];

            if (titleSim >= similarityThreshold) matchedFields.push('title');
            if (a1.level === a2.level) matchedFields.push('level');

            // Check same year
            if (a1.decisionDate && a2.decisionDate) {
              const y1 = new Date(a1.decisionDate).getFullYear();
              const y2 = new Date(a2.decisionDate).getFullYear();
              if (y1 === y2) matchedFields.push('year');
            }

            if (matchedFields.includes('title') && matchedFields.length >= 2) {
              if (targetId && a1.id !== targetId && a2.id !== targetId) continue;
              results.push({
                id1: a1.id, id2: a2.id,
                name1: a1.title, name2: a2.title,
                similarity: titleSim,
                matchedFields,
                domain: 'awards',
              });
            }
          }
        }
      }
    }

    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);

    await logAudit({
      userId: user.id,
      functionCode: AI.ANALYZE_TRENDS,
      action: 'ANALYZE',
      resourceType: 'DUPLICATE_CHECK',
      result: 'SUCCESS',
      metadata: { domain, duplicatesFound: results.length, similarityThreshold },
    });

    return NextResponse.json({
      domain: domain || 'all',
      similarityThreshold,
      duplicatesFound: results.length,
      results: results.slice(0, 50), // Return top 50
      analyzedAt: new Date().toISOString(),
      byDomain: {
        personnel: results.filter(r => r.domain === 'personnel').length,
        research: results.filter(r => r.domain === 'research').length,
        awards: results.filter(r => r.domain === 'awards').length,
      },
    });
  } catch (error) {
    console.error('[Duplicate Check POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

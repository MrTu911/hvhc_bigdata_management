import 'server-only';
import db from '@/lib/db';
import { calculateAndSaveEIS } from '@/lib/services/faculty/faculty-eis.service';

/**
 * Derives current Vietnamese academic year and semester from a given date.
 * HK1: Aug–Jan, HK2: Feb–Jul
 */
export function getCurrentAcademicPeriod(date = new Date()): { academicYear: string; semesterCode: string } {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();

  // HK1: Aug (8) – Dec (12) of year Y, and Jan (1) of year Y+1
  // HK2: Feb (2) – Jul (7) of year Y
  if (month >= 8) {
    return { academicYear: `${year}-${year + 1}`, semesterCode: 'HK1' };
  } else if (month === 1) {
    return { academicYear: `${year - 1}-${year}`, semesterCode: 'HK1' };
  } else {
    return { academicYear: `${year - 1}-${year}`, semesterCode: 'HK2' };
  }
}

/**
 * Called when a NckhPublication transitions to PUBLISHED.
 * 1. Increments FacultyProfile.publications counter for main author.
 * 2. Triggers EIS recalculation (R dimension) for the current semester.
 * 3. Fire-and-forget — never throws, logs errors only.
 */
export async function onPublicationPublished(publicationId: string, authorUserId: string): Promise<void> {
  try {
    const profile = await db.facultyProfile.findUnique({
      where: { userId: authorUserId },
      select: { id: true },
    });

    if (!profile) {
      // Author is not a faculty member — nothing to update
      return;
    }

    // Increment denormalized publications counter
    await db.facultyProfile.update({
      where: { id: profile.id },
      data: { publications: { increment: 1 } },
    });

    const { academicYear, semesterCode } = getCurrentAcademicPeriod();

    await calculateAndSaveEIS(profile.id, academicYear, semesterCode, 'system');
  } catch (err) {
    console.error('[EISPublicationHook] onPublicationPublished failed', { publicationId, authorUserId, err });
  }
}

/**
 * Batch recalculation: re-compute EIS for all faculty whose publications counter
 * was updated after `since` timestamp. Used by the cron endpoint.
 */
export async function recalculateEISForRecentPublications(since: Date): Promise<{
  checked: number;
  updated: number;
  failed: string[];
}> {
  // Find publications that became PUBLISHED after `since`
  const recentPublications = await db.nckhPublication.findMany({
    where: {
      status: 'PUBLISHED',
      updatedAt: { gte: since },
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  // Collect unique user IDs
  const userIds = [...new Set(recentPublications.map((p) => p.authorId))];

  const { academicYear, semesterCode } = getCurrentAcademicPeriod();
  let updated = 0;
  const failed: string[] = [];

  for (const userId of userIds) {
    try {
      const profile = await db.facultyProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!profile) continue;

      await calculateAndSaveEIS(profile.id, academicYear, semesterCode, 'system');
      updated++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      failed.push(`userId=${userId}: ${msg}`);
    }
  }

  return { checked: userIds.length, updated, failed };
}

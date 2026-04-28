import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { INFRA } from '@/lib/rbac/function-codes';
import {
  listDRPlans,
  createDRPlan,
  recordDRExercise,
  getDRReadiness,
} from '@/lib/services/infrastructure/backup.service';

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.DR_VIEW);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  try {
    if (view === 'readiness') {
      const readiness = await getDRReadiness();
      return NextResponse.json({ success: true, data: readiness });
    }
    const plans = await listDRPlans();
    return NextResponse.json({ success: true, data: plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.DR_MANAGE);
  if (!auth.allowed) return auth.response!;

  try {
    const body   = await req.json();
    const action = body.action as 'create-plan' | 'record-exercise';

    if (action === 'record-exercise') {
      if (!body.planId || !body.outcome) {
        return NextResponse.json(
          { success: false, error: 'planId and outcome required' },
          { status: 400 },
        );
      }
      const exercise = await recordDRExercise({
        planId:          body.planId,
        exercisedAt:     new Date(body.exercisedAt ?? Date.now()),
        conductedById:   auth.user!.id,
        outcome:         body.outcome,
        rtoAchievedMin:  body.rtoAchievedMin,
        rpoAchievedMin:  body.rpoAchievedMin,
        findings:        body.findings,
        nextReviewDate:  body.nextReviewDate ? new Date(body.nextReviewDate) : undefined,
      });
      return NextResponse.json({ success: true, data: exercise }, { status: 201 });
    }

    // create-plan
    const required = ['name', 'rtoTargetMin', 'rpoTargetMin'];
    const missing  = required.filter((f) => !body[f] && body[f] !== 0);
    if (missing.length) {
      return NextResponse.json(
        { success: false, error: `Missing fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }
    const plan = await createDRPlan({
      name:          body.name,
      description:   body.description,
      rtoTargetMin:  body.rtoTargetMin,
      rpoTargetMin:  body.rpoTargetMin,
      runbookPath:   body.runbookPath,
      createdById:   auth.user!.id,
    });
    return NextResponse.json({ success: true, data: plan }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

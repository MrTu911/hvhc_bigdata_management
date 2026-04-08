import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { prisma as db } from '@/lib/db';

// GET - Lấy chi tiết version
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { versionId } = params;

    const versions = await db.$queryRawUnsafe(`
      SELECT * FROM model_versions WHERE id = '${versionId}'
    `);

    if (!Array.isArray(versions) || versions.length === 0) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ version: versions[0] });
  } catch (error) {
    console.error('Error fetching version:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật version (promote, rollback, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const authResult = await requireFunction(request, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const { id: modelId, versionId } = params;
    const body = await request.json();
    const { status, stage, notes } = body;

    let updateFields = [];
    if (status) updateFields.push(`status = '${status}'`);
    if (stage) updateFields.push(`stage = '${stage}'`);
    if (notes) updateFields.push(`notes = '${notes}'`);

    if (updateFields.length > 0) {
      await db.$executeRawUnsafe(`
        UPDATE model_versions 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = '${versionId}'
      `);
    }

    // Nếu promote to production, cập nhật model
    if (stage === 'production') {
      await db.$executeRawUnsafe(`
        UPDATE ml_models 
        SET current_version = (
          SELECT version_number FROM model_versions WHERE id = '${versionId}'
        ), updated_at = NOW()
        WHERE id = '${modelId}'
      `);

      // Demote các versions khác
      await db.$executeRawUnsafe(`
        UPDATE model_versions 
        SET stage = 'archived', updated_at = NOW()
        WHERE model_id = '${modelId}' AND id != '${versionId}' AND stage = 'production'
      `);
    }

    return NextResponse.json({ message: 'Version updated successfully' });
  } catch (error) {
    console.error('Error updating version:', error);
    return NextResponse.json(
      { error: 'Failed to update version' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa version
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const authResult = await requireFunction(request, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const { versionId } = params;

    // Không cho phép xóa version đang production
    const versions = await db.$queryRawUnsafe<Array<{ stage: string }>>(`
      SELECT stage FROM model_versions WHERE id = '${versionId}'
    `);

    if (versions && versions.length > 0 && versions[0].stage === 'production') {
      return NextResponse.json(
        { error: 'Cannot delete production version' },
        { status: 400 }
      );
    }

    await db.$executeRawUnsafe(`
      DELETE FROM model_versions WHERE id = '${versionId}'
    `);

    return NextResponse.json({ message: 'Version deleted successfully' });
  } catch (error) {
    console.error('Error deleting version:', error);
    return NextResponse.json(
      { error: 'Failed to delete version' },
      { status: 500 }
    );
  }
}

/**
 * API: Policy Stats - Thống kê chính sách
 * Route: GET
 * RBAC: POLICY.VIEW
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { POLICY } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC check
    const authResult = await requireFunction(request, POLICY.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31T23:59:59`);

    // Run all queries in parallel
    const [
      totalCategories,
      requestsByStatus,
      requestsByCategory,
      requestsByMonth,
      totalAmount,
      recentRequests,
    ] = await Promise.all([
      // Tổng số danh mục chính sách
      prisma.policyCategory.count({ where: { isActive: true } }),
      
      // Yêu cầu theo trạng thái
      prisma.policyRequest.groupBy({
        by: ['status'],
        where: {
          deletedAt: null,
          createdAt: { gte: startOfYear, lte: endOfYear },
        },
        _count: true,
      }),
      
      // Yêu cầu theo danh mục
      prisma.policyRequest.groupBy({
        by: ['categoryId'],
        where: {
          deletedAt: null,
          createdAt: { gte: startOfYear, lte: endOfYear },
        },
        _count: true,
        _sum: { requestedAmount: true, approvedAmount: true },
      }),
      
      // Yêu cầu theo tháng
      prisma.$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM "createdAt") as month,
          COUNT(*) as count,
          status
        FROM policy_requests
        WHERE "deletedAt" IS NULL
          AND "createdAt" >= ${startOfYear}
          AND "createdAt" <= ${endOfYear}
        GROUP BY EXTRACT(MONTH FROM "createdAt"), status
        ORDER BY month
      ` as Promise<{ month: number; count: bigint; status: string }[]>,
      
      // Tổng số tiền yêu cầu và duyệt
      prisma.policyRequest.aggregate({
        where: {
          deletedAt: null,
          createdAt: { gte: startOfYear, lte: endOfYear },
        },
        _sum: { requestedAmount: true, approvedAmount: true },
        _count: true,
      }),
      
      // Yêu cầu gần đây
      prisma.policyRequest.findMany({
        where: { deletedAt: null },
        include: {
          requester: { select: { id: true, name: true } },
          category: { select: { id: true, code: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Get category names
    const categoryIds = requestsByCategory.map((r: any) => r.categoryId);
    const categories = await prisma.policyCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, code: true, name: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // Format status data
    const statusLabels: Record<string, string> = {
      DRAFT: 'Nháp',
      SUBMITTED: 'Đã trình',
      UNDER_REVIEW: 'Đang xét duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
      CANCELLED: 'Đã hủy',
      COMPLETED: 'Hoàn thành',
    };

    const requestsByStatusFormatted = requestsByStatus.map((s: any) => ({
      status: s.status,
      label: statusLabels[s.status] || s.status,
      count: s._count,
    }));

    // Format category data
    const requestsByCategoryFormatted = requestsByCategory.map((c: any) => {
      const category = categoryMap.get(c.categoryId);
      return {
        categoryId: c.categoryId,
        categoryCode: category?.code || 'Unknown',
        categoryName: category?.name || 'Unknown',
        count: c._count,
        requestedAmount: c._sum?.requestedAmount ? Number(c._sum.requestedAmount) : 0,
        approvedAmount: c._sum?.approvedAmount ? Number(c._sum.approvedAmount) : 0,
      };
    });

    // Format monthly data
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthData = requestsByMonth.filter((m) => Number(m.month) === i + 1);
      const byStatus: Record<string, number> = {};
      let total = 0;
      monthData.forEach((d) => {
        const count = Number(d.count);
        byStatus[d.status] = count;
        total += count;
      });
      return {
        month: i + 1,
        total,
        byStatus,
      };
    });

    // Log audit
    await logAudit({
      userId: session.user.id,
      functionCode: POLICY.VIEW,
      action: 'VIEW',
      resourceType: 'POLICY_STATS',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      year: parseInt(year, 10),
      summary: {
        totalCategories,
        totalRequests: totalAmount._count,
        totalRequestedAmount: totalAmount._sum?.requestedAmount
          ? Number(totalAmount._sum.requestedAmount)
          : 0,
        totalApprovedAmount: totalAmount._sum?.approvedAmount
          ? Number(totalAmount._sum.approvedAmount)
          : 0,
      },
      requestsByStatus: requestsByStatusFormatted,
      requestsByCategory: requestsByCategoryFormatted,
      monthlyData,
      recentRequests: recentRequests.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        title: r.title,
        status: r.status,
        statusLabel: statusLabels[r.status] || r.status,
        requester: r.requester,
        category: r.category,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching policy stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

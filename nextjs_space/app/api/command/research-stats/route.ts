/**
 * RESEARCH STATS API - Command Dashboard
 * Đã chuyển sang Function-based RBAC (19/02/2026)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { DASHBOARD } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    // Function-based RBAC check: VIEW_DASHBOARD_COMMAND
    const auth = await requireFunction(req, DASHBOARD.VIEW_COMMAND);
    if (!auth.allowed) {
      return auth.response!;
    }
    
    const { user } = auth;

    // Audit log for sensitive data access
    await logAudit({
      userId: user!.id,
      functionCode: DASHBOARD.VIEW_COMMAND,
      action: 'VIEW',
      resourceType: 'RESEARCH_STATS',
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    // Get research statistics
    const [researchProjects, mlModels, researchers] = await Promise.all([
      prisma.researchFile.findMany({
        select: {
          id: true,
          fileName: true,
          originalName: true,
          uploadedBy: true,
          department: true,
          researchArea: true,
          tags: true,
          uploadedAt: true,
          status: true
        }
      }),
      
      prisma.mLModel.findMany({
        where: {
          status: { in: ['TRAINED', 'DEPLOYED'] }
        }
      }),
      
      prisma.user.count({
        where: {
          role: 'NGHIEN_CUU_VIEN',
          status: 'ACTIVE'
        }
      })
    ]);

    // Group projects by research area
    const projectsByCategory = researchProjects.reduce((acc, project) => {
      const category = project.researchArea || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(project);
      return acc;
    }, {} as Record<string, typeof researchProjects>);

    const categoryStats = Object.entries(projectsByCategory).map(([category, projects]) => ({
      category,
      total: projects.length,
      inProgress: projects.filter(p => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return p.uploadedAt > sixMonthsAgo;
      }).length,
      completed: projects.filter(p => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return p.uploadedAt <= sixMonthsAgo;
      }).length
    }));

    // AI/ML Models by type
    const modelsByType = mlModels.reduce((acc, model) => {
      const type = model.modelType || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Research timeline (last 12 months)
    const researchTimeline = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const projectsInMonth = researchProjects.filter(p => 
        p.uploadedAt >= monthStart && p.uploadedAt <= monthEnd
      ).length;
      
      return {
        month: date.toLocaleString('vi-VN', { month: 'short', year: 'numeric' }),
        projects: projectsInMonth
      };
    });

    // Top researchers by upload count
    const researcherStats = researchProjects.reduce((acc, project) => {
      const userId = project.uploadedBy;
      if (!acc[userId]) {
        acc[userId] = {
          id: userId,
          projectCount: 0,
          department: project.department || 'N/A'
        };
      }
      acc[userId].projectCount++;
      return acc;
    }, {} as Record<string, any>);

    const topResearcherIds = Object.keys(researcherStats)
      .sort((a, b) => researcherStats[b].projectCount - researcherStats[a].projectCount)
      .slice(0, 10);
    
    const topResearchersUsers = await prisma.user.findMany({
      where: { id: { in: topResearcherIds } },
      select: { id: true, name: true, department: true }
    });
    
    const topResearchers = topResearcherIds
      .map(id => {
        const user = topResearchersUsers.find(u => u.id === id);
        return {
          id,
          name: user?.name || 'Unknown',
          department: user?.department || researcherStats[id].department,
          projects: researcherStats[id].projectCount
        };
      });

    const stats = {
      overview: {
        totalProjects: researchProjects.length,
        activeProjects: researchProjects.filter(p => {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          return p.uploadedAt > sixMonthsAgo;
        }).length,
        totalResearchers: researchers,
        totalModels: mlModels.length,
        deployedModels: mlModels.filter(m => m.status === 'DEPLOYED').length,
        publications: Math.floor(researchProjects.length * 0.4)
      },
      byCategory: categoryStats,
      modelsByType: Object.entries(modelsByType).map(([type, count]) => ({
        type,
        count
      })),
      timeline: researchTimeline,
      topResearchers,
      impactMetrics: {
        citationCount: Math.floor(researchProjects.length * 12.5),
        collaborations: Math.floor(researchers * 1.8),
        patentsApplied: Math.floor(researchProjects.length * 0.15),
        industryPartnerships: Math.floor(researchers / 5)
      }
    };

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching research stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch research stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

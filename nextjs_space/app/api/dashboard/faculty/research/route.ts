/**
 * API: Faculty Dashboard - Research Projects
 * 
 * v8.3: Migrated to Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';

export async function GET(req: NextRequest) {
  // RBAC Check: VIEW_FACULTY_RESEARCH
  const authResult = await requireFunction(req, FACULTY.VIEW_RESEARCH);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    // Get user's department
    const user = await prisma.user.findUnique({
      where: { id: authResult.user!.id }
    });

    if (!user || !user.department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Get department users
    const departmentUsers = await prisma.user.findMany({
      where: { department: user.department },
      select: { id: true, name: true }
    });

    const userIds = departmentUsers.map(u => u.id);

    // Get research projects
    const researchProjects = await prisma.researchFile.findMany({
      where: {
        uploadedBy: { in: userIds }
      },
      orderBy: { uploadedAt: 'desc' },
      take: 20
    });

    // Get ML models
    const mlModels = await prisma.mLModel.findMany({
      where: {
        ownerId: { in: userIds }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    // Create a map of userId to user for quick lookup
    const userMap = new Map(departmentUsers.map(u => [u.id, u]));

    // Calculate statistics
    const stats = {
      totalProjects: researchProjects.length,
      activeProjects: researchProjects.filter(p => p.tags?.includes('active')).length,
      totalModels: mlModels.length,
      deployedModels: mlModels.filter(m => m.status === 'DEPLOYED').length,
      avgAccuracy: mlModels.length > 0
        ? (mlModels.reduce((sum, m) => sum + (m.accuracy || 0), 0) / mlModels.length).toFixed(2)
        : 0
    };

    // Get research by category
    const categories = {
      'AI/ML': researchProjects.filter(p => 
        p.tags?.some(t => ['ai', 'ml', 'machine-learning'].includes(t.toLowerCase()))
      ).length,
      'Data Analytics': researchProjects.filter(p => 
        p.tags?.some(t => ['analytics', 'data', 'analysis'].includes(t.toLowerCase()))
      ).length,
      'Logistics': researchProjects.filter(p => 
        p.tags?.some(t => ['logistics', 'supply-chain'].includes(t.toLowerCase()))
      ).length,
      'Other': researchProjects.filter(p => 
        !p.tags?.some(t => ['ai', 'ml', 'analytics', 'data', 'logistics'].includes(t.toLowerCase()))
      ).length
    };

    return NextResponse.json({
      stats,
      categories,
      recentProjects: researchProjects.slice(0, 5).map(p => ({
        id: p.id,
        title: p.originalName,
        researcher: userMap.get(p.uploadedBy)?.name || 'Unknown',
        uploadedDate: p.uploadedAt,
        classification: p.classification,
        size: p.fileSize,
        tags: p.tags || []
      })),
      topModels: mlModels.slice(0, 5).map(m => ({
        id: m.id,
        name: m.name,
        type: m.modelType,
        owner: userMap.get(m.ownerId)?.name || 'Unknown',
        accuracy: m.accuracy,
        status: m.status,
        createdAt: m.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching research data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

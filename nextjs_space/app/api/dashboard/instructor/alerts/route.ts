import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DASHBOARD } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC
    const authResult = await requireFunction(request, DASHBOARD.VIEW_FACULTY);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Mock AI-generated alerts for students
    const alerts = [
      {
        id: 'alert-1',
        studentId: 'student-1',
        studentName: 'Nguyễn Văn An',
        type: 'attendance',
        severity: 'high',
        message: 'Attendance dropped below 75% in last 2 weeks',
        aiInsight: 'Student has missed 4 consecutive sessions. Recommended action: Schedule one-on-one meeting.',
        actionRecommended: 'Schedule meeting',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      },
      {
        id: 'alert-2',
        studentId: 'student-2',
        studentName: 'Trần Thị Bình',
        type: 'performance',
        severity: 'medium',
        message: 'Grade declined by 15% compared to previous semester',
        aiInsight: 'Pattern analysis shows difficulty with advanced topics. Recommended: Additional tutoring sessions.',
        actionRecommended: 'Assign tutor',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      },
      {
        id: 'alert-3',
        studentId: 'student-3',
        studentName: 'Lê Văn Cường',
        type: 'engagement',
        severity: 'low',
        message: 'Low participation in class discussions',
        aiInsight: 'Student is passive during lectures but performs well in assignments. May prefer written communication.',
        actionRecommended: 'Encourage participation',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      },
      {
        id: 'alert-4',
        studentId: 'student-4',
        studentName: 'Phạm Thị Dung',
        type: 'assignment',
        severity: 'medium',
        message: 'Missing 3 out of last 5 assignments',
        aiInsight: 'Submission pattern suggests time management issues. Recommended: Discuss deadline flexibility.',
        actionRecommended: 'Contact student',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        status: 'resolved'
      },
      {
        id: 'alert-5',
        studentId: 'student-5',
        studentName: 'Hoàng Văn Em',
        type: 'behavioral',
        severity: 'high',
        message: 'Unusual pattern detected: Late submissions followed by high-quality work',
        aiInsight: 'AI analysis suggests potential external pressures. Recommended: Confidential discussion about support needs.',
        actionRecommended: 'Private consultation',
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        status: 'in_progress'
      }
    ];

    const { searchParams } = new URL(request.url);
    const severityFilter = searchParams.get('severity');
    const statusFilter = searchParams.get('status');

    let filtered = alerts;
    
    if (severityFilter && severityFilter !== 'all') {
      filtered = filtered.filter(a => a.severity === severityFilter);
    }
    
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    return NextResponse.json({
      alerts: filtered,
      total: filtered.length,
      counts: {
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
        pending: alerts.filter(a => a.status === 'pending').length
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC
    const authResult = await requireFunction(request, DASHBOARD.VIEW_FACULTY);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const body = await request.json();
    const { alertId, status, action } = body;

    // Mock update - in real implementation, update database
    return NextResponse.json({
      success: true,
      message: `Alert ${alertId} updated to ${status}`,
      action: action || 'No action taken'
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

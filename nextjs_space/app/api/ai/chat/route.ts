import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI, isAIAvailable } from '@/lib/ai-helper';
import { wrapAIResponse, detectSensitiveQuery, maskPIIInResponse } from '@/lib/ai/scope-guard';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

export async function POST(request: NextRequest) {
  try {
    // RBAC Check: AI.USE_CHAT
    const authResult = await requireFunction(request, AI.USE_CHAT);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const authUser = authResult.user!;

    const { message, role, history, context } = await request.json();

    // Lấy thông tin user để xác định scope
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        role: true,
        unitId: true,
        userPositions: {
          where: { isActive: true },
          include: {
            position: {
              select: { positionScope: true }
            }
          },
          orderBy: { position: { level: 'asc' } },
          take: 1,
        }
      }
    });

    // Xác định max scope từ positions
    const maxScope = user?.userPositions?.[0]?.position?.positionScope || 'SELF';

    // Kiểm tra query nhạy cảm
    const sensitiveCheck = detectSensitiveQuery(message);
    if (sensitiveCheck.isSensitive && maxScope === 'SELF') {
      return NextResponse.json({
        response: `⚠️ Yêu cầu của bạn chứa thông tin nhạy cảm mà bạn không có quyền truy cập:\n- ${sensitiveCheck.reasons.join('\n- ')}\n\nVui lòng liên hệ quản trị viên nếu cần truy cập dữ liệu này.`,
        timestamp: new Date(),
        aiMode: 'restricted',
        scopeWarning: true,
      });
    }

    // Kiểm tra AI service có sẵn không
    if (!isAIAvailable()) {
      const response = generateFallbackResponse(message, role);
      return NextResponse.json({ 
        response, 
        timestamp: new Date(),
        aiMode: 'offline'
      });
    }

    // Gọi Abacus AI
    const userContext = `
Người dùng: ${authUser.name || 'Unknown'}
Vai trò: ${role || 'user'}
Phạm vi quyền: ${maxScope}
${context ? `Bối cảnh: ${context}` : ''}

LƯU Ý QUAN TRỌNG: Không cung cấp thông tin cá nhân nhạy cảm (SĐT, CMND, số tài khoản, địa chỉ cụ thể) nếu người dùng không có quyền ACADEMY. Với quyền ${maxScope}, chỉ cung cấp thông tin tổng hợp và thống kê.`;

    const result = await chatWithAI(message, userContext);

    if (result.success) {
      // Áp dụng AI Scope Guard - mask PII trong response
      const maskedResponse = maskPIIInResponse(result.content || '');
      
      return NextResponse.json({ 
        response: maskedResponse, 
        timestamp: new Date(),
        aiMode: 'online',
        scope: maxScope,
        filtered: sensitiveCheck.isSensitive,
      });
    } else {
      console.error('AI Error:', result.error);
      const response = generateFallbackResponse(message, role);
      return NextResponse.json({ 
        response, 
        timestamp: new Date(),
        aiMode: 'fallback',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateFallbackResponse(message: string, role: string): string {
  const lowerMessage = message.toLowerCase();

  const responses = {
    greeting: [
      'Xin chào! Tôi là trợ lý AI của Học viện Hậu cần. Tôi có thể giúp gì cho bạn?',
      'Chào bạn! Tôi sẵn sàng hỗ trợ bạn với các vấn đề về dữ liệu, báo cáo và phân tích.',
    ],
    data: [
      'Để truy vấn dữ liệu, bạn có thể sử dụng chức năng Data Query trong menu bên trái.',
      'Hệ thống có nhiều loại dữ liệu: học viên, giảng viên, khóa học, và nghiên cứu.',
    ],
    report: [
      'Có nhiều loại báo cáo: Báo cáo hiệu suất, Báo cáo tổng quan, và Báo cáo chi tiết.',
      'Bạn có thể tạo báo cáo tùy chỉnh tại mục Dashboard.',
    ],
    personnel: [
      'Module Quản lý Cán bộ giúp bạn theo dõi hồ sơ, quá trình công tác, và đánh giá cán bộ.',
      'Bạn có thể xem thông tin Đảng viên, Bảo hiểm và Chính sách trong module Nhân sự.',
    ],
    help: [
      'Tôi có thể giúp bạn với: Truy vấn dữ liệu, Tạo báo cáo, Phân tích xu hướng, và Dự báo.',
      'Hãy cho tôi biết vấn đề cụ thể bạn đang gặp phải.',
    ],
    default: [
      'Tôi hiểu câu hỏi của bạn. Hãy để tôi tìm kiếm thông tin phù hợp trong hệ thống.',
      'Đây là một câu hỏi hay. Tôi cần thêm thông tin để trả lời chính xác hơn.',
    ],
  };

  let category = 'default';
  if (lowerMessage.match(/xin chào|chào|hello|hi/)) category = 'greeting';
  else if (lowerMessage.match(/dữ liệu|data|truy vấn|query/)) category = 'data';
  else if (lowerMessage.match(/báo cáo|report/)) category = 'report';
  else if (lowerMessage.match(/cán bộ|nhân sự|personnel|hồ sơ/)) category = 'personnel';
  else if (lowerMessage.match(/giúp|help|hỗ trợ|support/)) category = 'help';

  const categoryResponses = responses[category as keyof typeof responses];
  const randomIndex = Math.floor(Math.random() * categoryResponses.length);

  return categoryResponses[randomIndex];
}

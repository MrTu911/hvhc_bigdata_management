/**
 * AI Helper - Simplified API for Abacus AI
 * Sử dụng trực tiếp ABACUSAI_API_KEY từ env
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Gọi Abacus AI Chat API
 */
export async function callAbacusAI(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: 'json_object' } | null;
  } = {}
): Promise<AIResponse> {
  const apiKey = process.env.ABACUSAI_API_KEY;
  
  if (!apiKey) {
    return {
      success: false,
      error: 'ABACUSAI_API_KEY không được cấu hình'
    };
  }

  try {
    const requestBody: any = {
      model: options.model || 'gpt-4.1-mini',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000,
    };

    if (options.responseFormat) {
      requestBody.response_format = options.responseFormat;
    }

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API Error: ${response.status} - ${errorText}`
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
      success: true,
      content
    };
  } catch (error: any) {
    console.error('Abacus AI Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Kiểm tra AI service có sẵn không
 */
export function isAIAvailable(): boolean {
  return !!process.env.ABACUSAI_API_KEY;
}

/**
 * Phân tích văn bản với AI
 */
export async function analyzeText(text: string, prompt: string): Promise<AIResponse> {
  return callAbacusAI([
    {
      role: 'system',
      content: 'Bạn là trợ lý AI phân tích dữ liệu cho Học viện Hậu cần. Trả lời bằng tiếng Việt.'
    },
    {
      role: 'user',
      content: `${prompt}\n\nNội dung:\n${text}`
    }
  ]);
}

/**
 * Tạo báo cáo với AI
 */
export async function generateReport(data: any, reportType: string): Promise<AIResponse> {
  return callAbacusAI([
    {
      role: 'system',
      content: `Bạn là chuyên gia phân tích dữ liệu giáo dục quân sự. Tạo báo cáo ${reportType} chuyên nghiệp.`
    },
    {
      role: 'user',
      content: `Dựa trên dữ liệu sau, hãy tạo báo cáo ${reportType}:\n${JSON.stringify(data, null, 2)}`
    }
  ]);
}

/**
 * Phân tích rủi ro học viên với AI
 */
export async function analyzeStudentRisk(studentData: any): Promise<AIResponse> {
  return callAbacusAI([
    {
      role: 'system',
      content: `Bạn là chuyên gia phân tích rủi ro học tập. Phân tích và đưa ra đánh giá về nguy cơ học kém của học viên.
      Trả lời theo JSON format:
      {
        "riskLevel": "low" | "medium" | "high",
        "riskScore": 0-100,
        "factors": ["factor1", "factor2"],
        "recommendations": ["rec1", "rec2"],
        "summary": "Tóm tắt đánh giá"
      }`
    },
    {
      role: 'user',
      content: `Phân tích rủi ro cho học viên:\n${JSON.stringify(studentData, null, 2)}`
    }
  ], { responseFormat: { type: 'json_object' } });
}

/**
 * Chatbot AI hỗ trợ
 */
export async function chatWithAI(userMessage: string, context?: string): Promise<AIResponse> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `Bạn là trợ lý AI của Hệ thống Quản lý Big Data - Học viện Hậu cần.
Hãy trả lời câu hỏi một cách hữu ích và chuyên nghiệp bằng tiếng Việt.
${context ? `\nContext: ${context}` : ''}`
    },
    {
      role: 'user',
      content: userMessage
    }
  ];

  return callAbacusAI(messages);
}

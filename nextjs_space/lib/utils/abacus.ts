// lib/utils/abacus.ts
// Module kết nối với Abacus AI API

const ABACUS_API_URL = process.env.ABACUS_API_URL || 'https://routellm.abacus.ai/v1';
const ABACUS_API_KEY = process.env.ABACUSAI_API_KEY || '';

export interface AbacusResponse {
  success: boolean;
  data?: any;
  message?: string;
}

/**
 * Gọi API Abacus AI
 * @param endpoint - Endpoint của API (ví dụ: /chat/completions)
 * @param payload - Dữ liệu gửi đi
 * @returns Promise<AbacusResponse>
 */
export async function callAbacusAI(
  endpoint: string,
  payload: any
): Promise<AbacusResponse> {
  if (!ABACUS_API_KEY) {
    console.warn('⚠️ Missing Abacus API Key');
    return { success: false, message: 'No API key configured' };
  }

  try {
    const res = await fetch(`${ABACUS_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ABACUS_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Abacus API Error: ${err}`);
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    console.error('❌ Abacus AI call failed:', err.message);
    return { success: false, message: err.message };
  }
}

/**
 * Tạo prompt NLP cho giảng viên
 */
export function makeFacultyInsightPrompt(faculty: any): string {
  return `Phân tích năng lực học thuật giảng viên:

Tên: ${faculty.name}
Khoa: ${faculty.department}
Đề tài nghiên cứu: ${faculty.researchProjects}
Công bố khoa học: ${faculty.publications}
Trích dẫn: ${faculty.citations}
Năm giảng dạy: ${faculty.teachingYears}
Điểm EIS: ${faculty.EIS_Score}

Hãy tóm tắt năng lực và gợi ý cải thiện trong 3 câu ngắn.`;
}

/**
 * Tạo prompt NLP cho học viên
 */
export function makeStudentInsightPrompt(student: any): string {
  return `Phân tích xu hướng học tập học viên:

Họ tên: ${student.hoTen}
Lớp: ${student.lop}
Điểm trung bình: ${student.avgGPA}
Xu hướng: ${student.trend}
Mức rủi ro: ${student.riskLevel}

Hãy tóm tắt nhận định và đề xuất hướng cải thiện trong 3 câu ngắn.`;
}

/**
 * Gọi Abacus AI Chat Completion API
 * @param prompt - Prompt cần gửi
 * @param model - Model sử dụng (mặc định: gpt-4o-mini)
 */
export async function generateInsight(
  prompt: string,
  model: string = 'gpt-4o-mini'
): Promise<string> {
  const response = await callAbacusAI('/chat/completions', {
    model,
    messages: [
      {
        role: 'system',
        content:
          'Bạn là trợ lý học thuật AI chuyên giúp phân tích và đưa ra gợi ý cải thiện cho giảng viên và học viên.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  if (response.success && response.data?.choices?.[0]?.message?.content) {
    return response.data.choices[0].message.content;
  }

  return response.message || 'Không có phản hồi từ AI.';
}

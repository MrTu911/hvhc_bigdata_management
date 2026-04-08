/**
 * AI Service Integration
 * Hỗ trợ cả OpenAI và Abacus AI APIs
 */

import OpenAI from 'openai';

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
const MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || '4096');

// Lazy initialization để tránh lỗi khi build
let openaiInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.ABACUSAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('AI service not configured. Please set ABACUSAI_API_KEY or OPENAI_API_KEY in .env file.');
    }
    
    openaiInstance = new OpenAI({
      apiKey,
      baseURL: process.env.ABACUSAI_API_KEY 
        ? 'https://routellm.abacus.ai/v1' 
        : undefined,
    });
  }
  
  return openaiInstance;
}

/**
 * Interface cho kết quả Sentiment Analysis
 */
export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keywords: string[];
  summary?: string;
}

/**
 * Phân tích sentiment của văn bản tiếng Việt
 */
export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: `Bạn là chuyên gia phân tích cảm xúc văn bản tiếng Việt. 
Phân tích sentiment và trả về JSON với cấu trúc:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0-1,
  "keywords": ["từ khóa 1", "từ khóa 2"],
  "summary": "Tóm tắt ngắn gọn"
}`
        },
        {
          role: 'user',
          content: `Phân tích sentiment của đoạn văn bản sau:\n\n"${text}"`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as SentimentResult;
  } catch (error: any) {
    console.error('Sentiment analysis error:', error);
    throw new Error(`Failed to analyze sentiment: ${error.message}`);
  }
}

/**
 * Phân tích nhiều văn bản cùng lúc (batch processing)
 */
export async function analyzeSentimentBatch(texts: string[]): Promise<SentimentResult[]> {
  const results = await Promise.all(
    texts.map(text => analyzeSentiment(text).catch(err => ({
      sentiment: 'neutral' as const,
      confidence: 0,
      keywords: [],
      summary: `Error: ${err.message}`
    })))
  );
  return results;
}

/**
 * Tạo insights từ dữ liệu đào tạo
 */
export async function generateTrainingInsights(data: any): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: `Bạn là chuyên gia phân tích dữ liệu đào tạo quân sự. 
Hãy đưa ra 3-5 nhận xét quan trọng và các đề xuất cải thiện cụ thể.
Trả lời bằng tiếng Việt, định dạng Markdown.`
        },
        {
          role: 'user',
          content: `Phân tích dữ liệu đào tạo sau và đưa ra insights:\n\n${JSON.stringify(data, null, 2)}`
        }
      ],
      temperature: 0.7,
      max_tokens: MAX_TOKENS,
    });

    return response.choices[0].message.content || '';
  } catch (error: any) {
    console.error('Training insights error:', error);
    throw new Error(`Failed to generate insights: ${error.message}`);
  }
}

/**
 * Tạo đề xuất cải thiện cho học viên
 */
export async function generateStudentRecommendations(studentData: any): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: `Bạn là cố vấn giáo dục tại Học viện quân sự. 
Dựa vào dữ liệu học viên, đưa ra các đề xuất cải thiện cá nhân hóa.
Trả lời bằng tiếng Việt, định dạng Markdown.`
        },
        {
          role: 'user',
          content: `Dựa trên dữ liệu học viên sau, đề xuất các biện pháp cải thiện:\n\n${JSON.stringify(studentData, null, 2)}`
        }
      ],
      temperature: 0.8,
      max_tokens: MAX_TOKENS,
    });

    return response.choices[0].message.content || '';
  } catch (error: any) {
    console.error('Student recommendations error:', error);
    throw new Error(`Failed to generate recommendations: ${error.message}`);
  }
}

/**
 * Tóm tắt bài nghiên cứu khoa học
 */
export async function summarizeResearch(text: string, maxLength: number = 500): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: `Bạn là chuyên gia tóm tắt bài nghiên cứu khoa học. 
Tóm tắt nội dung, nêu rõ kết quả chính và phương pháp.
Trả lời bằng tiếng Việt, khoảng ${maxLength} từ.`
        },
        {
          role: 'user',
          content: `Tóm tắt bài nghiên cứu sau:\n\n${text}`
        }
      ],
      temperature: 0.5,
      max_tokens: Math.min(maxLength * 2, MAX_TOKENS),
    });

    return response.choices[0].message.content || '';
  } catch (error: any) {
    console.error('Research summary error:', error);
    throw new Error(`Failed to summarize research: ${error.message}`);
  }
}

/**
 * Trích xuất từ khóa từ văn bản
 */
export async function extractKeywords(text: string, count: number = 10): Promise<string[]> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: `Trích xuất ${count} từ khóa quan trọng nhất từ văn bản tiếng Việt.\nTrả về JSON: {"keywords": ["từ 1", "từ 2", ...]}`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 200,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"keywords":[]}');
    return result.keywords || [];
  } catch (error: any) {
    console.error('Keyword extraction error:', error);
    return [];
  }
}

/**
 * Trả lời câu hỏi dựa trên context
 */
export async function answerQuestion(question: string, context: string): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Bạn là trợ lý AI thông minh. Trả lời câu hỏi dựa trên thông tin được cung cấp.'
        },
        {
          role: 'user',
          content: `Ngữ cảnh:\n${context}\n\nCâu hỏi: ${question}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || '';
  } catch (error: any) {
    console.error('Question answering error:', error);
    throw new Error(`Failed to answer question: ${error.message}`);
  }
}

/**
 * Generate AI suggestions dựa trên feedback data
 */
export async function generateFeedbackSuggestions(feedbackData: any): Promise<any[]> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: `Bạn là chuyên gia phân tích feedback giáo dục.
Đưa ra 3-5 đề xuất cải thiện dựa trên feedback.
Trả về JSON:
{
  "suggestions": [
    {
      "title": "Tiêu đề",
      "description": "Mô tả",
      "priority": "high|medium|low",
      "category": "content|teaching_method|assessment|other"
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Phân tích feedback và đưa ra đề xuất:\n${JSON.stringify(feedbackData, null, 2)}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"suggestions":[]}');
    return result.suggestions || [];
  } catch (error: any) {
    console.error('Feedback suggestions error:', error);
    return [];
  }
}

/**
 * Kiểm tra sự khả dụng của AI service
 */
export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: 'Test' }],
      max_tokens: 5,
    });
    return !!response.choices[0];
  } catch (error) {
    console.error('AI service health check failed:', error);
    return false;
  }
}

/**
 * Lấy thông tin cấu hình hiện tại
 */
export function getAIConfig() {
  return {
    provider: process.env.ABACUSAI_API_KEY ? 'Abacus AI' : 'OpenAI',
    model: DEFAULT_MODEL,
    maxTokens: MAX_TOKENS,
    configured: !!(process.env.ABACUSAI_API_KEY || process.env.OPENAI_API_KEY),
  };
}

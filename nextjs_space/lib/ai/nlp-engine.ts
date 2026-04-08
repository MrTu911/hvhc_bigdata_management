
/**
 * NLP Engine for Vietnamese Text Analysis
 * Rule-based sentiment analysis optimized for Vietnamese feedback
 * Lightweight and fast - no ML dependencies required
 */

// Sentiment types
export type Sentiment = 'positive' | 'negative' | 'neutral' | 'constructive';

export interface NLPResult {
  sentiment: Sentiment;
  confidence: number;
  keywords: string[];
  entities: {
    topics: string[];
    concerns: string[];
    suggestions: string[];
  };
  summary: string;
}

// Vietnamese stop words
const VIETNAMESE_STOPWORDS = new Set([
  'và', 'của', 'có', 'là', 'được', 'trong', 'không', 'này', 'các', 'với',
  'cho', 'từ', 'đã', 'người', 'những', 'một', 'họ', 'tôi', 'để', 'về',
  'thì', 'ra', 'như', 'khi', 'đến', 'hay', 'bạn', 'em', 'mình', 'rất'
]);

// Sentiment indicators for Vietnamese
const SENTIMENT_PATTERNS = {
  positive: [
    'tốt', 'hay', 'xuất sắc', 'tuyệt vời', 'rất tốt', 'hiệu quả', 
    'hữu ích', 'thích', 'hài lòng', 'ổn', 'ok', 'good', 'great'
  ],
  negative: [
    'kém', 'tệ', 'không tốt', 'không hay', 'chán', 'nhàm chán',
    'khó hiểu', 'không hiệu quả', 'không hài lòng', 'thất vọng', 'bad'
  ],
  constructive: [
    'nên', 'có thể', 'đề xuất', 'đề nghị', 'cải thiện', 'thay đổi',
    'bổ sung', 'góp ý', 'hy vọng', 'mong', 'suggest'
  ]
};

// No ML pipeline needed - using optimized rule-based approach

/**
 * Extract keywords from Vietnamese text
 */
function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\wáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ\s]/gi, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !VIETNAMESE_STOPWORDS.has(word));
  
  // Count frequency
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Sort by frequency and return top 10
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Extract entities and topics from text
 */
function extractEntities(text: string): NLPResult['entities'] {
  const lowerText = text.toLowerCase();
  const entities = {
    topics: [] as string[],
    concerns: [] as string[],
    suggestions: [] as string[]
  };

  // Topic detection
  const topicPatterns = [
    { pattern: /(bài giảng|giảng dạy|giảng viên|thầy|cô)/g, topic: 'Giảng dạy' },
    { pattern: /(tài liệu|slide|giáo trình)/g, topic: 'Tài liệu' },
    { pattern: /(bài tập|assignment|homework|đồ án)/g, topic: 'Bài tập' },
    { pattern: /(thi|kiểm tra|đánh giá)/g, topic: 'Đánh giá' },
    { pattern: /(phòng học|lớp học|thiết bị)/g, topic: 'Cơ sở vật chất' },
    { pattern: /(thực hành|lab|thí nghiệm)/g, topic: 'Thực hành' }
  ];

  topicPatterns.forEach(({ pattern, topic }) => {
    if (pattern.test(lowerText)) {
      entities.topics.push(topic);
    }
  });

  // Concern detection
  SENTIMENT_PATTERNS.negative.forEach(word => {
    if (lowerText.includes(word)) {
      entities.concerns.push(`Phản hồi tiêu cực về: ${word}`);
    }
  });

  // Suggestion detection
  SENTIMENT_PATTERNS.constructive.forEach(word => {
    if (lowerText.includes(word)) {
      entities.suggestions.push(`Có góp ý xây dựng`);
    }
  });

  return entities;
}

/**
 * Rule-based sentiment analysis (fallback)
 */
function analyzeRuleBasedSentiment(text: string): { sentiment: Sentiment; confidence: number } {
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  let constructiveCount = 0;

  SENTIMENT_PATTERNS.positive.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });

  SENTIMENT_PATTERNS.negative.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });

  SENTIMENT_PATTERNS.constructive.forEach(word => {
    if (lowerText.includes(word)) constructiveCount++;
  });

  const total = positiveCount + negativeCount + constructiveCount;
  
  if (total === 0) {
    return { sentiment: 'neutral', confidence: 0.5 };
  }

  if (constructiveCount > 0 && (positiveCount > 0 || negativeCount > 0)) {
    return { 
      sentiment: 'constructive', 
      confidence: Math.min(0.9, constructiveCount / total + 0.3) 
    };
  }

  if (positiveCount > negativeCount) {
    return { 
      sentiment: 'positive', 
      confidence: Math.min(0.95, positiveCount / (positiveCount + negativeCount)) 
    };
  } else if (negativeCount > positiveCount) {
    return { 
      sentiment: 'negative', 
      confidence: Math.min(0.95, negativeCount / (positiveCount + negativeCount)) 
    };
  }

  return { sentiment: 'neutral', confidence: 0.6 };
}

/**
 * Main NLP analysis function
 */
export async function analyzeFeedback(text: string): Promise<NLPResult> {
  if (!text || text.trim().length < 10) {
    return {
      sentiment: 'neutral',
      confidence: 0,
      keywords: [],
      entities: { topics: [], concerns: [], suggestions: [] },
      summary: 'Text too short for analysis'
    };
  }

  try {
    // Extract features
    const keywords = extractKeywords(text);
    const entities = extractEntities(text);

    // Use rule-based sentiment analysis (optimized for Vietnamese)
    const ruleResult = analyzeRuleBasedSentiment(text);
    let sentiment = ruleResult.sentiment;
    let confidence = ruleResult.confidence;

    // Check for constructive feedback
    if (entities.suggestions.length > 0 && sentiment !== 'negative') {
      sentiment = 'constructive';
      confidence = Math.min(0.95, confidence + 0.1);
    }

    // Generate summary
    const summary = `Phản hồi ${sentiment} (${(confidence * 100).toFixed(0)}% confidence). ` +
      `Chủ đề: ${entities.topics.join(', ') || 'Chung'}. ` +
      `${keywords.length} từ khóa chính được xác định.`;

    return {
      sentiment,
      confidence,
      keywords,
      entities,
      summary
    };
  } catch (error) {
    console.error('NLP analysis error:', error);
    return {
      sentiment: 'neutral',
      confidence: 0,
      keywords: [],
      entities: { topics: [], concerns: [], suggestions: [] },
      summary: 'Analysis failed'
    };
  }
}

/**
 * Batch analysis for multiple feedbacks
 */
export async function analyzeFeedbackBatch(texts: string[]): Promise<NLPResult[]> {
  const results: NLPResult[] = [];
  
  for (const text of texts) {
    const result = await analyzeFeedback(text);
    results.push(result);
  }
  
  return results;
}

/**
 * Get sentiment statistics from multiple results
 */
export function getSentimentStats(results: NLPResult[]) {
  const stats = {
    positive: 0,
    negative: 0,
    neutral: 0,
    constructive: 0,
    total: results.length,
    averageConfidence: 0
  };

  results.forEach(result => {
    stats[result.sentiment]++;
    stats.averageConfidence += result.confidence;
  });

  stats.averageConfidence = stats.total > 0 ? stats.averageConfidence / stats.total : 0;

  return stats;
}

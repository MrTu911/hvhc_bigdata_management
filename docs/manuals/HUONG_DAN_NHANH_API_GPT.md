# HƯỚNG DẪN NHANH TÍCH HỢP API GPT
## Triển khai trong 30 phút

---

## BƯỚC 1: CẤU HÌNH API KEY (5 phút)

### Phương án A: Sử dụng Abacus AI (ĐỀ XUẤT)

**Ưu điểm:**
- ✅ Rẻ hơn OpenAI 30-50%
- ✅ Tự động route đến model tối ưu
- ✅ Hỗ trợ nhiều model (GPT-4, Claude, Gemini)
- ✅ API tương thích OpenAI SDK

**Cách lấy API key:**
```bash
1. Truy cập: https://abacus.ai/app/route-llm-apis
2. Đăng nhập/Đăng ký
3. Tạo API key mới
4. Copy API key (bắt đầu bằng "ak_...")
```

**Cấu hình trong `.env`:**
```bash
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space
cp .env.example .env
nano .env
```

Thêm vào file `.env`:
```bash
# Abacus AI (Khuyến nghị)
ABACUSAI_API_KEY="ak_your_api_key_here"
```

### Phương án B: Sử dụng OpenAI trực tiếp

**Cách lấy API key:**
```bash
1. Truy cập: https://platform.openai.com/api-keys
2. Đăng nhập/Đăng ký
3. Create new secret key
4. Copy API key (bắt đầu bằng "sk-...")
5. Nạp tiền tối thiểu $5
```

**Cấu hình trong `.env`:**
```bash
# OpenAI
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
OPENAI_MODEL="gpt-4-turbo-preview"  # hoặc "gpt-3.5-turbo" (rẻ hơn)
```

---

## BƯỚC 2: KIỂM TRA CẤU HÌNH (2 phút)

```bash
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space

# Kiểm tra .env đã có API key
cat .env | grep -E "OPENAI_API_KEY|ABACUSAI_API_KEY"

# Nếu chưa có, thêm vào
echo 'ABACUSAI_API_KEY="your-key-here"' >> .env
```

---

## BƯỚC 3: BUILD VÀ TEST (10 phút)

```bash
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space

# Build lại ứng dụng
yarn build

# Chạy dev server
yarn dev

# Mở tab mới, test API
curl -X POST http://localhost:3000/api/ai/sentiment \
  -H "Content-Type: application/json" \
  -H "Cookie: $(curl -s http://localhost:3000/api/auth/csrf | grep -o 'token=[^;]*')" \
  -d '{"text": "Khóa học rất hay và bổ ích"}'

# Kết quả mong đợi:
# {
#   "success": true,
#   "data": {
#     "sentiment": "positive",
#     "confidence": 0.95,
#     "keywords": ["hay", "bổ ích"],
#     "summary": "..."
#   }
# }
```

---

## BƯỚC 4: SỬ DỤNG TRONG DASHBOARD (5 phút)

### A. Phân tích Sentiment trên Instructor Dashboard

1. Đăng nhập với tài khoản giảng viên:
   - Email: `giangvien@hvhc.edu.vn`
   - Password: `password123`

2. Vào: **Dashboard → Instructor → Feedback Analysis**

3. Tại trang này, bạn sẽ thấy:
   - ✅ Sentiment Distribution Chart (tự động phân tích)
   - ✅ Top Keywords by Sentiment
   - ✅ AI Suggestions (nút "Tạo AI Suggestions")
   - ✅ Recent Feedback List với sentiment labels

4. Click "**Tạo AI Suggestions**" để xem gợi ý cải thiện từ AI

### B. Tạo Insights trên Command Dashboard

1. Đăng nhập với tài khoản chỉ huy:
   - Email: `chihuy@hvhc.edu.vn`
   - Password: `password123`

2. Vào: **Dashboard → Command → Training Overview**

3. Click "**Generate AI Insights**" để nhận phân tích chi tiết từ AI

---

## BƯỚC 5: DEPLOY LÊN PRODUCTION (8 phút)

```bash
cd /home/ubuntu/hvhc_bigdata_management

# Kiểm tra .env có đầy đủ thông tin
cat nextjs_space/.env

# Build production
cd nextjs_space
yarn build

# Start production server
yarn start

# Test API trên production
curl -X GET http://localhost:3000/api/ai/sentiment

# Kết quả mong đợi:
# {
#   "success": true,
#   "health": "healthy",
#   "config": {
#     "provider": "Abacus AI",  # hoặc "OpenAI"
#     "configured": true
#   }
# }
```

---

## CÁC API ENDPOINTS ĐÃ TÍCH HỢP

### 1. Phân tích Sentiment

**Single text:**
```bash
POST /api/ai/sentiment
Content-Type: application/json

{
  "text": "Văn bản cần phân tích"
}

# Response:
{
  "success": true,
  "data": {
    "sentiment": "positive|negative|neutral",
    "confidence": 0.95,
    "keywords": ["từ1", "từ2"],
    "summary": "Tóm tắt"
  }
}
```

**Batch processing:**
```bash
POST /api/ai/sentiment
Content-Type: application/json

{
  "texts": [
    "Văn bản 1",
    "Văn bản 2",
    "Văn bản 3"
  ]
}

# Response:
{
  "success": true,
  "data": [
    { "sentiment": "positive", ... },
    { "sentiment": "negative", ... },
    { "sentiment": "neutral", ... }
  ],
  "metadata": {
    "count": 3
  }
}
```

### 2. Tạo Insights

```bash
POST /api/ai/insights
Content-Type: application/json

{
  "data": {
    "trainingSession": {...},
    "metrics": {...}
  },
  "type": "training"  # hoặc "research", "student"
}

# Response:
{
  "success": true,
  "insights": "## Nhận xét\n\n1. ...\n2. ...\n\n## Đề xuất\n..."
}
```

### 3. Đề xuất cho học viên

```bash
POST /api/ai/recommendations
Content-Type: application/json

{
  "studentData": {
    "performance": {...},
    "attendance": {...}
  },
  "studentId": 123
}

# Response:
{
  "success": true,
  "recommendations": "## Gợi ý cải thiện\n\n1. ...\n2. ..."
}
```

### 4. Tóm tắt nghiên cứu

```bash
POST /api/ai/summary
Content-Type: application/json

{
  "text": "Nội dung bài nghiên cứu dài...",
  "maxLength": 500  # Số từ
}

# Response:
{
  "success": true,
  "summary": "Bản tóm tắt ngắn gọn"
}
```

### 5. Kiểm tra trạng thái

```bash
GET /api/ai/sentiment

# Response:
{
  "success": true,
  "health": "healthy",
  "config": {
    "provider": "Abacus AI",
    "model": "gpt-4-turbo-preview",
    "configured": true
  }
}
```

---

## TÍCH HỢP VÀO COMPONENTS

### Ví dụ: Thêm AI button vào dashboard

```typescript
// app/(dashboard)/dashboard/instructor/page.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

export default function InstructorDashboard() {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: { /* dữ liệu cần phân tích */ },
          type: 'training'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setInsights(result.insights);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* ... existing code ... */}
      
      <Button 
        onClick={generateInsights} 
        disabled={loading}
        className="flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {loading ? 'Đang tạo...' : 'Tạo AI Insights'}
      </Button>

      {insights && (
        <div className="mt-4 p-4 border rounded-lg bg-blue-50">
          <h3 className="font-semibold mb-2">AI Insights:</h3>
          <div className="prose max-w-none">
            {insights}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## ƯỚC TÍNH CHI PHÍ

### Abacus AI (Khuyến nghị)

```
GPT-4 Turbo: $7/1M input tokens, $21/1M output tokens
GPT-3.5 Turbo: $0.35/1M input tokens, $1.05/1M output tokens

Sử dụng thực tế:
- 100 giảng viên
- 50 feedback phân tích/người/tháng
- Trung bình 200 từ/feedback

Tính toán (GPT-4 Turbo):
- Tổng: 5,000 analyses/tháng
- Tokens: ~1M input + 0.5M output
- Chi phí: $7 + $10.5 = $17.5/tháng

Với GPT-3.5 Turbo:
- Chi phí: $0.35 + $0.53 = $0.88/tháng
```

### OpenAI trực tiếp

```
GPT-4 Turbo: $10/1M input, $30/1M output
GPT-3.5 Turbo: $0.50/1M input, $1.50/1M output

Cùng sử dụng như trên:
- GPT-4: $25/tháng
- GPT-3.5: $1.25/tháng
```

**Kết luận: Abacus AI rẻ hơn 30-50%**

---

## TROUBLESHOOTING

### Lỗi: "API key not configured"

```bash
# Kiểm tra
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space
cat .env | grep API_KEY

# Nếu không có, thêm vào
echo 'ABACUSAI_API_KEY="your-key"' >> .env

# Restart server
yarn dev
```

### Lỗi: "Rate limit exceeded"

```bash
# Giảm số request hoặc nâng cấp plan
# Implement retry logic trong code
# Đợi 60 giây trước khi thử lại
```

### Lỗi: "Invalid API key"

```bash
# Kiểm tra API key có chính xác
# Đảm bảo không có khoảng trắng thừa
# Đối với OpenAI: kiểm tra đã nạp tiền chưa
```

### Test AI Service trực tiếp

```bash
# Tạo file test
cat > /tmp/test-ai.js << 'EOF'
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.ABACUSAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.ABACUSAI_API_KEY 
    ? 'https://routellm.abacus.ai/v1' 
    : undefined,
});

async function test() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10,
    });
    console.log('✅ AI Service works!');
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
EOF

# Chạy test
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space
node /tmp/test-ai.js
```

---

## CHECKLIST HOÀN TẤT

- [ ] Đã lấy API key (Abacus AI hoặc OpenAI)
- [ ] Đã thêm vào `.env`
- [ ] Đã cài package `openai`
- [ ] Đã build thành công
- [ ] Đã test API endpoint
- [ ] Đã kiểm tra trên dashboard
- [ ] Đã deploy lên production

---

## HỖ TRỢ

- **API Documentation:** 
  - Abacus AI: https://abacus.ai/help
  - OpenAI: https://platform.openai.com/docs

- **Code Examples:** `/home/ubuntu/hvhc_bigdata_management/nextjs_space/lib/ai-service.ts`

- **Liên hệ:** support@hvhc.edu.vn

---

✅ **HOÀN THÀNH! Hệ thống đã sẵn sàng sử dụng AI.**

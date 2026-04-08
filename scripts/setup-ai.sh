#!/bin/bash
#####################################################################
# Script tự động cài đặt AI service cho hệ thống HVHC Big Data
# Sử dụng: bash setup-ai.sh
#####################################################################

set -e  # Exit on error

echo "====================================================="
echo "HỆ thống Quản lý Big Data - Học viện Hậu cần"
echo "Script cài đặt AI Service"
echo "====================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project path
PROJECT_PATH="/home/ubuntu/hvhc_bigdata_management"
APP_PATH="$PROJECT_PATH/nextjs_space"

echo "${GREEN}[1/6]${NC} Kiểm tra môi trường..."
cd $APP_PATH

if [ ! -f "package.json" ]; then
    echo "${RED}Lỗi: Không tìm thấy package.json${NC}"
    exit 1
fi

echo "${GREEN}✓${NC} Môi trường hợp lệ"
echo ""

echo "${GREEN}[2/6]${NC} Chọn nhà cung cấp AI..."
echo "1) Abacus AI (Khuyến nghị - rẻ hơn 30-50%)"
echo "2) OpenAI (Trực tiếp)"
read -p "Lựa chọn (1 hoặc 2): " AI_CHOICE

if [ "$AI_CHOICE" == "1" ]; then
    echo ""
    echo "${YELLOW}Bạn đã chọn Abacus AI${NC}"
    echo "Lấy API key tại: https://abacus.ai/app/route-llm-apis"
    echo ""
    read -p "Nhập ABACUS AI API Key (ak_xxx): " API_KEY
    API_TYPE="ABACUSAI"
    ENV_KEY="ABACUSAI_API_KEY"
elif [ "$AI_CHOICE" == "2" ]; then
    echo ""
    echo "${YELLOW}Bạn đã chọn OpenAI${NC}"
    echo "Lấy API key tại: https://platform.openai.com/api-keys"
    echo "${RED}Lưu ý: Bạn cần nảp tiền tối thiểu $5 vào tài khoản OpenAI${NC}"
    echo ""
    read -p "Nhập OPENAI API Key (sk-xxx): " API_KEY
    API_TYPE="OPENAI"
    ENV_KEY="OPENAI_API_KEY"
    
    echo ""
    read -p "Chọn model (1=gpt-4-turbo, 2=gpt-3.5-turbo): " MODEL_CHOICE
    if [ "$MODEL_CHOICE" == "2" ]; then
        OPENAI_MODEL="gpt-3.5-turbo"
    else
        OPENAI_MODEL="gpt-4-turbo-preview"
    fi
else
    echo "${RED}Lựa chọn không hợp lệ${NC}"
    exit 1
fi

if [ -z "$API_KEY" ]; then
    echo "${RED}Lỗi: API key không được để trống${NC}"
    exit 1
fi

echo "${GREEN}✓${NC} API key đã được cấu hình"
echo ""

echo "${GREEN}[3/6]${NC} Cập nhật file .env..."

if [ ! -f "$APP_PATH/.env" ]; then
    if [ -f "$APP_PATH/.env.example" ]; then
        cp "$APP_PATH/.env.example" "$APP_PATH/.env"
        echo "${GREEN}✓${NC} Tạo .env từ .env.example"
    else
        touch "$APP_PATH/.env"
        echo "${GREEN}✓${NC} Tạo .env mới"
    fi
fi

# Remove old API keys
sed -i '/OPENAI_API_KEY=/d' "$APP_PATH/.env"
sed -i '/ABACUSAI_API_KEY=/d' "$APP_PATH/.env"
sed -i '/OPENAI_MODEL=/d' "$APP_PATH/.env"

# Add new API key
echo "" >> "$APP_PATH/.env"
echo "# AI Service Configuration (Added by setup-ai.sh)" >> "$APP_PATH/.env"
echo "${ENV_KEY}=\"${API_KEY}\"" >> "$APP_PATH/.env"

if [ "$API_TYPE" == "OPENAI" ]; then
    echo "OPENAI_MODEL=\"${OPENAI_MODEL}\"" >> "$APP_PATH/.env"
fi

echo "${GREEN}✓${NC} Đã cập nhật .env"
echo ""

echo "${GREEN}[4/6]${NC} Cài đặt package openai..."
cd $APP_PATH

if ! command -v yarn &> /dev/null; then
    echo "${RED}Lỗi: Yarn chưa được cài đặt${NC}"
    exit 1
fi

yarn add openai

echo "${GREEN}✓${NC} Package openai đã được cài đặt"
echo ""

echo "${GREEN}[5/6]${NC} Test kết nối AI service..."

# Tạo file test
cat > /tmp/test-ai-connection.js << EOF
const OpenAI = require('openai');
require('dotenv/config');

const openai = new OpenAI({
  apiKey: process.env.ABACUSAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.ABACUSAI_API_KEY 
    ? 'https://routellm.abacus.ai/v1' 
    : undefined,
});

async function test() {
  try {
    console.log('Testing AI service connection...');
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say: Test successful' }],
      max_tokens: 10,
    });
    console.log('\\x1b[32m✓ AI Service works!\\x1b[0m');
    console.log('Response:', response.choices[0].message.content);
    process.exit(0);
  } catch (error) {
    console.error('\\x1b[31m✗ Error:\\x1b[0m', error.message);
    process.exit(1);
  }
}

test();
EOF

node /tmp/test-ai-connection.js

if [ $? -eq 0 ]; then
    echo "${GREEN}✓${NC} Kết nối AI service thành công!"
else
    echo "${RED}✗${NC} Kết nối thất bại. Kiểm tra lại API key."
    exit 1
fi

echo ""

echo "${GREEN}[6/6]${NC} Hiển thị tóm tắt cấu hình..."
echo ""
echo "====================================================="
echo "${GREEN}CẤU HÌNH AI SERVICE THÀNH CÔNG!${NC}"
echo "====================================================="
echo ""
echo "Nhà cung cấp: ${YELLOW}$API_TYPE${NC}"
echo "API Key: ${API_KEY:0:10}...${API_KEY: -5}"

if [ "$API_TYPE" == "OPENAI" ]; then
    echo "Model: $OPENAI_MODEL"
fi

echo ""
echo "${YELLOW}Các API endpoints khả dụng:${NC}"
echo "  - POST /api/ai/sentiment     (Phân tích sentiment)"
echo "  - POST /api/ai/insights      (Tạo insights)"
echo "  - POST /api/ai/recommendations (Gợi ý cải thiện)"
echo "  - POST /api/ai/summary       (Tóm tắt nghiên cứu)"
echo "  - GET  /api/ai/sentiment     (Kiểm tra trạng thái)"
echo ""
echo "${YELLOW}Bước tiếp theo:${NC}"
echo "  1. Build ứng dụng: cd $APP_PATH && yarn build"
echo "  2. Chạy dev server: yarn dev"
echo "  3. Truy cập: http://localhost:3000"
echo "  4. Test trên dashboard: Dashboard -> Instructor -> Feedback Analysis"
echo ""
echo "${YELLOW}Tài liệu:${NC}"
echo "  - Hướng dẫn chi tiết: $PROJECT_PATH/HUONG_DAN_TRIEN_KHAI_DU_LIEU_THAT.md"
echo "  - Quick guide: $PROJECT_PATH/HUONG_DAN_NHANH_API_GPT.md"
echo ""
echo "====================================================="
echo "${GREEN}HOÀN TẤT!${NC}"
echo "====================================================="

# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG VỚI DỮ LIỆU THẬT
## Hệ thống Quản lý Big Data - Học viện Hậu cần

---

## MỤC LỤC

1. [Tổng quan 3 phương án](#tong-quan)
2. [Phương án 1: Máy chủ GPU Cloud (Thuê)](#phuong-an-1)
3. [Phương án 2: Máy chủ GPU LAN nội bộ](#phuong-an-2)
4. [Phương án 3: Sử dụng API GPT](#phuong-an-3)
5. [So sánh và khuyến nghị](#so-sanh)
6. [Hướng dẫn chuẩn bị dữ liệu thật](#du-lieu-that)
7. [Checklist triển khai](#checklist)

---

## 1. TỔNG QUAN 3 PHƯƠNG ÁN {#tong-quan}

### Bảng so sánh nhanh:

| Tiêu chí | GPU Cloud | GPU LAN | API GPT |
|----------|-----------|---------|----------|
| **Chi phí ban đầu** | Thấp | Rất cao | Không |
| **Chi phí vận hành** | Trung bình | Thấp | Cao |
| **Thời gian triển khai** | 1-2 ngày | 2-4 tuần | 2-4 giờ |
| **Bảo mật dữ liệu** | Trung bình | Rất cao | Thấp |
| **Khả năng mở rộng** | Rất cao | Hạn chế | Cao |
| **Kiểm soát** | Trung bình | Hoàn toàn | Hạn chế |
| **Phù hợp với** | Startup, Test | Quân đội | Prototype |

---

## 2. PHƯƠNG ÁN 1: MÁY CHỦ GPU CLOUD (THUÊ) {#phuong-an-1}

### 2.1. Nhà cung cấp phổ biến

#### A. AWS (Amazon Web Services)
- **Loại máy:** EC2 P3/P4 instances
- **GPU:** NVIDIA V100/A100
- **Chi phí:** $3-30/giờ tùy cấu hình
- **Ưu điểm:** Ổn định, nhiều dịch vụ hỗ trợ

#### B. Google Cloud Platform (GCP)
- **Loại máy:** Compute Engine + GPU
- **GPU:** NVIDIA T4/V100/A100
- **Chi phí:** $2-25/giờ
- **Ưu điểm:** Tích hợp TensorFlow tốt

#### C. Lambda Labs
- **GPU:** A100/H100
- **Chi phí:** $1.10-$2.49/giờ
- **Ưu điểm:** Giá rẻ, chuyên AI/ML

#### D. Vast.ai
- **GPU:** Đa dạng (GTX 3090, A6000...)
- **Chi phí:** $0.20-$2/giờ
- **Ưu điểm:** Rất rẻ, linh hoạt

### 2.2. Hướng dẫn triển khai trên AWS (Ví dụ)

#### Bước 1: Tạo EC2 Instance
```bash
# 1. Chọn AMI: Deep Learning AMI (Ubuntu 20.04)
# 2. Instance Type: p3.2xlarge (1x V100 16GB)
# 3. Storage: 100GB SSD
# 4. Security Group: Mở port 22, 80, 443, 3000, 5432
```

#### Bước 2: Kết nối và cài đặt
```bash
# SSH vào server
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Kiểm tra GPU
nvidia-smi

# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Cài đặt NVIDIA Docker
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt update && sudo apt install -y nvidia-docker2
sudo systemctl restart docker

# Test NVIDIA Docker
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu20.04 nvidia-smi
```

#### Bước 3: Deploy hệ thống
```bash
# Clone project (hoặc upload)
git clone <your-repo> hvhc_bigdata
cd hvhc_bigdata

# Copy file cấu hình
cp .env.example .env
nano .env  # Chỉnh sửa cấu hình

# Build và chạy
docker-compose up -d

# Kiểm tra
docker-compose ps
docker-compose logs -f
```

#### Bước 4: Cấu hình ML Engine với GPU
```yaml
# docker-compose.yml - Thêm GPU support
services:
  ml_engine:
    image: tensorflow/tensorflow:latest-gpu
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### 2.3. Ước tính chi phí (AWS p3.2xlarge)

```
Cấu hình: 1x V100 16GB, 8 vCPU, 61GB RAM
Giá: $3.06/giờ

Sử dụng 8 giờ/ngày (giờ hành chính):
- 1 ngày: $24.48
- 1 tháng (22 ngày làm việc): $538.56
- 1 năm: $6,462.72

Sử dụng 24/7:
- 1 tháng: $2,203.20
- 1 năm: $26,438.40
```

### 2.4. Tối ưu chi phí

1. **Sử dụng Spot Instances:** Giảm 70% chi phí
2. **Reserved Instances:** Giảm 40-60% khi cam kết 1-3 năm
3. **Auto-scaling:** Tắt máy ngoài giờ làm việc
4. **Lambda Labs/Vast.ai:** Rẻ hơn AWS 50-80%

---

## 3. PHƯƠNG ÁN 2: MÁY CHỦ GPU LAN NỘI BỘ {#phuong-an-2}

### 3.1. Yêu cầu phần cứng

#### Cấu hình tối thiểu (1 máy chủ)
```
CPU: Intel Xeon hoặc AMD EPYC (16+ cores)
RAM: 64GB DDR4
GPU: NVIDIA RTX 4090 24GB hoặc A6000 48GB
Storage: 
  - 1TB NVMe SSD (hệ thống)
  - 4TB HDD/SSD (dữ liệu)
Nguồn: 1200W+ 80 Plus Platinum
Case: 4U Rackmount
```

#### Cấu hình khuyến nghị (Production)
```
CPU: 2x Intel Xeon Gold (32 cores)
RAM: 256GB DDR4 ECC
GPU: 2x NVIDIA A100 80GB (NVLink)
Storage:
  - 2TB NVMe SSD RAID 1 (hệ thống)
  - 20TB SSD RAID 10 (dữ liệu)
  - 100TB HDD RAID 6 (backup)
Network: 10Gbps Ethernet
Redundancy: Dual PSU, RAID controller
```

### 3.2. Ước tính chi phí (1 lần)

#### Cấu hình tối thiểu:
```
Mainboard + CPU: $2,000
RAM 64GB: $300
GPU RTX 4090: $1,600
Storage: $500
Case + PSU: $400
Tổng: ~$4,800 (105 triệu VNĐ)
```

#### Cấu hình Production:
```
Server barebone: $3,000
CPU 2x Xeon: $4,000
RAM 256GB ECC: $1,500
GPU 2x A100: $25,000
Storage enterprise: $5,000
Network: $500
Tổng: ~$39,000 (910 triệu VNĐ)
```

### 3.3. Hướng dẫn cài đặt

#### Bước 1: Cài đặt Ubuntu Server 22.04
```bash
# Tạo USB boot Ubuntu Server
# Boot và cài đặt (chọn LVM + disk encryption nếu cần)

# Sau khi cài xong, cập nhật
sudo apt update && sudo apt upgrade -y

# Cài đặt SSH server
sudo apt install openssh-server -y
sudo systemctl enable ssh
```

#### Bước 2: Cài đặt NVIDIA Driver + CUDA
```bash
# Kiểm tra GPU
lspci | grep -i nvidia

# Cài NVIDIA driver
sudo apt install nvidia-driver-535 -y

# Reboot
sudo reboot

# Kiểm tra
nvidia-smi

# Cài CUDA Toolkit
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt update
sudo apt install cuda-toolkit-12-3 -y

# Thêm vào .bashrc
echo 'export PATH=/usr/local/cuda/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc

# Kiểm tra
nvcc --version
```

#### Bước 3: Cài đặt Docker + NVIDIA Container Toolkit
```bash
# Cài Docker (như hướng dẫn phương án 1)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt update
sudo apt install -y nvidia-container-toolkit

# Cấu hình Docker
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

# Test
docker run --rm --gpus all nvidia/cuda:12.3.0-base-ubuntu22.04 nvidia-smi
```

#### Bước 4: Deploy hệ thống
```bash
# Copy project từ máy dev
scp -r hvhc_bigdata_management user@server-ip:/home/user/

# SSH vào server
ssh user@server-ip
cd hvhc_bigdata_management

# Cấu hình
cp .env.example .env
nano .env

# Chạy
docker-compose -f docker-compose.gpu.yml up -d
```

### 3.4. Cấu hình mạng LAN

#### A. Cấu hình IP tĩnh
```bash
# /etc/netplan/00-installer-config.yaml
network:
  version: 2
  ethernets:
    eno1:
      addresses:
        - 192.168.1.100/24  # IP tĩnh cho server
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4

# Apply
sudo netplan apply
```

#### B. Cấu hình Firewall
```bash
# UFW
sudo ufw allow from 192.168.1.0/24 to any port 22
sudo ufw allow from 192.168.1.0/24 to any port 80
sudo ufw allow from 192.168.1.0/24 to any port 443
sudo ufw allow from 192.168.1.0/24 to any port 3000
sudo ufw allow from 192.168.1.0/24 to any port 5432
sudo ufw enable
```

#### C. Reverse Proxy (Nginx)
```bash
# Cài Nginx
sudo apt install nginx -y

# Cấu hình
sudo nano /etc/nginx/sites-available/bigdata
```

```nginx
server {
    listen 80;
    server_name bigdata.hvhc.local;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ml {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/bigdata /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### D. DNS nội bộ (Tùy chọn)
```bash
# Trên các máy client, thêm vào /etc/hosts (Linux/Mac)
# hoặc C:\Windows\System32\drivers\etc\hosts (Windows)
192.168.1.100  bigdata.hvhc.local
```

### 3.5. Backup và Disaster Recovery

```bash
# Script backup tự động
#!/bin/bash
# /home/user/backup.sh

BACKUP_DIR="/mnt/backup"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
docker exec postgres pg_dump -U postgres bigdata > $BACKUP_DIR/db_$DATE.sql

# Backup volumes
docker run --rm --volumes-from hvhc_web -v $BACKUP_DIR:/backup ubuntu tar czf /backup/volumes_$DATE.tar.gz /var/lib/docker/volumes

# Xóa backup cũ (giữ 30 ngày)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# Cron job - chạy mỗi đêm 2h sáng
crontab -e
# Thêm dòng:
0 2 * * * /home/user/backup.sh >> /var/log/backup.log 2>&1
```

---

## 4. PHƯƠNG ÁN 3: SỬ DỤNG API GPT {#phuong-an-3}

### 4.1. Tổng quan

Sử dụng API từ các nhà cung cấp:
- **OpenAI GPT-4/GPT-3.5**
- **Abacus AI** (đã tích hợp sẵn trong hệ thống)
- **Anthropic Claude**
- **Google Gemini**

### 4.2. Hướng dẫn cấu hình API GPT

#### A. Sử dụng OpenAI API

**Bước 1: Đăng ký và lấy API Key**
```
1. Truy cập: https://platform.openai.com/
2. Đăng ký tài khoản
3. Nạp credit (tối thiểu $5)
4. Vào API Keys → Create new secret key
5. Copy API key: sk-xxxxxxxxxxxxxxxx
```

**Bước 2: Cấu hình trong hệ thống**
```bash
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space
nano .env
```

Thêm vào `.env`:
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7

# Hoặc sử dụng Abacus AI (đã có sẵn)
ABACUSAI_API_KEY=your-abacus-api-key
```

**Bước 3: Cài đặt thư viện**
```bash
cd nextjs_space
yarn add openai
```

**Bước 4: Tạo API wrapper**
```bash
# File: nextjs_space/lib/ai-service.ts
```

#### B. Tích hợp vào hệ thống

**File cấu hình:**
```typescript
// nextjs_space/lib/ai-service.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeSentiment(text: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a sentiment analysis expert. Analyze the sentiment and return JSON with: sentiment (positive/negative/neutral), confidence (0-1), keywords (array).'
      },
      {
        role: 'user',
        content: `Analyze sentiment of this Vietnamese text: "${text}"`
      }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

export async function generateInsights(data: any) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a military education data analyst. Generate insights in Vietnamese.'
      },
      {
        role: 'user',
        content: `Analyze this training data and provide 3-5 actionable insights: ${JSON.stringify(data)}`
      }
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}

export async function generateRecommendations(studentData: any) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are an educational advisor for military academy. Provide personalized recommendations in Vietnamese.'
      },
      {
        role: 'user',
        content: `Based on this student performance data, suggest improvements: ${JSON.stringify(studentData)}`
      }
    ],
    temperature: 0.8,
  });

  return response.choices[0].message.content;
}

export async function summarizeResearch(text: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Summarize academic research papers in Vietnamese, highlighting key findings and methodologies.'
      },
      {
        role: 'user',
        content: `Summarize this research: ${text}`
      }
    ],
    temperature: 0.5,
    max_tokens: 1000,
  });

  return response.choices[0].message.content;
}
```

**API Routes:**
```typescript
// nextjs_space/app/api/ai/sentiment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeSentiment } from '@/lib/ai-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await req.json();
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const result = await analyzeSentiment(text);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Sentiment analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentiment', details: error.message },
      { status: 500 }
    );
  }
}
```

```typescript
// nextjs_space/app/api/ai/insights/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateInsights } from '@/lib/ai-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await req.json();
    
    const insights = await generateInsights(data);
    
    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error('Insights generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights', details: error.message },
      { status: 500 }
    );
  }
}
```

#### C. Tích hợp vào Dashboard

**Cập nhật Instructor Dashboard:**
```typescript
// nextjs_space/app/(dashboard)/dashboard/instructor/feedback-analysis/page.tsx
// Thêm vào component

const [aiInsights, setAiInsights] = useState<string>('');
const [isGenerating, setIsGenerating] = useState(false);

const generateAIInsights = async () => {
  setIsGenerating(true);
  try {
    const response = await fetch('/api/ai/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: feedbackData })
    });
    const result = await response.json();
    setAiInsights(result.insights);
  } catch (error) {
    console.error('Failed to generate insights:', error);
  } finally {
    setIsGenerating(false);
  }
};

// Trong JSX thêm button và hiển thị
<Button onClick={generateAIInsights} disabled={isGenerating}>
  {isGenerating ? 'Đang phân tích...' : 'Tạo Insights với AI'}
</Button>

{aiInsights && (
  <Card>
    <CardHeader>
      <CardTitle>AI Insights</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="prose max-w-none">
        {aiInsights}
      </div>
    </CardContent>
  </Card>
)}
```

### 4.3. Ước tính chi phí OpenAI

**Bảng giá (tháng 12/2024):**

| Model | Input | Output |
|-------|-------|--------|
| GPT-4 Turbo | $10/1M tokens | $30/1M tokens |
| GPT-3.5 Turbo | $0.50/1M tokens | $1.50/1M tokens |
| GPT-4o | $2.50/1M tokens | $10/1M tokens |

**Ước tính sử dụng:**

```
Giả sử:
- 100 giảng viên
- Mỗi người phân tích 50 feedback/tháng
- Trung bình 200 từ/feedback
- Sử dụng GPT-4 Turbo

Tính toán:
- Tổng feedback: 5,000/tháng
- Tổng tokens: ~1M input + 0.5M output
- Chi phí: (1M × $10) + (0.5M × $30) = $25/tháng

Nếu dùng GPT-3.5 Turbo:
- Chi phí: (1M × $0.50) + (0.5M × $1.50) = $1.25/tháng
```

### 4.4. Ưu điểm sử dụng Abacus AI API

```bash
# Đã có sẵn trong hệ thống
ABACUSAI_API_KEY=xxx  # Có sẵn trong .env

# Base URL
https://routellm.abacus.ai/v1

# Compatible với OpenAI SDK
const openai = new OpenAI({
  apiKey: process.env.ABACUSAI_API_KEY,
  baseURL: 'https://routellm.abacus.ai/v1'
});
```

**Ưu điểm:**
- ✅ Giá rẻ hơn OpenAI trực tiếp
- ✅ Tự động route đến model phù hợp
- ✅ Hỗ trợ nhiều model (GPT-4, Claude, Gemini...)
- ✅ Không cần quản lý nhiều API key

---

## 5. SO SÁNH VÀ KHUYẾN NGHỊ {#so-sanh}

### 5.1. Bảng so sánh chi tiết

| Tiêu chí | GPU Cloud | GPU LAN | API GPT |
|----------|-----------|---------|----------|
| **Chi phí ban đầu** | $0 | $5K-$40K | $0 |
| **Chi phí hàng tháng** | $500-$2,200 | $50-$100* | $10-$500 |
| **Thời gian setup** | 1-2 ngày | 2-4 tuần | 2-4 giờ |
| **Hiệu năng** | Cao | Rất cao | Phụ thuộc API |
| **Độ trễ** | 50-200ms | <10ms | 500-3000ms |
| **Bảo mật** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Kiểm soát** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Khả năng mở rộng** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Yêu cầu kỹ thuật** | Trung bình | Cao | Thấp |
| **Training model riêng** | ✅ | ✅ | ❌ |
| **Fine-tuning** | ✅ | ✅ | Hạn chế |
| **Offline hoạt động** | ❌ | ✅ | ❌ |

*Chi phí điện + bảo trì

### 5.2. Khuyến nghị cho Học viện Hậu cần

#### 🎯 **Phương án đề xuất: KẾT HỢP**

**Giai đoạn 1 (0-3 tháng): API GPT**
- Triển khai nhanh với Abacus AI API
- Test và thu thập feedback
- Chi phí thấp: ~$50-$100/tháng
- Đánh giá nhu cầu thực tế

**Giai đoạn 2 (3-6 tháng): GPU Cloud**
- Nếu sử dụng nhiều → thuê GPU cloud
- Lambda Labs hoặc Vast.ai (rẻ)
- Bắt đầu training model riêng
- Chi phí: ~$300-$500/tháng

**Giai đoạn 3 (6-12 tháng): GPU LAN**
- Khi đã ổn định và scale lớn
- Đầu tư server GPU nội bộ
- Bảo mật tốt nhất cho dữ liệu quân sự
- ROI break-even sau 12-18 tháng

**Kiến trúc lai (Hybrid):**
```
┌─────────────────────────────────────┐
│  Frontend (Next.js)                 │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   ┌───▼───┐      ┌────▼─────┐
   │ API   │      │ GPU LAN  │
   │ GPT   │      │ Server   │
   └───────┘      └──────────┘
       │                │
       └────────┬───────┘
                │
        ┌───────▼────────┐
        │  PostgreSQL    │
        │  (Data Lake)   │
        └────────────────┘

Logic:
- Sentiment Analysis → API GPT (nhanh, rẻ)
- Training ML models → GPU LAN (bảo mật)
- Heavy computation → GPU Cloud (khi cần)
```

---

## 6. HƯỚNG DẪN CHUẨN BỊ DỮ LIỆU THẬT {#du-lieu-that}

### 6.1. Chuẩn bị Database

#### A. Backup dữ liệu mẫu (quan trọng!)
```bash
cd /home/ubuntu/hvhc_bigdata_management

# Backup database hiện tại
docker exec postgres pg_dump -U postgres bigdata > backup_demo_$(date +%Y%m%d).sql

# Hoặc backup toàn bộ
docker-compose exec postgres pg_dumpall -U postgres > backup_full_$(date +%Y%m%d).sql
```

#### B. Xóa dữ liệu mẫu
```sql
-- Kết nối vào database
docker exec -it postgres psql -U postgres -d bigdata

-- Xóa dữ liệu mẫu (GIỮ NGUYÊN SCHEMA)
TRUNCATE TABLE 
  training_sessions,
  training_activities, 
  research_projects,
  research_papers,
  student_performance,
  feedback,
  ml_training_jobs,
  predictions,
  analytics_events
RESTART IDENTITY CASCADE;

-- KHÔNG xóa bảng users, roles, permissions
-- Chỉ xóa user demo
DELETE FROM users WHERE email LIKE '%@demo.hvhc.edu.vn';
```

### 6.2. Import dữ liệu thật

#### A. Từ Excel/CSV
```bash
# Chuẩn bị file CSV
# Format: training_sessions.csv
id,name,instructor_id,start_date,end_date,status
1,"Đào tạo Hậu cần Quân sự",5,2024-01-15,2024-06-15,active

# Import vào database
docker cp training_sessions.csv postgres:/tmp/
docker exec -it postgres psql -U postgres -d bigdata -c "
  COPY training_sessions(id,name,instructor_id,start_date,end_date,status) 
  FROM '/tmp/training_sessions.csv' 
  DELIMITER ',' 
  CSV HEADER;
"
```

#### B. Từ hệ thống cũ (MySQL, SQL Server...)
```bash
# Export từ hệ thống cũ
mysqldump -u user -p old_database > old_data.sql

# Convert MySQL → PostgreSQL
# Sử dụng: https://github.com/AnatolyUss/nmig
# Hoặc pgloader

apt install pgloader
pgloader mysql://user:pass@localhost/old_db postgresql://postgres:pass@localhost/bigdata
```

#### C. Từ API/Web scraping
```python
# Script import tự động
import psycopg2
import requests

# Kết nối database
conn = psycopg2.connect(
    host="localhost",
    database="bigdata",
    user="postgres",
    password="your_password"
)
cur = conn.cursor()

# Fetch data từ API cũ
response = requests.get('https://old-system.hvhc.edu.vn/api/training')
data = response.json()

# Insert vào database mới
for item in data:
    cur.execute(
        "INSERT INTO training_sessions (name, instructor_id, start_date) VALUES (%s, %s, %s)",
        (item['name'], item['instructor_id'], item['start_date'])
    )

conn.commit()
cur.close()
conn.close()
```

### 6.3. Tạo users thật

```sql
-- Kết nối database
docker exec -it postgres psql -U postgres -d bigdata

-- Tạo users thật
INSERT INTO users (email, name, password_hash, role, created_at) VALUES
  ('chihuy@hvhc.edu.vn', 'Thiếu tướng Nguyễn Văn A', '$2a$10$...', 'command', NOW()),
  ('truongkhoa@hvhc.edu.vn', 'Đại tá Trần Văn B', '$2a$10$...', 'faculty_leadership', NOW()),
  ('giangvien1@hvhc.edu.vn', 'Thượng tá Lê Văn C', '$2a$10$...', 'instructor', NOW());

-- Password mặc định: HVHC@2024
-- Hash bcrypt: $2a$10$YourHashHere
```

**Tạo password hash:**
```javascript
// Node.js script
const bcrypt = require('bcryptjs');
const password = 'HVHC@2024';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

### 6.4. Cấu hình môi trường production

```bash
# .env.production
NODE_ENV=production

# Database
DATABASE_URL="postgresql://postgres:StrongPass123!@localhost:5432/bigdata"

# Security
NEXTAUTH_SECRET="generate-a-strong-secret-here"  # openssl rand -base64 32
NEXTAUTH_URL="https://bigdata.hvhc.edu.vn"

# API Keys
OPENAI_API_KEY="sk-xxx"  # hoặc ABACUSAI_API_KEY

# Email (nếu có)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="noreply@hvhc.edu.vn"
SMTP_PASS="xxx"

# Storage
AWS_BUCKET_NAME="hvhc-bigdata"
AWS_FOLDER_PREFIX="production/"

# Logging
LOG_LEVEL="info"
ENABLE_AUDIT_LOG="true"
```

---

## 7. CHECKLIST TRIỂN KHAI {#checklist}

### 7.1. Trước khi triển khai

- [ ] **Backup toàn bộ dữ liệu hiện tại**
- [ ] **Chuẩn bị dữ liệu thật (CSV/Excel/SQL)**
- [ ] **Tạo danh sách users thật**
- [ ] **Quyết định phương án (Cloud/LAN/API)**
- [ ] **Chuẩn bị môi trường (server/VM)**
- [ ] **Cấu hình mạng (IP, firewall, DNS)**
- [ ] **Mua/đăng ký dịch vụ (nếu cần)**
- [ ] **Test kết nối và bảo mật**

### 7.2. Trong quá trình triển khai

- [ ] **Cài đặt OS và driver**
- [ ] **Cài đặt Docker + NVIDIA toolkit**
- [ ] **Clone/upload source code**
- [ ] **Cấu hình .env production**
- [ ] **Import dữ liệu thật**
- [ ] **Tạo users và phân quyền**
- [ ] **Chạy migration database**
- [ ] **Build và deploy ứng dụng**
- [ ] **Cấu hình reverse proxy (Nginx)**
- [ ] **Cấu hình SSL certificate**
- [ ] **Setup backup tự động**
- [ ] **Cấu hình monitoring (Prometheus/Grafana)**

### 7.3. Sau khi triển khai

- [ ] **Kiểm tra tất cả chức năng**
- [ ] **Test với users thật**
- [ ] **Đào tạo người dùng**
- [ ] **Tài liệu hướng dẫn sử dụng**
- [ ] **Thiết lập quy trình support**
- [ ] **Monitor performance 24/7**
- [ ] **Lên lịch backup định kỳ**
- [ ] **Review và tối ưu hàng tuần**

### 7.4. Bảo mật (Quan trọng với quân đội!)

- [ ] **Thay đổi tất cả password mặc định**
- [ ] **Bật 2FA cho admin accounts**
- [ ] **Cấu hình firewall chặt chẽ**
- [ ] **Encrypt database**
- [ ] **SSL/TLS cho tất cả connection**
- [ ] **Audit logs cho mọi thao tác**
- [ ] **Định kỳ scan lỗ hổng bảo mật**
- [ ] **Network segmentation (DMZ)**
- [ ] **Intrusion Detection System (IDS)**
- [ ] **Chính sách backup offline**

---

## 8. HỖ TRỢ VÀ TROUBLESHOOTING

### 8.1. Các vấn đề thường gặp

**Lỗi: GPU not detected**
```bash
# Kiểm tra
nvidia-smi
lsmod | grep nvidia

# Fix
sudo apt install nvidia-driver-535 -y
sudo reboot
```

**Lỗi: Docker can't access GPU**
```bash
# Cài lại NVIDIA Container Toolkit
sudo apt remove nvidia-docker2
sudo apt install nvidia-container-toolkit -y
sudo systemctl restart docker
```

**Lỗi: Out of memory**
```bash
# Tăng swap
sudo fallocate -l 32G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

**Lỗi: OpenAI API rate limit**
```bash
# Implement retry logic
# Giảm số request
# Nâng cấp plan
```

### 8.2. Liên hệ hỗ trợ

**Kỹ thuật:**
- GitHub Issues
- Email: support@hvhc.edu.vn
- Hotline: 024.xxx.xxxx

**Khẩn cấp:**
- Slack channel: #bigdata-support
- On-call engineer: +84.xxx.xxx.xxx

---

## PHỤ LỤC

### A. Script triển khai tự động

```bash
#!/bin/bash
# deploy.sh - Auto deployment script

set -e

echo "=== HVHC Big Data Deployment ==="

# 1. Update system
echo "[1/10] Updating system..."
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
echo "[2/10] Installing Docker..."
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. Install NVIDIA drivers
echo "[3/10] Installing NVIDIA drivers..."
sudo apt install nvidia-driver-535 -y

# 4. Install NVIDIA Container Toolkit
echo "[4/10] Installing NVIDIA Container Toolkit..."
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
sudo apt update && sudo apt install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

# 5. Clone project
echo "[5/10] Cloning project..."
cd ~
git clone https://github.com/hvhc/bigdata-management.git
cd bigdata-management

# 6. Configure environment
echo "[6/10] Configuring environment..."
cp .env.example .env
read -p "Enter OPENAI_API_KEY: " api_key
sed -i "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$api_key/" .env

# 7. Build images
echo "[7/10] Building Docker images..."
docker-compose build

# 8. Start services
echo "[8/10] Starting services..."
docker-compose up -d

# 9. Run migrations
echo "[9/10] Running database migrations..."
sleep 10
docker-compose exec web npx prisma migrate deploy

# 10. Health check
echo "[10/10] Health check..."
curl -f http://localhost:3000/api/health || echo "Warning: Health check failed"

echo ""
echo "=== Deployment Complete ==="
echo "Access: http://$(hostname -I | awk '{print $1}'):3000"
echo "Default login: admin@hvhc.edu.vn / HVHC@2024"
```

### B. Monitoring với Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false

  node_exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"

  nvidia_gpu_exporter:
    image: mindprince/nvidia_gpu_prometheus_exporter:latest
    runtime: nvidia
    ports:
      - "9445:9445"

volumes:
  prometheus_data:
  grafana_data:
```

---

**Tài liệu được tạo:** Tháng 12/2024  
**Phiên bản:** 1.0  
**Người soạn:** AI Assistant  
**Đơn vị:** Học viện Hậu cần  

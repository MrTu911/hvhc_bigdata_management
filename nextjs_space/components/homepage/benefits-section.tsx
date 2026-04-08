
'use client';

import { Card } from '@/components/ui/card';
import { Shield, Zap, Globe, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';

export default function BenefitsSection() {
  const { t } = useLanguage();

  const translations = {
    vi: {
      sectionTitle: 'Lợi ích & Ứng dụng',
      sectionSubtitle: 'Những giá trị mà hệ thống mang lại cho nghiên cứu và đào tạo',
      benefits: [
        {
          icon: <TrendingUp className="h-8 w-8" />,
          title: 'Hỗ trợ nghiên cứu khoa học',
          description: 'Phục vụ các đề tài nghiên cứu cấp bộ, luận văn và báo cáo khoa học quốc tế với nền tảng dữ liệu mạnh mẽ.'
        },
        {
          icon: <Globe className="h-8 w-8" />,
          title: 'Liên kết hệ thống quân đội',
          description: 'Tích hợp với hệ thống quân đội, hỗ trợ đào tạo hậu cần thực tế và nâng cao hiệu quả huấn luyện.'
        },
        {
          icon: <Shield className="h-8 w-8" />,
          title: 'An ninh & Bảo mật cao',
          description: 'Đảm bảo an ninh dữ liệu theo chuẩn quốc phòng với các biện pháp bảo mật tiên tiến nhất.'
        },
        {
          icon: <Zap className="h-8 w-8" />,
          title: 'Mở rộng mô hình AI',
          description: 'Hỗ trợ huấn luyện mô hình AI/ML từ dữ liệu lớn, thúc đẩy nghiên cứu công nghệ tiên tiến.'
        }
      ]
    },
    en: {
      sectionTitle: 'Benefits & Applications',
      sectionSubtitle: 'The value that the system brings to research and training',
      benefits: [
        {
          icon: <TrendingUp className="h-8 w-8" />,
          title: 'Scientific Research Support',
          description: 'Serve ministerial-level research projects, theses and international scientific reports with a powerful data platform.'
        },
        {
          icon: <Globe className="h-8 w-8" />,
          title: 'Military System Integration',
          description: 'Integrate with military systems, support practical logistics training and improve training effectiveness.'
        },
        {
          icon: <Shield className="h-8 w-8" />,
          title: 'High Security & Privacy',
          description: 'Ensure data security according to defense standards with the most advanced security measures.'
        },
        {
          icon: <Zap className="h-8 w-8" />,
          title: 'AI Model Expansion',
          description: 'Support training AI/ML models from big data, promoting advanced technology research.'
        }
      ]
    }
  };

  const lang = t('code') as 'vi' | 'en';
  const tr = translations[lang] || translations.vi;

  return (
    <section id="about" className="py-16 bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {tr.sectionTitle}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {tr.sectionSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {tr.benefits.map((benefit, index) => (
            <Card
              key={index}
              className="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white flex-shrink-0">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

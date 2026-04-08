
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';

export default function NewsSection() {
  const { t } = useLanguage();

  const translations = {
    vi: {
      sectionTitle: 'Tin tức & Thông báo',
      sectionSubtitle: 'Cập nhật thông tin mới nhất từ Học viện Hậu cần',
      readMore: 'Đọc thêm',
      news: [
        {
          date: '2025-10-01',
          category: 'Thông báo',
          title: 'Học viện Hậu cần tuyển sinh năm 2025',
          excerpt: 'Học viện Hậu cần thông báo tuyển sinh các khóa đào tạo năm 2025 với nhiều chuyên ngành...'
        },
        {
          date: '2025-09-28',
          category: 'Nghiên cứu',
          title: 'Hệ thống BigData phục vụ nghiên cứu khoa học',
          excerpt: 'Triển khai thành công hệ thống quản lý dữ liệu lớn phục vụ các đề tài nghiên cứu...'
        },
        {
          date: '2025-09-25',
          category: 'Sự kiện',
          title: 'Hội thảo ứng dụng AI trong hậu cần quân sự',
          excerpt: 'Học viện tổ chức hội thảo về ứng dụng trí tuệ nhân tạo và công nghệ BigData...'
        }
      ]
    },
    en: {
      sectionTitle: 'News & Announcements',
      sectionSubtitle: 'Latest updates from the Logistics Academy',
      readMore: 'Read more',
      news: [
        {
          date: '2025-10-01',
          category: 'Announcement',
          title: 'Logistics Academy Enrollment 2025',
          excerpt: 'The Logistics Academy announces enrollment for 2025 training courses with various specializations...'
        },
        {
          date: '2025-09-28',
          category: 'Research',
          title: 'BigData System for Scientific Research',
          excerpt: 'Successfully deployed a large-scale data management system for research projects...'
        },
        {
          date: '2025-09-25',
          category: 'Event',
          title: 'AI Applications in Military Logistics Workshop',
          excerpt: 'The Academy organizes a workshop on AI applications and BigData technology...'
        }
      ]
    }
  };

  const lang = t('code') as 'vi' | 'en';
  const tr = translations[lang] || translations.vi;

  return (
    <section className="py-16 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {tr.sectionTitle}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {tr.sectionSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tr.news.map((item, index) => (
            <Card
              key={index}
              className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {item.category}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {item.date}
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>

                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {item.excerpt}
                </p>

                <Link
                  href="#"
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm group-hover:translate-x-1 transition-transform"
                >
                  {tr.readMore}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

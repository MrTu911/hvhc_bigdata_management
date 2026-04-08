'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/language-provider';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();
  const lang = t('code') as 'vi' | 'en';
  
  const currentYear = new Date().getFullYear();

  return (
    <footer id="about" className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative w-14 h-14">
                <Image
                  src="/images/logo_hvhc.png"
                  alt="Logo HVHC - Footer"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {lang === 'vi' ? 'HỌC VIỆN HẬU CẦN' : 'LOGISTICS ACADEMY'}
                </div>
                <div className="text-sm text-slate-400">
                  {lang === 'vi' ? 'Bộ Quốc phòng' : 'Ministry of National Defense'}
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-md">
              {lang === 'vi' 
                ? 'Hệ thống Cơ sở dữ liệu lớn phục vụ công tác nghiên cứu và huấn luyện tại Học viện Hậu cần.'
                : 'BigData Management System for research and training at Logistics Academy.'
              }
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">
              {lang === 'vi' ? 'Liên hệ' : 'Contact'}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-sm text-slate-400">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-red-500" />
                <span>
                  {lang === 'vi' 
                    ? 'Ngọc Thụy, Long Biên, Hà Nội'
                    : 'Ngoc Thuy, Long Bien, Hanoi'
                  }
                </span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-slate-400">
                <Phone className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span>(024) 3827 1234</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-slate-400">
                <Mail className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span>hvhc@mod.gov.vn</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-slate-400">
                <Globe className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span>www.hvhc.edu.vn</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">
              {lang === 'vi' ? 'Truy cập nhanh' : 'Quick Links'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
                  {lang === 'vi' ? 'Đăng nhập hệ thống' : 'Login'}
                </Link>
              </li>
              <li>
                <Link href="#modules" className="text-sm text-slate-400 hover:text-white transition-colors">
                  {lang === 'vi' ? 'Các phân hệ' : 'Modules'}
                </Link>
              </li>
              <li>
                <Link href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">
                  {lang === 'vi' ? 'Tính năng' : 'Features'}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
            <p>
              © {currentYear} {lang === 'vi' ? 'Học viện Hậu cần' : 'Logistics Academy'}. 
              {lang === 'vi' ? ' Bản quyền thuộc về Bộ Quốc phòng.' : ' All rights reserved.'}
            </p>
            <p className="mt-2 md:mt-0">
              BigData Management System v8.0
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
